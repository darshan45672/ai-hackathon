#!/usr/bin/env node

/**
 * Test the updated MCP server with your specific requirements
 */

// Mock the similarity analysis logic to test it directly
function calculateStringSimilarity(str1, str2) {
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

function calculateBusinessConceptSimilarity(text1, text2) {
  const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(word => word.length > 3));
  const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(word => word.length > 3));
  
  const intersection = new Set([...words1].filter(word => words2.has(word)));
  
  // Enhanced similarity that gives more weight to important business keywords
  const importantKeywords = [
    'customer', 'service', 'support', 'chat', 'communication', 'mobile', 'platform',
    'payment', 'fraud', 'detection', 'analytics', 'marketplace', 'rental', 'accommodation'
  ];
  
  let importantMatches = 0;
  let totalImportantWords = 0;
  
  for (const keyword of importantKeywords) {
    const inText1 = text1.includes(keyword);
    const inText2 = text2.includes(keyword);
    
    if (inText1 || inText2) {
      totalImportantWords++;
      if (inText1 && inText2) {
        importantMatches++;
      }
    }
  }
  
  // Base Jaccard similarity
  const union = new Set([...words1, ...words2]);
  const jaccardSimilarity = intersection.size > 0 ? intersection.size / union.size : 0;
  
  // Important keyword similarity
  const keywordSimilarity = totalImportantWords > 0 ? importantMatches / totalImportantWords : 0;
  
  // Combined similarity (weighted toward important keywords)
  return (jaccardSimilarity * 0.4) + (keywordSimilarity * 0.6);
}

function analyzeBusinessSimilarity(userApplication, company) {
  const userProblem = (userApplication.problemStatement || '').toLowerCase();
  const userSolution = (userApplication.proposedSolution || '').toLowerCase();
  const userDesc = userApplication.description.toLowerCase();
  const userBusinessModel = (userApplication.businessModel || '').toLowerCase();
  
  const companyOneLiner = (company.oneLiner || '').toLowerCase();
  const companyDesc = (company.description || '').toLowerCase();
  
  const problemSimilarity = calculateBusinessConceptSimilarity(
    userProblem + ' ' + userDesc,
    companyOneLiner + ' ' + companyDesc
  );
  
  const solutionSimilarity = calculateBusinessConceptSimilarity(
    userSolution,
    companyDesc
  );
  
  const businessModelSimilarity = userBusinessModel ? 
    calculateBusinessConceptSimilarity(userBusinessModel, companyDesc) : 0;
  
  // Industry/vertical keywords matching  
  const industryKeywords = [
    'customer service', 'customer support', 'communication', 'chat', 'helpdesk',
    'payment', 'fintech', 'marketplace', 'travel', 'rental', 'accommodation',
    'fraud', 'security', 'analytics', 'e-commerce', 'retail'
  ];
  
  let industryMatches = 0;
  let userHasIndustry = 0;
  let companyHasIndustry = 0;
  
  const userFullText = userDesc + ' ' + userProblem + ' ' + userSolution;
  const companyFullText = companyOneLiner + ' ' + companyDesc;
  
  for (const keyword of industryKeywords) {
    const userHasKeyword = userFullText.includes(keyword);
    const companyHasKeyword = companyFullText.includes(keyword);
    
    if (userHasKeyword) userHasIndustry++;
    if (companyHasKeyword) companyHasIndustry++;
    if (userHasKeyword && companyHasKeyword) industryMatches++;
  }
  
  const industrySimilarity = (userHasIndustry > 0 && companyHasIndustry > 0) ? 
    industryMatches / Math.max(userHasIndustry, companyHasIndustry) : 0;
  
  return {
    problemSimilarity,
    solutionSimilarity,
    businessModelSimilarity,
    industrySimilarity
  };
}

function calculateOverallBusinessSimilarity(analysis) {
  return (analysis.problemSimilarity * 0.3) + 
         (analysis.industrySimilarity * 0.3) + 
         (analysis.solutionSimilarity * 0.2) + 
         (analysis.businessModelSimilarity * 0.05);
}

