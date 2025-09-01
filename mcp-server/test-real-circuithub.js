#!/usr/bin/env node

// Test CircuitHub rejection with exact user data format
import { ExternalReviewMCPServer } from './index.js';

async function testRealCircuitHubScenario() {
  console.log('🧪 Testing CircuitHub with real user scenario...\n');
  
  const server = new ExternalReviewMCPServer();
  
  // Exact CircuitHub application that would match the YC company
  const userApplication = {
    title: "CircuitHub",
    description: "On-Demand Electronics Manufacturing",
    problemStatement: "CircuitHub offers on-demand electronics manufacturing powered by our factory-scale robotics platform, The Grid. This platform delivers a 10x improvement in the speed and cost of small-batch electronics production. Leading customers like Tesla, NASA, and Zipline rely on CircuitHub to cut their time to market in half.",
    proposedSolution: "CircuitHub offers on-demand electronics manufacturing powered by our factory-scale robotics platform, The Grid. This platform delivers a 10x improvement in the speed and cost of small-batch electronics production. Leading customers like Tesla, NASA, and Zipline rely on CircuitHub to cut their time to market in half.",
    targetMarket: "Electronics manufacturers",
    businessModel: "On-demand manufacturing service"
  };
  
  console.log('📋 User Application Details:');
  console.log('Title:', userApplication.title);
  console.log('Description:', userApplication.description);
  console.log('Problem:', userApplication.problemStatement.substring(0, 100) + '...');
  console.log('Solution:', userApplication.proposedSolution.substring(0, 100) + '...');
  
  // Test with real API call (will fallback if no API key)
  try {
    const ycResult = await server.fetchYCCompanies();
    const ycData = JSON.parse(ycResult.content[0].text);
    
    console.log(`\n📊 YC Dataset Info:`);
    console.log(`Total companies: ${ycData.companies.length}`);
    console.log(`Error flag: ${ycData.error || false}`);
    console.log(`Fallback data: ${ycData.fallbackData || false}`);
    
    // Check if CircuitHub is in dataset
    const circuitHubInDataset = ycData.companies.find(c => 
      c.name.toLowerCase() === 'circuithub' || 
      c.slug === 'circuithub'
    );
    
    if (circuitHubInDataset) {
      console.log('✅ CircuitHub found in dataset:');
      console.log('  Name:', circuitHubInDataset.name);
      console.log('  Slug:', circuitHubInDataset.slug);
      console.log('  Description:', circuitHubInDataset.description?.substring(0, 100) + '...');
    } else {
      console.log('❌ CircuitHub NOT found in dataset');
      console.log('Available companies (first 10):');
      ycData.companies.slice(0, 10).forEach(c => {
        console.log(`  - ${c.name} (${c.slug || 'no slug'})`);
      });
    }
    
    // Test similarity analysis
    console.log('\n🔍 Running similarity analysis...');
    const analysisResult = await server.analyzeIdeaSimilarity({
      userApplication,
      externalData: { ycCompanies: ycData.companies }
    });
    
    const analysis = JSON.parse(analysisResult.content[0].text);
    
    console.log('\n🎯 Final Analysis Results:');
    console.log('📊 Similarity Score:', analysis.similarityScore);
    console.log('🔍 Is Similar:', analysis.isSimilar);
    console.log('💡 Recommendation:', analysis.recommendation);
    console.log('📋 Most Similar Company:', analysis.mostSimilarCompany?.name);
    console.log('💬 Feedback Preview:', analysis.feedback?.substring(0, 150) + '...');
    
    if (analysis.recommendation === 'REJECT') {
      console.log('\n✅ SUCCESS: Application correctly rejected!');
      console.log('🎯 Reason:', analysis.mostSimilarCompany?.reason || 'Not specified');
    } else {
      console.log('\n❌ PROBLEM: Application was approved when it should be rejected!');
      console.log('This indicates a bug in the similarity detection logic.');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testRealCircuitHubScenario().catch(console.error);
