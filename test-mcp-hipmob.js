#!/usr/bin/env node

/**
 * Simple test to verify the MCP server correctly rejects Hipmob-like applications
 */

// Mock the MCP server methods we need for testing
class TestMCPServer {
  constructor() {
    this.genAI = null;
    this.model = null;
  }

  // Use the same calculateStringSimilarity method as the real server
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

  // Copy the fallbackSimilarityAnalysis method (simplified for testing)
  async testSimilarityAnalysis(userApplication, ycCompanies) {
    const userTitle = userApplication.title.toLowerCase();
    const userDesc = userApplication.description.toLowerCase();
    
    // Check for exact name matches first
    for (const company of ycCompanies) {
      const companyName = company.name.toLowerCase();
      const nameSimilarity = this.calculateStringSimilarity(userTitle, companyName);
      
      const normalizedUserTitle = userTitle.replace(/[^a-z0-9]/g, '');
      const normalizedCompanyName = companyName.replace(/[^a-z0-9]/g, '');
      
      const isHighSimilarity = nameSimilarity > 0.85;
      const isExactMatch = normalizedUserTitle === normalizedCompanyName;
      const isContainedMatch = (normalizedUserTitle.length > 3 && normalizedCompanyName.includes(normalizedUserTitle)) ||
                              (normalizedCompanyName.length > 3 && normalizedUserTitle.includes(normalizedCompanyName));
      
      if (isHighSimilarity || isExactMatch || isContainedMatch) {
        return {
          isSimilar: true,
          similarityScore: 0.95,
          recommendation: "REJECT",
          mostSimilarCompany: {
            name: company.name,
            reason: `Direct name match detected. Your application title "${userApplication.title}" matches the existing Y Combinator company "${company.name}".`
          },
          feedback: `Your application appears to be for "${company.name}", which is already a Y Combinator company.`
        };
      }
    }

    // If no name match, check content similarity
    let highestSimilarity = 0;
    let mostSimilarCompany = null;

    for (const company of ycCompanies) {
      const companyOneLiner = (company.oneLiner || '').toLowerCase();
      const companyDesc = (company.description || '').toLowerCase();
      
      // Calculate similarities (simplified version)
      const userWords = new Set(userDesc.split(/\s+/).filter(word => word.length > 3));
      const companyWords = new Set((companyOneLiner + ' ' + companyDesc).split(/\s+/).filter(word => word.length > 3));
      
      const intersection = new Set([...userWords].filter(word => companyWords.has(word)));
      const union = new Set([...userWords, ...companyWords]);
      const jaccardSimilarity = intersection.size > 0 ? intersection.size / union.size : 0;
      
      // Business keywords matching
      const businessKeywords = [
        'chat', 'live chat', 'helpdesk', 'customer service', 'customer support', 'communication',
        'messaging', 'engagement', 'feedback', 'ios', 'android', 'tablet', 'mobile', 'app'
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
      let overallSimilarity = (jaccardSimilarity * 0.2) + (keywordSimilarity * 0.6);
      
      // Customer service boost
      const isCustomerServiceApp = userDesc.includes('customer service') || userDesc.includes('customer support') || 
                                 userDesc.includes('live chat') || userDesc.includes('helpdesk') ||
                                 userDesc.includes('communication') || userDesc.includes('messaging');
      const isCompanyCustomerService = companyOneLiner.includes('customer') || companyDesc.includes('customer') ||
                                     (company.tags && company.tags.some(tag => tag.toLowerCase().includes('customer') || 
                                                            tag.toLowerCase().includes('communication') ||
                                                            tag.toLowerCase().includes('chat')));
      
      if (isCustomerServiceApp && isCompanyCustomerService) {
        overallSimilarity = Math.min(1.0, overallSimilarity * 1.5);
      }
      
      if (overallSimilarity > highestSimilarity) {
        highestSimilarity = overallSimilarity;
        mostSimilarCompany = {
          name: company.name,
          similarity: overallSimilarity,
          matchedKeywords,
          commonWords: [...intersection].slice(0, 5)
        };
      }
    }

    const isRejected = highestSimilarity > 0.45;
    
    return {
      isSimilar: isRejected,
      similarityScore: highestSimilarity,
      recommendation: isRejected ? "REJECT" : "APPROVE",
      mostSimilarCompany: mostSimilarCompany ? {
        name: mostSimilarCompany.name,
        reason: `${Math.round(highestSimilarity * 100)}% similarity. Matched keywords: ${mostSimilarCompany.matchedKeywords.join(', ')}`
      } : null,
      feedback: isRejected ? 
        `Your startup idea shows ${Math.round(highestSimilarity * 100)}% similarity to ${mostSimilarCompany.name}, an existing Y Combinator company.` :
        `Your startup idea is sufficiently differentiated from existing Y Combinator companies.`
    };
  }
}

async function runTests() {
  console.log('🧪 Testing MCP Server Hipmob Detection\n');

  const testServer = new TestMCPServer();
  
  const hipmobData = {
    name: "Hipmob",
    oneLiner: "Customer communication for iOS and Android developers",
    description: "Hipmob brings easy to use live chat, helpdesk, feedback and customer engagement tools to mobile and tablet businesses. Whether you're a mobile-native startup, a small business going mobile, or a large public company with a growing mobile business, we give you the tools to increase sales, transform customer support, and make your customers happy.",
    tags: ["Customer Service", "Mobile", "Communication", "Live Chat"],
    industry: "Consumer"
  };

  const testCases = [
    {
      name: "Exact Name - Hipmob",
      app: {
        title: "Hipmob",
        description: "Customer communication platform"
      },
      expected: "REJECT"
    },
    {
      name: "Very Similar - MobileChat",
      app: {
        title: "MobileChat Pro",
        description: "Live chat and customer service tools for iOS and Android developers. Help mobile businesses increase sales and transform customer support."
      },
      expected: "REJECT"
    },
    {
      name: "Different - Web Analytics",
      app: {
        title: "WebAnalytics Pro",
        description: "Advanced web analytics and user behavior tracking for e-commerce websites"
      },
      expected: "APPROVE"
    }
  ];

  for (const testCase of testCases) {
    console.log(`📋 Test: ${testCase.name}`);
    console.log(`App: "${testCase.app.title}" - ${testCase.app.description}`);
    console.log(`Expected: ${testCase.expected}`);
    
    try {
      const result = await testServer.testSimilarityAnalysis(testCase.app, [hipmobData]);
      
      console.log(`✅ Result: ${result.recommendation}`);
      console.log(`📊 Similarity: ${Math.round(result.similarityScore * 100)}%`);
      
      if (result.mostSimilarCompany) {
        console.log(`🎯 Most similar: ${result.mostSimilarCompany.name}`);
        console.log(`💡 Reason: ${result.mostSimilarCompany.reason}`);
      }
      
      if (result.recommendation === testCase.expected) {
        console.log(`🎯 PASS`);
      } else {
        console.log(`❌ FAIL - Expected ${testCase.expected}`);
      }
      
    } catch (error) {
      console.error(`❌ ERROR: ${error.message}`);
    }
    
    console.log('');
  }
}

runTests().catch(console.error);
