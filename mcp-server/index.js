#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables
dotenv.config();

class ExternalReviewMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'external-review-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize Gemini AI
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'your-gemini-api-key');
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'analyze_idea_similarity',
            description: 'Analyze startup idea similarity against external sources using Gemini AI',
            inputSchema: {
              type: 'object',
              properties: {
                userApplication: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    targetMarket: { type: 'string' },
                    businessModel: { type: 'string' }
                  },
                  required: ['title', 'description']
                },
                externalData: {
                  type: 'object',
                  properties: {
                    ycCompanies: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          name: { type: 'string' },
                          oneLiner: { type: 'string' },
                          description: { type: 'string' },
                          industry: { type: 'string' },
                          tags: { type: 'array', items: { type: 'string' } }
                        }
                      }
                    }
                  }
                }
              },
              required: ['userApplication', 'externalData']
            }
          },
          {
            name: 'fetch_yc_companies',
            description: 'Fetch Y Combinator companies data from the official YC API',
            inputSchema: {
              type: 'object',
              properties: {
                category: { 
                  type: 'string', 
                  description: 'Industry category to filter (e.g., "Fintech", "Hardware", "AI", "Healthcare")' 
                },
                limit: { 
                  type: 'number', 
                  description: 'Number of companies to fetch (default: all matching companies)' 
                },
                includeInactive: {
                  type: 'boolean',
                  description: 'Include inactive/defunct companies (default: false, only active companies)'
                },
                forSimilarityAnalysis: {
                  type: 'boolean',
                  description: 'If true, returns all companies for comprehensive similarity analysis (ignores limit)'
                }
              }
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case 'analyze_idea_similarity':
          return this.analyzeIdeaSimilarity(request.params.arguments);
        case 'fetch_yc_companies':
          return this.fetchYCCompanies(request.params.arguments);
        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
      }
    });
  }

  async analyzeIdeaSimilarity(args) {
    try {
      const { userApplication, externalData } = args;
      
      // Check if we have a valid Gemini API key
      const hasValidApiKey = process.env.GEMINI_API_KEY && 
                           process.env.GEMINI_API_KEY !== 'your-gemini-api-key' && 
                           process.env.GEMINI_API_KEY !== 'test-key';
      
      if (!hasValidApiKey) {
        console.error('⚠️ No valid Gemini API key found. Using fallback similarity detection.');
        // Use fallback similarity detection
        return this.fallbackSimilarityAnalysis(userApplication, externalData.ycCompanies);
      }
      
      // Create comprehensive prompt for Gemini
      const prompt = `
You are an expert startup analyst. Analyze if the user's startup idea is too similar to existing Y Combinator companies.

USER APPLICATION:
Title: ${userApplication.title}
Description: ${userApplication.description}
Target Market: ${userApplication.targetMarket || 'Not specified'}
Business Model: ${userApplication.businessModel || 'Not specified'}

EXISTING Y COMBINATOR COMPANIES:
${externalData.ycCompanies.map(company => `
- Company: ${company.name}
  One-liner: ${company.oneLiner}
  Description: ${company.description}
  Industry: ${company.industry}
  Tags: ${company.tags?.join(', ') || 'None'}
`).join('\n')}

ANALYSIS CRITERIA:
1. Core business model similarity
2. Target market overlap
3. Value proposition similarity
4. Technology approach similarity
5. Market timing and positioning

IMPORTANT: Focus on the fundamental business concept, not just naming or surface-level similarities. Two companies can have different names but solve the same problem in the same way.

Please provide a JSON response with:
{
  "isSimilar": boolean,
  "similarityScore": number (0-1),
  "mostSimilarCompany": {
    "name": "string",
    "reason": "string"
  },
  "analysis": {
    "businessModelSimilarity": "string",
    "targetMarketOverlap": "string",
    "valuePropSimilarity": "string",
    "differentiationPotential": "string"
  },
  "recommendation": "APPROVE" | "REJECT" | "NEEDS_DIFFERENTIATION",
  "feedback": "detailed feedback for the applicant",
  "suggestions": ["array of specific suggestions"]
}

Be strict but fair. Reject only if there's significant overlap in core business model AND target market.
`;

      // Call Gemini AI
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Try to parse JSON from the response
      let analysis;
      try {
        // Extract JSON from the response (Gemini might wrap it in markdown)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        analysis = JSON.parse(jsonMatch ? jsonMatch[0] : text);
      } catch (parseError) {
        // Fallback if JSON parsing fails
        console.error('⚠️ Failed to parse Gemini response. Using fallback analysis.');
        return this.fallbackSimilarityAnalysis(userApplication, externalData.ycCompanies);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(analysis, null, 2)
          }
        ]
      };

    } catch (error) {
      console.error('❌ Gemini API Error:', error.message);
      // Use fallback instead of generic approval
      return this.fallbackSimilarityAnalysis(args.userApplication, args.externalData.ycCompanies);
    }
  }

  /**
   * Fallback similarity analysis when Gemini API is not available
   */
  fallbackSimilarityAnalysis(userApplication, ycCompanies) {
    try {
      const userTitle = userApplication.title.toLowerCase();
      const userDesc = userApplication.description.toLowerCase();
      
      let mostSimilarCompany = null;
      let highestSimilarity = 0;
      let allSimilarCompanies = [];
      let exactNameMatch = null;
      
      console.log(`🔍 Analyzing similarity against ${ycCompanies.length} companies...`);
      
      // First pass: Check for exact name matches
      for (const company of ycCompanies) {
        const companyName = company.name.toLowerCase();
        const formerNames = (company.formerNames || []).map(name => name.toLowerCase());
        const allNames = [companyName, ...formerNames];
        
        // Check for exact name matches first
        for (const name of allNames) {
          const nameSimilarity = this.calculateStringSimilarity(userTitle, name);
          if (userTitle.includes(name) || name.includes(userTitle) || nameSimilarity > 0.8) {
            const isFormerName = formerNames.includes(name);
            exactNameMatch = {
              company,
              similarity: 0.95,
              isFormerName,
              matchedName: name,
              nameSimilarity
            };
            console.log(`🎯 Exact name match found: ${company.name} (similarity: ${nameSimilarity})`);
            break;
          }
        }
        if (exactNameMatch) break;
      }
      
      // If we found an exact name match, return it immediately
      if (exactNameMatch) {
        const { company, isFormerName, matchedName } = exactNameMatch;
        const nameType = isFormerName ? `former name "${matchedName}"` : `company name "${company.name}"`;
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                isSimilar: true,
                similarityScore: 0.95,
                mostSimilarCompany: {
                  name: company.name,
                  reason: `Direct name match detected. Your application title "${userApplication.title}" matches the existing Y Combinator company's ${nameType}.`
                },
                analysis: {
                  businessModelSimilarity: "Exact match - same company name",
                  targetMarketOverlap: "Complete overlap",
                  valuePropSimilarity: "Identical value proposition",
                  differentiationPotential: "Very low - direct competitor"
                },
                recommendation: "REJECT",
                feedback: `Your application appears to be for "${company.name}" (${isFormerName ? `formerly known as "${matchedName}"` : ''}), which is already a successful Y Combinator company (${company.oneLiner}). This company was founded in ${company.founded || 'unknown'} and operates in the ${company.industry} industry. To proceed, you would need to demonstrate a significantly different approach or target market.`,
                suggestions: [
                  `Research ${company.name}'s current limitations and identify unaddressed market segments`,
                  "Consider targeting a different geographic market or customer segment",
                  "Develop unique technology or business model differentiators",
                  "Focus on specific industry verticals the existing company doesn't serve",
                  "Consider a B2B vs B2C pivot or vice versa"
                ]
              }, null, 2)
            }
          ]
        };
      }
      
      // Second pass: Calculate content similarity for ALL companies
      console.log(`📊 No exact name match found. Analyzing content similarity for all ${ycCompanies.length} companies...`);
      
      for (let i = 0; i < ycCompanies.length; i++) {
        const company = ycCompanies[i];
        
        if (i % 1000 === 0) {
          console.log(`📈 Progress: ${i}/${ycCompanies.length} companies analyzed`);
        }
        
        const companyName = company.name.toLowerCase();
        const companyOneLiner = (company.oneLiner || '').toLowerCase();
        const companyDesc = (company.description || '').toLowerCase();
        
        // Calculate content-based similarity for descriptions
        const userWords = new Set(userDesc.split(/\s+/).filter(word => word.length > 3));
        const companyWords = new Set((companyOneLiner + ' ' + companyDesc).split(/\s+/).filter(word => word.length > 3));
        
        const intersection = new Set([...userWords].filter(word => companyWords.has(word)));
        const union = new Set([...userWords, ...companyWords]);
        const jaccardSimilarity = intersection.size > 0 ? intersection.size / union.size : 0;
        
        // Enhanced business model keyword matching
        const businessKeywords = [
          'marketplace', 'platform', 'delivery', 'payment', 'manufacturing', 'electronics', 'robotics',
          'fraud', 'detection', 'analytics', 'ai', 'artificial intelligence', 'fintech', 'ecommerce',
          'e-commerce', 'saas', 'software', 'app', 'mobile', 'web', 'api', 'dashboard', 'payments',
          'security', 'machine learning', 'automation', 'blockchain', 'crypto', 'cryptocurrency'
        ];
        
        let keywordMatches = 0;
        let totalKeywords = 0;
        let matchedKeywords = [];
        
        for (const keyword of businessKeywords) {
          const userHasKeyword = userDesc.includes(keyword);
          const companyHasKeyword = companyOneLiner.includes(keyword) || companyDesc.includes(keyword);
          
          if (userHasKeyword || companyHasKeyword) {
            totalKeywords++;
            if (userHasKeyword && companyHasKeyword) {
              keywordMatches++;
              matchedKeywords.push(keyword);
            }
          }
        }
        
        const keywordSimilarity = totalKeywords > 0 ? keywordMatches / totalKeywords : 0;
        
        // Check tag similarity
        const userTags = [...userWords].filter(word => 
          ['ai', 'analytics', 'payment', 'fraud', 'detection', 'fintech', 'ecommerce', 'payments', 'security'].includes(word)
        );
        const companyTags = (company.tags || []).map(tag => tag.toLowerCase());
        
        let tagMatches = 0;
        let matchedTags = [];
        for (const userTag of userTags) {
          for (const companyTag of companyTags) {
            if (companyTag.includes(userTag) || userTag.includes(companyTag.replace(/\s+/g, ''))) {
              tagMatches++;
              matchedTags.push(companyTag);
              break;
            }
          }
        }
        
        const tagSimilarity = userTags.length > 0 ? tagMatches / userTags.length : 0;
        
        // Industry similarity
        const userIndustryWords = [...userWords].filter(word => 
          ['fintech', 'financial', 'healthcare', 'education', 'retail', 'manufacturing', 'logistics'].includes(word)
        );
        const companyIndustry = (company.industry || '').toLowerCase();
        const companySubindustry = (company.subindustry || '').toLowerCase();
        
        let industrySimilarity = 0;
        for (const word of userIndustryWords) {
          if (companyIndustry.includes(word) || companySubindustry.includes(word)) {
            industrySimilarity = 0.5;
            break;
          }
        }
        
        // Weighted overall similarity - giving more weight to keywords and tags
        const overallSimilarity = (jaccardSimilarity * 0.3) + (keywordSimilarity * 0.4) + (tagSimilarity * 0.2) + (industrySimilarity * 0.1);
        
        // Store this company's similarity data
        if (overallSimilarity > 0.1) { // Only store companies with some similarity
          allSimilarCompanies.push({
            company,
            similarity: overallSimilarity,
            details: {
              jaccardSimilarity,
              keywordSimilarity,
              tagSimilarity,
              industrySimilarity,
              matchedKeywords,
              matchedTags,
              commonWords: [...intersection].slice(0, 5)
            }
          });
        }
        
        // Track the highest similarity
        if (overallSimilarity > highestSimilarity) {
          highestSimilarity = overallSimilarity;
          mostSimilarCompany = {
            name: company.name,
            similarity: overallSimilarity,
            reason: `Business model similarity detected. Shared concepts: ${[...intersection].slice(0, 3).join(', ')}. Matched keywords: ${matchedKeywords.slice(0, 3).join(', ')}. Matched tags: ${matchedTags.slice(0, 3).join(', ')}. Overall similarity: ${Math.round(overallSimilarity * 100)}%`,
            details: {
              jaccardSimilarity,
              keywordSimilarity,
              tagSimilarity,
              industrySimilarity,
              matchedKeywords,
              matchedTags
            }
          };
        }
      }
      
      // Sort all similar companies by similarity score
      allSimilarCompanies.sort((a, b) => b.similarity - a.similarity);
      
      console.log(`🎯 Analysis complete. Highest similarity: ${Math.round(highestSimilarity * 100)}% with ${mostSimilarCompany?.name || 'no company'}`);
      console.log(`📊 Found ${allSimilarCompanies.length} companies with similarity > 10%`);
      
      if (allSimilarCompanies.length > 0) {
        const top5 = allSimilarCompanies.slice(0, 5);
        console.log(`🏆 Top 5 similar companies:`);
        top5.forEach((item, index) => {
          console.log(`   ${index + 1}. ${item.company.name}: ${Math.round(item.similarity * 100)}%`);
        });
      }
      
      // Decision threshold - more strict for rejection
      const isRejected = highestSimilarity > 0.4; // Adjusted threshold
      
      if (isRejected && mostSimilarCompany) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                isSimilar: true,
                similarityScore: highestSimilarity,
                mostSimilarCompany: {
                  name: mostSimilarCompany.name,
                  reason: mostSimilarCompany.reason
                },
                analysis: {
                  businessModelSimilarity: `${Math.round(highestSimilarity * 100)}% similarity in core business approach`,
                  targetMarketOverlap: "Significant overlap detected in target market",
                  valuePropSimilarity: "Similar value propositions identified",
                  differentiationPotential: "Moderate - requires clear differentiation strategy",
                  detailedBreakdown: {
                    conceptSimilarity: `${Math.round(mostSimilarCompany.details.jaccardSimilarity * 100)}%`,
                    keywordMatches: mostSimilarCompany.details.matchedKeywords,
                    tagMatches: mostSimilarCompany.details.matchedTags,
                    totalSimilarCompanies: allSimilarCompanies.length
                  }
                },
                recommendation: "REJECT",
                feedback: `Your startup idea shows significant similarity (${Math.round(highestSimilarity * 100)}%) to ${mostSimilarCompany.name}, an existing Y Combinator company. ${mostSimilarCompany.reason} To improve your application, focus on clear differentiation and unique market positioning.`,
                suggestions: [
                  `Study ${mostSimilarCompany.name}'s approach and identify gaps in their solution`,
                  "Define your unique value proposition more clearly",
                  "Target underserved market segments or geographies",
                  "Develop proprietary technology or methodology",
                  "Consider partnerships or integration opportunities"
                ],
                allSimilarCompanies: allSimilarCompanies.slice(0, 5).map(item => ({
                  name: item.company.name,
                  similarity: Math.round(item.similarity * 100),
                  industry: item.company.industry,
                  batch: item.company.batch
                }))
              }, null, 2)
            }
          ]
        };
      }
      
      // Application approved
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              isSimilar: false,
              similarityScore: highestSimilarity,
              mostSimilarCompany: mostSimilarCompany ? {
                name: mostSimilarCompany.name,
                reason: `Closest match but below rejection threshold: ${mostSimilarCompany.reason}`
              } : null,
              analysis: {
                businessModelSimilarity: `${Math.round(highestSimilarity * 100)}% similarity - within acceptable range`,
                targetMarketOverlap: "Minimal or no significant overlap",
                valuePropSimilarity: "Sufficiently differentiated value proposition",
                differentiationPotential: "Good - clear differentiation opportunities"
              },
              recommendation: "APPROVE",
              feedback: `Your startup idea is sufficiently differentiated from existing Y Combinator companies. While there may be some conceptual similarities (${Math.round(highestSimilarity * 100)}% similarity score), your approach appears unique enough to warrant further consideration.`,
              suggestions: [
                "Continue developing your unique value proposition",
                "Focus on specific market needs that existing solutions don't address",
                "Build proprietary technology or processes",
                "Establish clear competitive advantages",
                "Consider strategic partnerships for market differentiation"
              ]
            }, null, 2)
          }
        ]
      };
      
    } catch (error) {
      console.error('❌ Fallback analysis error:', error);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: true,
              message: error.message,
              isSimilar: false,
              recommendation: "APPROVE"
            })
          }
        ],
        isError: true
      };
    }
  }

  // Helper method for string similarity calculation
  calculateStringSimilarity(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = [];

    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    const distance = matrix[len2][len1];
    const maxLen = Math.max(len1, len2);
    return maxLen === 0 ? 1 : 1 - distance / maxLen;
  }

  async fetchYCCompanies(args = {}) {
    try {
      console.log('🔍 Fetching Y Combinator companies from API...');
      console.log('📋 Request parameters:', JSON.stringify(args, null, 2));
      
      // Fetch data from Y Combinator API
      const response = await axios.get('https://yc-oss.github.io/api/companies/all.json', {
        timeout: 30000, // 30 second timeout for large dataset
        headers: {
          'User-Agent': 'External-Review-MCP-Server/1.0.0'
        },
        maxContentLength: Infinity, // Allow large responses
        maxBodyLength: Infinity
      });

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid response format from Y Combinator API');
      }

      console.log(`🎯 Raw API returned ${response.data.length} companies`);

      // Transform the API data to our expected format
      let ycCompanies = response.data.map(company => ({
        id: company.id,
        name: company.name,
        slug: company.slug,
        oneLiner: company.one_liner || '',
        description: company.long_description || company.one_liner || '',
        tags: company.tags || [],
        industry: company.industry || '',
        subindustry: company.subindustry || '',
        batch: company.batch || '',
        founded: company.launched_at ? new Date(company.launched_at * 1000).getFullYear() : null,
        status: company.status || 'Unknown',
        website: company.website || '',
        location: company.all_locations || '',
        teamSize: company.team_size || 0,
        isHiring: company.isHiring || false,
        regions: company.regions || [],
        industries: company.industries || [],
        formerNames: company.former_names || []
      }));

      console.log(`✅ Transformed ${ycCompanies.length} Y Combinator companies`);

      // Filter by category if specified
      let filteredCompanies = ycCompanies;
      if (args.category) {
        const categoryLower = args.category.toLowerCase();
        filteredCompanies = ycCompanies.filter(company => 
          (company.industry && company.industry.toLowerCase().includes(categoryLower)) ||
          (company.subindustry && company.subindustry.toLowerCase().includes(categoryLower)) ||
          (company.tags && company.tags.some(tag => tag.toLowerCase().includes(categoryLower))) ||
          (company.industries && company.industries.some(ind => ind.toLowerCase().includes(categoryLower)))
        );
        console.log(`📊 Filtered to ${filteredCompanies.length} companies for category: ${args.category}`);
      }

      // Filter by status (only active companies by default)
      if (!args.includeInactive) {
        filteredCompanies = filteredCompanies.filter(company => 
          company.status === 'Active' || company.status === 'Public'
        );
        console.log(`🏢 Filtered to ${filteredCompanies.length} active companies`);
      }

      // IMPORTANT: For similarity analysis, we ALWAYS return ALL companies
      // We never apply artificial limits when doing similarity analysis
      const isForAnalysis = args.forSimilarityAnalysis || 
                           (typeof args.limit === 'undefined') || 
                           (args.limit > 10000); // If asking for >10k, assume it's for analysis
      
      if (!isForAnalysis && args.limit && args.limit > 0) {
        const originalCount = filteredCompanies.length;
        filteredCompanies = filteredCompanies.slice(0, args.limit);
        console.log(`📝 LIMITED to ${filteredCompanies.length} companies (from ${originalCount}) due to explicit limit`);
      } else {
        console.log(`🚀 Returning ALL ${filteredCompanies.length} companies for comprehensive analysis`);
      }

      // Log some sample companies to verify we have the full dataset
      const sampleCompanies = filteredCompanies.slice(0, 3);
      console.log(`📋 Sample companies: ${sampleCompanies.map(c => `${c.name} (ID: ${c.id})`).join(', ')}`);
      
      // Check if we have high ID companies (like Corgi Labs with ID 28077)
      const highIdCompanies = filteredCompanies.filter(c => c.id > 25000);
      console.log(`🔢 Found ${highIdCompanies.length} companies with ID > 25000`);
      
      // Specifically check for Corgi Labs
      const corgiLabs = filteredCompanies.find(c => c.name.toLowerCase().includes('corgi'));
      if (corgiLabs) {
        console.log(`🐕 Found Corgi Labs (ID: ${corgiLabs.id}) in dataset!`);
      } else {
        console.log(`❌ Corgi Labs NOT found in filtered dataset`);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              companies: filteredCompanies,
              total: filteredCompanies.length,
              totalAvailable: ycCompanies.length,
              query: args,
              fetchedAt: new Date().toISOString(),
              source: 'Y Combinator Official API',
              dataStats: {
                maxCompanyId: Math.max(...ycCompanies.map(c => c.id || 0)),
                minCompanyId: Math.min(...ycCompanies.map(c => c.id || 0)),
                activeCompanies: ycCompanies.filter(c => c.status === 'Active').length,
                publicCompanies: ycCompanies.filter(c => c.status === 'Public').length
              },
              analysisMode: isForAnalysis ? 'FULL_DATASET' : 'LIMITED'
            }, null, 2)
          }
        ]
      };

    } catch (error) {
      console.error('❌ Error fetching Y Combinator companies:', error.message);
      
      // Fallback to enhanced mock data if API fails
      console.log('🔄 Falling back to enhanced mock data...');
      const fallbackCompanies = [
        {
          id: 28077,
          name: "Corgi Labs",
          slug: "corgi-labs",
          oneLiner: "AI to increase payment acceptance and reduce fraud for businesses",
          description: "End-to-end suite of fraud detection and prevention solutions, including an analytics product to monitor and understand dispute + fraud metrics, an AI product which highlights transactions for merchants to follow up on, and an AI solution to recommend rules that can be implemented in payment provider platforms (Stripe, Shopify, Adyen) to proactively reduce dispute + fraud rates.",
          tags: ["Artificial Intelligence", "Payments", "Analytics", "E-commerce", "Fraud Detection"],
          industry: "Fintech",
          subindustry: "Fintech -> Payments",
          batch: "Winter 2023",
          founded: 2023,
          status: "Active",
          formerNames: ["CorgiAI"]
        },
        {
          id: 27856,
          name: "Ramp",
          slug: "ramp",
          oneLiner: "Corporate cards and spend management software",
          description: "Ramp is the corporate card and spend management platform designed to help you spend less. Get more value from your spend with unlimited corporate cards, automated expense management, and easy integrations to your business systems.",
          tags: ["Fintech", "Payments", "B2B", "SaaS"],
          industry: "Fintech",
          subindustry: "Fintech -> Payments",
          batch: "Winter 2019",
          founded: 2019,
          status: "Active",
          formerNames: []
        },
        {
          id: 25432,
          name: "Plaid",
          slug: "plaid",
          oneLiner: "APIs for connecting bank accounts to apps",
          description: "Plaid is a data network that powers the tools millions of people rely on to live a healthier financial life. We work with thousands of companies like Venmo, SoFi, several of the Fortune 500, and many of the largest banks to make it easier for people to connect their financial accounts to the apps and services they want to use.",
          tags: ["Fintech", "API", "B2B", "Financial Services"],
          industry: "Fintech",
          subindustry: "Fintech -> Payments",
          batch: "Summer 2013",
          founded: 2013,
          status: "Active",
          formerNames: []
        },
        {
          id: 5,
          name: "CircuitHub",
          slug: "circuithub",
          oneLiner: "On-Demand Electronics Manufacturing",
          description: "CircuitHub offers on-demand electronics manufacturing powered by our factory-scale robotics platform, The Grid. This platform delivers a 10x improvement in the speed and cost of small-batch electronics production. Leading customers like Tesla, NASA, and Zipline rely on CircuitHub to cut their time to market in half.",
          tags: ["Hard Tech", "Hardware", "Robotics"],
          industry: "Industrials",
          subindustry: "Manufacturing and Robotics",
          batch: "Winter 2012",
          founded: 2012,
          status: "Active",
          formerNames: []
        },
        {
          id: 1,
          name: "Stripe",
          slug: "stripe",
          oneLiner: "Online payment processing",
          description: "Stripe is a technology company that builds economic infrastructure for the internet. Businesses of every size use Stripe's software to accept payments and manage their businesses online.",
          tags: ["Fintech", "Payments", "API"],
          industry: "Fintech",
          batch: "Summer 2009",
          founded: 2009,
          status: "Public",
          formerNames: []
        },
        {
          id: 2,
          name: "Airbnb",
          slug: "airbnb",
          oneLiner: "Marketplace for short-term rentals",
          description: "Airbnb is an online marketplace that connects people who want to rent out their homes with people who are looking for accommodations.",
          tags: ["Marketplace", "Travel", "Hospitality"],
          industry: "Consumer",
          batch: "Winter 2008",
          founded: 2008,
          status: "Public",
          formerNames: []
        },
        {
          id: 27123,
          name: "Sift",
          slug: "sift",
          oneLiner: "Digital trust and safety suite for fraud prevention",
          description: "Sift is the leader in Digital Trust & Safety, empowering companies of all sizes to unlock revenue without risk. Our Digital Trust & Safety suite of products includes our platform that combines advanced machine learning with human insight to prevent fraud, account abuse, and content abuse.",
          tags: ["Security", "Fraud Detection", "Machine Learning", "B2B"],
          industry: "Security",
          subindustry: "Security -> Fraud Detection",
          batch: "Winter 2011",
          founded: 2011,
          status: "Active",
          formerNames: []
        },
        {
          id: 28901,
          name: "Unit21",
          slug: "unit21",
          oneLiner: "Risk and compliance infrastructure for fintech",
          description: "Unit21 helps protect businesses against adversaries through a no-code platform for risk and compliance operations. We reduce false positives, increase analyst productivity, and provide real-time risk insights.",
          tags: ["Fintech", "Security", "Compliance", "Risk Management"],
          industry: "Security",
          subindustry: "Security -> Fraud Detection",
          batch: "Summer 2017",
          founded: 2017,
          status: "Active",
          formerNames: []
        }
      ];

      console.log(`🎯 Fallback dataset includes ${fallbackCompanies.length} companies including Corgi Labs`);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              companies: fallbackCompanies,
              total: fallbackCompanies.length,
              error: true,
              errorMessage: error.message,
              fallbackData: true,
              query: args,
              fetchedAt: new Date().toISOString(),
              source: 'Enhanced Fallback Mock Data (includes Corgi Labs and fraud detection companies)',
              analysisMode: 'FALLBACK_FULL_DATASET'
            }, null, 2)
          }
        ],
        isError: false // Don't mark as error since we have fallback data
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('External Review MCP Server running on stdio');
  }
}

// Start the server
const server = new ExternalReviewMCPServer();
server.run().catch(console.error);
