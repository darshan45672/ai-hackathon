#!/usr/bin/env node

// Test CircuitHub rejection
import { ExternalReviewMCPServer } from './index.js';

async function testCircuitHubRejection() {
  console.log('🧪 Testing CircuitHub application rejection...\n');
  
  const server = new ExternalReviewMCPServer();
  
  // Mock user application that matches CircuitHub
  const userApplication = {
    title: "CircuitHub",
    description: "On-demand electronics manufacturing platform using robotics",
    problemStatement: "Small-batch electronics production is slow and expensive",
    proposedSolution: "Factory-scale robotics platform for electronics manufacturing",
    techStack: ["Robotics", "Manufacturing", "Hardware"],
    teamSize: 15
  };
  
  // Get YC companies (will use fallback data)
  const ycResult = await server.fetchYCCompanies();
  const ycData = JSON.parse(ycResult.content[0].text);
  
  console.log(`📊 Found ${ycData.companies.length} YC companies in dataset`);
  
  // Find CircuitHub in the dataset
  const circuitHub = ycData.companies.find(c => c.name === 'CircuitHub');
  if (circuitHub) {
    console.log('✅ CircuitHub found in dataset:', circuitHub.name);
    console.log('📝 Description:', circuitHub.description.substring(0, 100) + '...');
  } else {
    console.log('❌ CircuitHub NOT found in dataset');
  }
  
  // Test similarity analysis
  const analysisResult = await server.analyzeIdeaSimilarity({
    userApplication,
    externalData: { ycCompanies: ycData.companies }
  });
  
  const analysis = JSON.parse(analysisResult.content[0].text);
  
  console.log('\n🎯 Analysis Results:');
  console.log('📊 Similarity Score:', analysis.similarityScore);
  console.log('🔍 Is Similar:', analysis.isSimilar);
  console.log('💡 Recommendation:', analysis.recommendation);
  console.log('📋 Most Similar Company:', analysis.mostSimilarCompany?.name);
  console.log('💬 Feedback:', analysis.feedback.substring(0, 200) + '...');
  
  // Check if it was properly rejected
  if (analysis.recommendation === 'REJECT' && analysis.mostSimilarCompany?.name === 'CircuitHub') {
    console.log('\n✅ SUCCESS: CircuitHub application correctly rejected!');
  } else {
    console.log('\n❌ FAILED: CircuitHub application was not rejected as expected');
    console.log('Expected: REJECT with CircuitHub match');
    console.log('Actual:', analysis.recommendation, 'with', analysis.mostSimilarCompany?.name);
  }
}

testCircuitHubRejection().catch(console.error);
