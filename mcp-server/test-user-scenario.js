#!/usr/bin/env node

// Test CircuitHub with exact user data from the attachment
import { ExternalReviewMCPServer } from './index.js';

async function testUserScenario() {
  console.log('🧪 Testing CircuitHub with exact user data from attachment...\n');
  
  const server = new ExternalReviewMCPServer();
  
  // Exact CircuitHub application using the data from the user's example
  const userApplication = {
    title: "CircuitHub",
    description: "On-Demand Electronics Manufacturing",
    problemStatement: "CircuitHub offers on-demand electronics manufacturing powered by our factory-scale robotics platform, The Grid. This platform delivers a 10x improvement in the speed and cost of small-batch electronics production. Leading customers like Tesla, NASA, and Zipline rely on CircuitHub to cut their time to market in half.",
    proposedSolution: "CircuitHub offers on-demand electronics manufacturing powered by our factory-scale robotics platform, The Grid. This platform delivers a 10x improvement in the speed and cost of small-batch electronics production. Leading customers like Tesla, NASA, and Zipline rely on CircuitHub to cut their time to market in half.",
    targetMarket: "Electronics manufacturers, Tesla, NASA, Zipline",
    businessModel: "On-demand manufacturing service",
    techStack: ["Hard Tech", "Hardware", "Robotics", "Manufacturing", "Automation"],
    teamSize: 58
  };
  
  console.log('📋 Testing application with exact CircuitHub data:');
  console.log(`Title: "${userApplication.title}"`);
  console.log(`Team Size: ${userApplication.teamSize}`);
  console.log(`Tech Stack: [${userApplication.techStack.join(', ')}]`);
  console.log(`Description: ${userApplication.description}`);
  console.log('');
  
  try {
    // Get YC companies
    const ycResult = await server.fetchYCCompanies();
    const ycData = JSON.parse(ycResult.content[0].text);
    
    // Find the actual CircuitHub in the dataset to verify it matches
    const actualCircuitHub = ycData.companies.find(c => c.name === 'CircuitHub');
    if (actualCircuitHub) {
      console.log('✅ Found CircuitHub in YC dataset:');
      console.log(`   Name: ${actualCircuitHub.name}`);
      console.log(`   Team Size: ${actualCircuitHub.team_size || 'Not specified'}`);
      console.log(`   Tags: [${(actualCircuitHub.tags || []).join(', ')}]`);
      console.log(`   Description: ${actualCircuitHub.description?.substring(0, 100)}...`);
      console.log('');
    }
    
    // Test similarity analysis
    console.log('🔍 Running similarity analysis...');
    const analysisResult = await server.analyzeIdeaSimilarity({
      userApplication,
      externalData: { ycCompanies: ycData.companies }
    });
    
    const analysis = JSON.parse(analysisResult.content[0].text);
    
    console.log('\n🎯 Analysis Results:');
    console.log(`📊 Similarity Score: ${analysis.similarityScore}`);
    console.log(`🔍 Is Similar: ${analysis.isSimilar}`);
    console.log(`💡 Recommendation: ${analysis.recommendation}`);
    console.log(`📋 Most Similar Company: ${analysis.mostSimilarCompany?.name}`);
    console.log('📝 Feedback:');
    console.log(`   ${analysis.feedback}`);
    
    if (analysis.recommendation === 'REJECT' && analysis.mostSimilarCompany?.name === 'CircuitHub') {
      console.log('\n✅ SUCCESS: CircuitHub application correctly REJECTED!');
      console.log('💯 The bug has been fixed. Applications with exact YC company names are now properly rejected.');
    } else {
      console.log('\n❌ PROBLEM: Application should have been rejected but was not.');
      console.log(`Expected: REJECT with CircuitHub match`);
      console.log(`Actual: ${analysis.recommendation} with ${analysis.mostSimilarCompany?.name || 'no match'}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testUserScenario().catch(console.error);
