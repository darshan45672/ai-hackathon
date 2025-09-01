#!/usr/bin/env node

// Test business concept similarity with different names
import { ExternalReviewMCPServer } from './index.js';

async function testBusinessConceptSimilarity() {
  console.log('🧪 Testing business concept similarity with different names...\n');
  
  const server = new ExternalReviewMCPServer();
  
  // Test cases: Different names but similar business concepts to YC companies
  const testCases = [
    {
      name: "Similar to Stripe (payments) but different name",
      application: {
        title: "PayFlow", // Different name
        description: "Online payment processing platform for businesses",
        problemStatement: "Businesses struggle with complex payment integrations and high transaction fees",
        proposedSolution: "Simple APIs for payment processing with competitive rates and easy integration",
        targetMarket: "E-commerce businesses and SaaS companies",
        businessModel: "Transaction fees and subscription plans"
      },
      expectedSimilarTo: "Stripe"
    },
    {
      name: "Similar to Airbnb (rentals) but different name", 
      application: {
        title: "StayHub", // Different name
        description: "Peer-to-peer accommodation rental marketplace",
        problemStatement: "Travelers need affordable accommodation and homeowners want extra income",
        proposedSolution: "Platform connecting property owners with travelers for short-term rentals",
        targetMarket: "Travelers and property owners",
        businessModel: "Commission on bookings"
      },
      expectedSimilarTo: "Airbnb"
    },
    {
      name: "Similar to CircuitHub (manufacturing) but different name",
      application: {
        title: "MakeBot", // Different name
        description: "On-demand electronics manufacturing service",
        problemStatement: "Small batch electronics production is expensive and slow",
        proposedSolution: "Automated robotics platform for fast, cost-effective electronics manufacturing",
        targetMarket: "Hardware startups and electronics companies", 
        businessModel: "Per-unit manufacturing fees"
      },
      expectedSimilarTo: "CircuitHub"
    },
    {
      name: "Actually unique idea (should be approved)",
      application: {
        title: "PetMind", // Unique concept
        description: "AI-powered pet behavior analysis and training recommendations",
        problemStatement: "Pet owners struggle to understand and modify their pets' behavioral issues",
        proposedSolution: "Computer vision and ML to analyze pet behavior and provide personalized training plans",
        targetMarket: "Pet owners and veterinarians",
        businessModel: "Subscription service for behavior insights"
      },
      expectedSimilarTo: "None (should be approved)"
    }
  ];
  
  // Get YC companies
  console.log('📊 Fetching YC companies dataset...');
  const ycResult = await server.fetchYCCompanies();
  const ycData = JSON.parse(ycResult.content[0].text);
  console.log(`✅ Found ${ycData.companies.length} companies in dataset\n`);
  
  // Test each case
  for (const testCase of testCases) {
    console.log(`🎯 Testing: ${testCase.name}`);
    console.log(`   Title: "${testCase.application.title}"`);
    console.log(`   Expected to be similar to: ${testCase.expectedSimilarTo}`);
    
    try {
      const analysisResult = await server.analyzeIdeaSimilarity({
        userApplication: testCase.application,
        externalData: { ycCompanies: ycData.companies }
      });
      
      const analysis = JSON.parse(analysisResult.content[0].text);
      
      const status = analysis.recommendation === 'REJECT' ? '❌ REJECTED' : '✅ APPROVED';
      const similarCompany = analysis.mostSimilarCompany?.name || 'none';
      const score = Math.round(analysis.similarityScore * 100);
      
      console.log(`   Result: ${status} (${score}% similarity with ${similarCompany})`);
      
      if (testCase.expectedSimilarTo !== "None (should be approved)") {
        // Check if it detected the expected similar company
        const expectedCompanyFound = similarCompany.toLowerCase().includes(testCase.expectedSimilarTo.toLowerCase());
        if (analysis.recommendation === 'REJECT' && expectedCompanyFound) {
          console.log(`   ✅ CORRECT: Detected business concept similarity with ${testCase.expectedSimilarTo}`);
        } else if (analysis.recommendation === 'REJECT') {
          console.log(`   ⚠️ PARTIAL: Rejected but found similarity with ${similarCompany} instead of ${testCase.expectedSimilarTo}`);
        } else {
          console.log(`   ❌ MISSED: Should have detected similarity with ${testCase.expectedSimilarTo}`);
        }
      } else {
        // This should be approved
        if (analysis.recommendation === 'APPROVE') {
          console.log(`   ✅ CORRECT: Unique idea properly approved`);
        } else {
          console.log(`   ❌ FALSE POSITIVE: Unique idea incorrectly rejected`);
        }
      }
      
    } catch (error) {
      console.log(`   ⚠️ ERROR: ${error.message}`);
    }
    console.log('');
  }
  
  console.log('📋 Summary:');
  console.log('• Different names but similar business concepts should be REJECTED');
  console.log('• Truly unique ideas should be APPROVED');
  console.log('• The system analyzes problem statements, solutions, and business models');
  console.log('• Current threshold: >40% business concept similarity = REJECT');
}

testBusinessConceptSimilarity().catch(console.error);