function testMCPRequirements() {
  console.log('🧪 Testing MCP Server with Your Specific Requirements\n');

  const ycCompanies = [
    {
      name: "Hipmob",
      oneLiner: "Customer communication for iOS and Android developers",
      description: "Hipmob brings easy to use live chat, helpdesk, feedback and customer engagement tools to mobile and tablet businesses. Whether you're a mobile-native startup, a small business going mobile, or a large public company with a growing mobile business, we give you the tools to increase sales, transform customer support, and make your customers happy.",
      tags: ["Customer Service", "Mobile", "Communication", "Live Chat"],
      industry: "Consumer"
    },
    {
      name: "Stripe",
      oneLiner: "Online payment processing",
      description: "Stripe is a technology company that builds economic infrastructure for the internet. Businesses of every size use Stripe's software to accept payments and manage their businesses online.",
      tags: ["Fintech", "Payments", "API"],
      industry: "Fintech"
    },
    {
      name: "Airbnb",
      oneLiner: "Marketplace for short-term rentals",
      description: "Airbnb is an online marketplace that connects people who want to rent out their homes with people who are looking for accommodations.",
      tags: ["Marketplace", "Travel", "Hospitality"],
      industry: "Consumer"
    }
  ];

  const testCases = [
    {
      name: "REJECT Case 1: Same Name + Similar Problem",
      app: {
        title: "Hipmob",
        description: "Mobile customer service platform",
        problemStatement: "Mobile apps need better customer communication tools",
        proposedSolution: "Provide live chat and support tools for mobile developers"
      },
      expected: "REJECT",
      reason: "Same name and similar problem - should be rejected"
    },
    {
      name: "REJECT Case 2: Different Name + Same Business Concept",
      app: {
        title: "MobileChatPro",
        description: "Customer engagement tools for mobile applications",
        problemStatement: "Mobile businesses struggle with customer support and engagement",
        proposedSolution: "Live chat, helpdesk, and feedback tools specifically for mobile and tablet businesses"
      },
      expected: "REJECT", 
      reason: "Different name but very similar business concept to Hipmob"
    },
    {
      name: "APPROVE Case 1: Totally Unique Problem",
      app: {
        title: "FarmTech AI",
        description: "AI-powered crop monitoring system",
        problemStatement: "Farmers need better tools to monitor crop health and predict yields",
        proposedSolution: "Use satellite imagery and AI to provide real-time crop insights"
      },
      expected: "APPROVE",
      reason: "Completely different problem space not covered by YC companies"
    },
    {
      name: "APPROVE Case 2: Same Space, Different Approach",
      app: {
        title: "VoiceSupport",
        description: "Voice-only customer service platform",
        problemStatement: "Customer service is too impersonal with text-based chat",
        proposedSolution: "Voice-first customer support platform that emphasizes human connection through audio conversations"
      },
      expected: "APPROVE",
      reason: "Customer service space but fundamentally different approach (voice vs text)"
    },
    {
      name: "APPROVE Case 3: Different Market Segment",
      app: {
        title: "EnterpriseChat",
        description: "Internal communication platform for large enterprises",
        problemStatement: "Large enterprises need secure internal communication tools",
        proposedSolution: "Enterprise-grade internal chat platform with advanced security and compliance features"
      },
      expected: "APPROVE",
      reason: "Similar technology but different market (internal vs customer-facing)"
    }
  ];

  for (const testCase of testCases) {
    console.log(`📋 ${testCase.name}`);
    console.log(`Expected: ${testCase.expected} - ${testCase.reason}`);
    console.log('---');

    // Step 1: Check name similarity
    let nameMatch = false;
    let nameMatchCompany = null;
    let problemSimilarity = 0;
    let isExactMatch = false;

    for (const company of ycCompanies) {
      const nameSimilarity = calculateStringSimilarity(
        testCase.app.title.toLowerCase(), 
        company.name.toLowerCase()
      );
      
      const normalizedUser = testCase.app.title.replace(/[^a-z0-9]/g, '').toLowerCase();
      const normalizedCompany = company.name.replace(/[^a-z0-9]/g, '').toLowerCase();
      
      const isHighSimilarity = nameSimilarity > 0.85;
      isExactMatch = normalizedUser === normalizedCompany;
      const isContainedMatch = (normalizedUser.length > 3 && normalizedCompany.includes(normalizedUser)) ||
                              (normalizedCompany.length > 3 && normalizedUser.includes(normalizedCompany));
      
      if (isHighSimilarity || isExactMatch || isContainedMatch) {
        nameMatch = true;
        nameMatchCompany = company;
        
        // Check problem similarity too
        problemSimilarity = calculateBusinessConceptSimilarity(
          testCase.app.description + ' ' + testCase.app.problemStatement,
          company.oneLiner + ' ' + company.description
        );
        
        console.log(`🎯 Name match found: ${company.name} (${Math.round(nameSimilarity * 100)}% similarity)`);
        console.log(`📊 Problem similarity: ${Math.round(problemSimilarity * 100)}%`);
        
        // For exact name matches, reject if problem similarity is >10%
        // For high similarity names, reject if problem similarity is >30%
        const rejectionThreshold = (isExactMatch || nameSimilarity > 0.95) ? 0.1 : 0.3;
        
        if (problemSimilarity > rejectionThreshold) {
          console.log(`❌ REJECT: Name + Problem match`);
          break;
        }
      }
    }

    // Step 2: If no name match, check business concept similarity
    if (!nameMatch || problemSimilarity <= 0.3) {
      let highestBusinessSimilarity = 0;
      let mostSimilarCompany = null;

      for (const company of ycCompanies) {
        const analysis = analyzeBusinessSimilarity(testCase.app, company);
        const overallSimilarity = calculateOverallBusinessSimilarity(analysis);
        
        if (overallSimilarity > highestBusinessSimilarity) {
          highestBusinessSimilarity = overallSimilarity;
          mostSimilarCompany = company;
        }
      }

      console.log(`🧠 Highest business concept similarity: ${Math.round(highestBusinessSimilarity * 100)}% (${mostSimilarCompany?.name})`);
      
      if (highestBusinessSimilarity > 0.4) {
        console.log(`❌ REJECT: Business concept too similar`);
      } else {
        console.log(`✅ APPROVE: Sufficiently unique`);
      }
    }

    // Determine actual result
    let actualResult;
    if (nameMatch && problemSimilarity > (isExactMatch || nameSimilarity > 0.95 ? 0.1 : 0.3)) {
      actualResult = "REJECT";
    } else {
      // Check business similarity
      let maxSimilarity = 0;
      for (const company of ycCompanies) {
        const analysis = analyzeBusinessSimilarity(testCase.app, company);
        const overallSimilarity = calculateOverallBusinessSimilarity(analysis);
        maxSimilarity = Math.max(maxSimilarity, overallSimilarity);
      }
      actualResult = maxSimilarity > 0.4 ? "REJECT" : "APPROVE";
    }

    if (actualResult === testCase.expected) {
      console.log(`🎯 PASS - Got expected result: ${actualResult}`);
    } else {
      console.log(`❌ FAIL - Expected ${testCase.expected}, got ${actualResult}`);
    }

    console.log(''); // Add spacing
  }
}

testMCPRequirements();
