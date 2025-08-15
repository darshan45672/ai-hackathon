#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

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
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

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
            description: 'Fetch Y Combinator companies data from external sources',
            inputSchema: {
              type: 'object',
              properties: {
                category: { type: 'string', description: 'Industry category to filter' },
                limit: { type: 'number', description: 'Number of companies to fetch' }
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
        analysis = {
          isSimilar: false,
          similarityScore: 0.1,
          recommendation: "APPROVE",
          feedback: "Analysis completed but response format was unexpected. Manual review recommended.",
          rawResponse: text
        };
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

  async fetchYCCompanies(args = {}) {
    try {
      // Mock YC companies data (in production, this would call actual YC API)
      const ycCompanies = [
        {
          name: "CircuitHub",
          oneLiner: "On-Demand Electronics Manufacturing",
          description: "CircuitHub offers on-demand electronics manufacturing powered by our factory-scale robotics platform, The Grid. This platform delivers a 10x improvement in the speed and cost of small-batch electronics production.",
          tags: ["Hard Tech", "Hardware", "Robotics"],
          industry: "Industrials",
          subindustry: "Manufacturing and Robotics",
          batch: "W13",
          founded: 2013
        },
        {
          name: "Stripe",
          oneLiner: "Online payment processing",
          description: "Stripe is a technology company that builds economic infrastructure for the internet. Businesses of every size use Stripe's software to accept payments and manage their businesses online.",
          tags: ["Fintech", "Payments", "API"],
          industry: "Fintech",
          batch: "S09",
          founded: 2009
        },
        {
          name: "Airbnb",
          oneLiner: "Marketplace for short-term rentals",
          description: "Airbnb is an online marketplace that connects people who want to rent out their homes with people who are looking for accommodations.",
          tags: ["Marketplace", "Travel", "Hospitality"],
          industry: "Travel",
          batch: "W08",
          founded: 2008
        },
        {
          name: "DoorDash",
          oneLiner: "Food delivery platform",
          description: "DoorDash is a technology company that connects customers with their favorite local and national businesses in the United States and Canada.",
          tags: ["Food Delivery", "Marketplace", "Logistics"],
          industry: "Food & Beverage",
          batch: "S13",
          founded: 2013
        },
        {
          name: "Instacart",
          oneLiner: "Grocery delivery service",
          description: "Instacart is an American company that operates a grocery delivery and pick-up service. Customers select groceries through a web application from various retailers and independent personal shoppers fulfill and deliver orders.",
          tags: ["Grocery", "Delivery", "Marketplace"],
          industry: "Food & Beverage",
          batch: "S12",
          founded: 2012
        },
        {
          name: "Coinbase",
          oneLiner: "Cryptocurrency exchange",
          description: "Coinbase is a digital currency exchange headquartered in San Francisco, California. It operates exchanges of Bitcoin, Ethereum, and other cryptocurrencies for fiat currencies in over 32 countries.",
          tags: ["Crypto", "Fintech", "Exchange"],
          industry: "Fintech",
          batch: "S12",
          founded: 2012
        }
      ];

      // Filter by category if specified
      let filteredCompanies = ycCompanies;
      if (args.category) {
        filteredCompanies = ycCompanies.filter(company => 
          company.industry.toLowerCase().includes(args.category.toLowerCase()) ||
          company.tags.some(tag => tag.toLowerCase().includes(args.category.toLowerCase()))
        );
      }

      // Limit results if specified
      if (args.limit) {
        filteredCompanies = filteredCompanies.slice(0, args.limit);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              companies: filteredCompanies,
              total: filteredCompanies.length,
              query: args
            }, null, 2)
          }
        ]
      };

    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: true,
              message: error.message,
              companies: []
            })
          }
        ],
        isError: true
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
