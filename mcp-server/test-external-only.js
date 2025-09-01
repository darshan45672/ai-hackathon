#!/usr/bin/env node

// Test external review specifically for CircuitHub
import { ExternalReviewMCPServer } from './index.js';

async function testExternalReviewOnly() {
  console.log('🧪 Testing EXTERNAL review for CircuitHub specifically...\n');
  
  const server = new ExternalReviewMCPServer();
  
  // Exact CircuitHub application that should be rejected in EXTERNAL review
  const circuitHubApplication = {
    title: "CircuitHub",
    description: "On-Demand Electronics Manufacturing",
    problemStatement: "CircuitHub offers on-demand electronics manufacturing powered by our factory-scale robotics platform, The Grid. This platform delivers a 10x improvement in the speed and cost of small-batch electronics production. Leading customers like Tesla, NASA, and Zipline rely on CircuitHub to cut their time to market in half.",
    proposedSolution: "CircuitHub offers on-demand electronics manufacturing powered by our factory-scale robotics platform, The Grid. This platform delivers a 10x improvement in the speed and cost of small-batch electronics production. Leading customers like Tesla, NASA, and Zipline rely on CircuitHub to cut their time to market in half.",
    targetMarket: "Electronics manufacturers, hardware startups",
    businessModel: "On-demand manufacturing service"
  };
  
  console.log('📋 Testing CircuitHub application for EXTERNAL review:');
  console.log(`Title: "${circuitHubApplication.title}"`);
  console.log(`Description: "${circuitHubApplication.description}"`);
  console.log('');
  
  try {
    // Step 1: Fetch YC companies (external data)
    console.log('🔍 Step 1: Fetching Y Combinator companies...');
    const ycResult = await server.fetchYCCompanies();
    const ycData = JSON.parse(ycResult.content[0].text);
    
    console.log(`✅ Found ${ycData.companies.length} YC companies`);
    
    // Verify CircuitHub is in the dataset
    const circuitHubInDataset = ycData.companies.find(c => 
      c.name.toLowerCase() === 'circuithub'
    );
    
    if (circuitHubInDataset) {
      console.log('✅ CircuitHub found in YC dataset');
      console.log(`   Name: ${circuitHubInDataset.name}`);
      console.log(`   Description: ${circuitHubInDataset.description?.substring(0, 100)}...`);
    } else {
      console.log('❌ CircuitHub NOT found in YC dataset');
      return;
    }
    
    // Step 2: Test EXTERNAL idea similarity analysis
    console.log('\n🎯 Step 2: Running EXTERNAL idea similarity analysis...');
    const externalResult = await server.analyzeIdeaSimilarity({
      userApplication: circuitHubApplication,
      externalData: { ycCompanies: ycData.companies }
    });
    
    const externalAnalysis = JSON.parse(externalResult.content[0].text);
    
    console.log('\n📊 EXTERNAL REVIEW Results:');
    console.log(`Recommendation: ${externalAnalysis.recommendation}`);
    console.log(`Similarity Score: ${externalAnalysis.similarityScore}`);
    console.log(`Most Similar Company: ${externalAnalysis.mostSimilarCompany?.name}`);
    console.log(`Is Similar: ${externalAnalysis.isSimilar}`);
    console.log(`Title Similarity: ${externalAnalysis.analysis?.titleSimilarity}`);
    console.log(`Feedback: ${externalAnalysis.feedback?.substring(0, 200)}...`);
    
    // Check if external review is working correctly
    if (externalAnalysis.recommendation === 'REJECT' && 
        externalAnalysis.mostSimilarCompany?.name === 'CircuitHub') {
      console.log('\n✅ SUCCESS: External review correctly REJECTED CircuitHub application!');
      console.log('💯 The external similarity detection is working properly.');
    } else {
      console.log('\n❌ PROBLEM: External review should have rejected CircuitHub application');
      console.log(`Expected: REJECT with CircuitHub match`);
      console.log(`Actual: ${externalAnalysis.recommendation} with ${externalAnalysis.mostSimilarCompany?.name || 'no match'}`);
      
      // Let's debug why it's not being rejected
      console.log('\n🔍 Debug Information:');
      console.log('- Check if the name matching logic is working');
      console.log('- Check if the business concept similarity is above threshold');
      console.log('- Verify the rejection response format');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testExternalReviewOnly().catch(console.error);
