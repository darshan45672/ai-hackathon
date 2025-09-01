#!/usr/bin/env node

// Test multiple YC company names to verify universal fix
import { ExternalReviewMCPServer } from './index.js';

async function testMultipleYCCompanies() {
  console.log('🧪 Testing multiple Y Combinator company names...\n');
  
  const server = new ExternalReviewMCPServer();
  
  // Test cases with different well-known YC companies
  const testCases = [
    {
      name: "CircuitHub",
      title: "CircuitHub",
      description: "Electronics manufacturing platform",
      problemStatement: "Manufacturing is expensive",
      proposedSolution: "Automated manufacturing"
    },
    {
      name: "Stripe", 
      title: "Stripe",
      description: "Payment processing platform",
      problemStatement: "Online payments are difficult",
      proposedSolution: "Easy payment APIs"
    },
    {
      name: "Airbnb",
      title: "Airbnb", 
      description: "Home rental marketplace",
      problemStatement: "Travel accommodation is expensive",
      proposedSolution: "Peer-to-peer rentals"
    },
    {
      name: "Ramp",
      title: "Ramp",
      description: "Corporate credit cards",
      problemStatement: "Expense management is hard", 
      proposedSolution: "Smart corporate cards"
    },
    {
      name: "Plaid",
      title: "Plaid",
      description: "Banking API platform",
      problemStatement: "Bank integrations are complex",
      proposedSolution: "Simple banking APIs"
    },
    {
      name: "Case insensitive test",
      title: "stripe", // lowercase
      description: "Payment processing platform", 
      problemStatement: "Online payments are difficult",
      proposedSolution: "Easy payment APIs"
    },
    {
      name: "Different case test",
      title: "AIRBNB", // uppercase
      description: "Home rental marketplace",
      problemStatement: "Travel accommodation is expensive", 
      proposedSolution: "Peer-to-peer rentals"
    }
  ];
  
  // Get YC companies once
  console.log('📊 Fetching YC companies dataset...');
  const ycResult = await server.fetchYCCompanies();
  const ycData = JSON.parse(ycResult.content[0].text);
  
  console.log(`✅ Found ${ycData.companies.length} companies in dataset\n`);
  
  // Verify that our test companies exist in the dataset
  const availableCompanies = ['CircuitHub', 'Stripe', 'Airbnb', 'Ramp', 'Plaid'];
  for (const companyName of availableCompanies) {
    const found = ycData.companies.find(c => c.name.toLowerCase() === companyName.toLowerCase());
    if (found) {
      console.log(`✅ ${companyName} found in dataset`);
    } else {
      console.log(`⚠️ ${companyName} NOT found in dataset`);
    }
  }
  console.log('');
  
  // Test each case
  for (const testCase of testCases) {
    console.log(`🎯 Testing: ${testCase.name} - "${testCase.title}"`);
    
    try {
      const analysisResult = await server.analyzeIdeaSimilarity({
        userApplication: testCase,
        externalData: { ycCompanies: ycData.companies }
      });
      
      const analysis = JSON.parse(analysisResult.content[0].text);
      
      const status = analysis.recommendation === 'REJECT' ? '❌ REJECTED' : '✅ APPROVED';
      const similarCompany = analysis.mostSimilarCompany?.name || 'none';
      const score = Math.round(analysis.similarityScore * 100);
      const matchType = analysis.analysis?.titleSimilarity?.includes('Exact name match') ? 'EXACT MATCH' : 'OTHER';
      
      console.log(`   ${status} (${score}% similarity with ${similarCompany}) [${matchType}]`);
      
      // Verify exact name matches are being rejected
      const expectedCompany = ycData.companies.find(c => 
        c.name.toLowerCase() === testCase.title.toLowerCase()
      );
      
      if (expectedCompany && analysis.recommendation === 'REJECT' && 
          analysis.mostSimilarCompany?.name === expectedCompany.name) {
        console.log(`   ✅ CORRECT: Exact match properly rejected`);
      } else if (expectedCompany) {
        console.log(`   ❌ ERROR: Should have been rejected for exact name match`);
      } else {
        console.log(`   ℹ️ NOTE: Company not found in dataset`);
      }
      
    } catch (error) {
      console.log(`   ⚠️ ERROR: ${error.message}`);
    }
    console.log('');
  }
  
  console.log('🎯 Summary: The fix should now reject ANY application with an exact Y Combinator company name');
  console.log('💡 This includes all variations: exact case, lowercase, uppercase, etc.');
}

testMultipleYCCompanies().catch(console.error);
