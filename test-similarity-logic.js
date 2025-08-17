#!/usr/bin/env node

/**
 * Direct test of the similarity analysis function
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

function testSimilarityDetection() {
  console.log('🧪 Testing Similarity Detection Logic\n');

  const testCases = [
    {
      name: "Exact Match Test",
      userTitle: "hipmob",
      companyName: "hipmob",
      expected: "Should match (100% similarity)"
    },
    {
      name: "Case Difference Test",
      userTitle: "Hipmob",
      companyName: "hipmob",
      expected: "Should match (100% similarity after normalization)"
    },
    {
      name: "With Spaces Test",
      userTitle: "hip mob",
      companyName: "hipmob",
      expected: "Should match after normalization"
    },
    {
      name: "Similar Service Test",
      userTitle: "mobile chat",
      companyName: "hipmob",
      expected: "Should not match exactly but may have content similarity"
    }
  ];

  for (const testCase of testCases) {
    console.log(`📋 ${testCase.name}`);
    console.log(`User: "${testCase.userTitle}" vs Company: "${testCase.companyName}"`);
    
    const similarity = calculateStringSimilarity(testCase.userTitle.toLowerCase(), testCase.companyName.toLowerCase());
    const normalizedUser = testCase.userTitle.replace(/[^a-z0-9]/g, '');
    const normalizedCompany = testCase.companyName.replace(/[^a-z0-9]/g, '');
    
    const isHighSimilarity = similarity > 0.85;
    const isExactMatch = normalizedUser === normalizedCompany;
    const isContainedMatch = (normalizedUser.length > 3 && normalizedCompany.includes(normalizedUser)) ||
                            (normalizedCompany.length > 3 && normalizedUser.includes(normalizedCompany));
    
    console.log(`📊 String similarity: ${Math.round(similarity * 100)}%`);
    console.log(`🔍 Normalized strings: "${normalizedUser}" vs "${normalizedCompany}"`);
    console.log(`✅ High similarity (>85%): ${isHighSimilarity}`);
    console.log(`✅ Exact match: ${isExactMatch}`);
    console.log(`✅ Contained match: ${isContainedMatch}`);
    console.log(`🎯 Would trigger name match: ${isHighSimilarity || isExactMatch || isContainedMatch}`);
    console.log(`Expected: ${testCase.expected}\n`);
  }

  // Test content similarity
  console.log('📱 Testing Content Similarity for Hipmob-like Applications\n');

  const hipmobData = {
    name: "Hipmob",
    oneLiner: "Customer communication for iOS and Android developers",
    description: "Hipmob brings easy to use live chat, helpdesk, feedback and customer engagement tools to mobile and tablet businesses. Whether you're a mobile-native startup, a small business going mobile, or a large public company with a growing mobile business, we give you the tools to increase sales, transform customer support, and make your customers happy.",
    tags: ["Customer Service", "Mobile", "Communication", "Live Chat"],
    industry: "Consumer"
  };

  const testApplications = [
    {
      title: "Hipmob",
      description: "Customer communication platform for mobile apps"
    },
    {
      title: "MobileChat Pro", 
      description: "Live chat and customer service tools for iOS and Android developers. Help mobile businesses increase sales and transform customer support."
    },
    {
      title: "ChatDesk",
      description: "Customer service and live chat platform for desktop web applications"
    }
  ];

  for (const app of testApplications) {
    console.log(`📋 Testing: "${app.title}"`);
    console.log(`Description: "${app.description}"`);
    
    // Test content similarity
    const userDesc = app.description.toLowerCase();
    const companyDesc = (hipmobData.oneLiner + ' ' + hipmobData.description).toLowerCase();
    
    const userWords = new Set(userDesc.split(/\s+/).filter(word => word.length > 3));
    const companyWords = new Set(companyDesc.split(/\s+/).filter(word => word.length > 3));
    
    const intersection = new Set([...userWords].filter(word => companyWords.has(word)));
    const union = new Set([...userWords, ...companyWords]);
    const jaccardSimilarity = intersection.size > 0 ? intersection.size / union.size : 0;
    
    // Business keywords
    const businessKeywords = [
      'marketplace', 'platform', 'delivery', 'payment', 'manufacturing', 'electronics', 'robotics',
      'fraud', 'detection', 'analytics', 'ai', 'artificial intelligence', 'fintech', 'ecommerce',
      'e-commerce', 'saas', 'software', 'app', 'mobile', 'web', 'api', 'dashboard', 'payments',
      'security', 'machine learning', 'automation', 'blockchain', 'crypto', 'cryptocurrency',
      'chat', 'live chat', 'helpdesk', 'customer service', 'customer support', 'communication',
      'messaging', 'engagement', 'feedback', 'ios', 'android', 'tablet', 'developer tools'
    ];
    
    let keywordMatches = 0;
    let totalKeywords = 0;
    let matchedKeywords = [];
    
    for (const keyword of businessKeywords) {
      const userHasKeyword = userDesc.includes(keyword);
      const companyHasKeyword = companyDesc.includes(keyword);
      
      if (userHasKeyword || companyHasKeyword) {
        totalKeywords++;
        if (userHasKeyword && companyHasKeyword) {
          keywordMatches++;
          matchedKeywords.push(keyword);
        }
      }
    }
    
    const keywordSimilarity = totalKeywords > 0 ? keywordMatches / totalKeywords : 0;
    
    // Special boost for customer service/communication apps
    const isCustomerServiceApp = userDesc.includes('customer service') || userDesc.includes('customer support') || 
                               userDesc.includes('live chat') || userDesc.includes('helpdesk') ||
                               userDesc.includes('communication') || userDesc.includes('messaging');
    const isCompanyCustomerService = companyDesc.includes('customer') || 
                                   hipmobData.tags.some(tag => tag.toLowerCase().includes('customer') || 
                                                              tag.toLowerCase().includes('communication') ||
                                                              tag.toLowerCase().includes('chat'));
    
    let overallSimilarity = (jaccardSimilarity * 0.2) + (keywordSimilarity * 0.6) + (0 * 0.2) + (0 * 0.0);
    
    let boostedSimilarity = overallSimilarity;
    if (isCustomerServiceApp && isCompanyCustomerService) {
      boostedSimilarity = Math.min(1.0, overallSimilarity * 1.5);
      console.log(`🔥 Customer service boost applied: ${Math.round(overallSimilarity * 100)}% -> ${Math.round(boostedSimilarity * 100)}%`);
    }
    
    const finalSimilarity = boostedSimilarity;
    
    console.log(`📊 Jaccard similarity: ${Math.round(jaccardSimilarity * 100)}%`);
    console.log(`🔑 Keyword similarity: ${Math.round(keywordSimilarity * 100)}% (${matchedKeywords.length} matches: ${matchedKeywords.slice(0, 5).join(', ')})`);
    console.log(`📈 Base similarity: ${Math.round(overallSimilarity * 100)}%`);
    console.log(`🚀 Final similarity: ${Math.round(finalSimilarity * 100)}%`);
    console.log(`🎯 Would be rejected (>45%): ${finalSimilarity > 0.45}`);
    console.log(`📝 Common words: ${[...intersection].slice(0, 10).join(', ')}\n`);
  }
}

testSimilarityDetection();
