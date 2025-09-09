#!/usr/bin/env node

import { ExternalReviewMCPServer } from './index.js';

async function testCircuitHubDetection() {
  console.log('🧪 Testing CircuitHub Detection Logic\n');
  
  const server = new (class TestMCPServer extends ExternalReviewMCPServer {
    // Override to test the exact application that's being submitted
    async testAnalyzeApplication(userApplication) {
      console.log('🔍 Starting analysis for:', userApplication.title);
      
      // First get YC companies
      const ycResult = await this.fetchYCCompanies();
      const ycData = JSON.parse(ycResult.content[0].text);
      const ycCompanies = ycData.companies;
      
      console.log(`📊 Loaded ${ycCompanies.length} YC companies`);
      
      // Find CircuitHub in the data
      const circuitHub = ycCompanies.find(company => 
        company.name && company.name.toLowerCase() === 'circuithub'
      );
      
      if (circuitHub) {
        console.log('✅ Found CircuitHub in YC data');
        console.log(`📋 YC CircuitHub: "${circuitHub.name}"`);
        console.log(`📝 Description: "${circuitHub.description}"`);
      } else {
        console.log('❌ CircuitHub not found in YC data');
      }
      
      // Now test the similarity analysis
      console.log('\n🔍 Running fallback similarity analysis...');
      return this.fallbackSimilarityAnalysis(userApplication, ycCompanies);
    }
  })();

  // Test with the exact CircuitHub application from the screenshot
  const circuitHubApplication = {
    title: "CircuitHub",
    description: "CircuitHub offers on-demand electronics manufacturing powered by our factory-scale robotics platform, The Grid. This platform delivers a 10x improvement in the speed and cost of small-batch electronics production. Leading customers like Tesla, NASA, and Zipline rely on CircuitHub to cut their time to market in half.",
    problemStatement: "CircuitHub offers on-demand electronics manufacturing powered by our factory-scale robotics platform, The Grid. This platform delivers a 10x improvement in the speed and cost of small-batch electronics production. Leading customers like Tesla, NASA, and Zipline rely on CircuitHub to cut their time to market in half.",
    proposedSolution: "CircuitHub offers on-demand electronics manufacturing powered by our factory-scale robotics platform, The Grid. This platform delivers a 10x improvement in the speed and cost of small-batch electronics production. Leading customers like Tesla, NASA, and Zipline rely on CircuitHub to cut their time to market in half."
  };

  try {
    console.log('📤 Testing CircuitHub application...');
    console.log(`📋 Title: "${circuitHubApplication.title}"`);
    console.log(`📝 Description: "${circuitHubApplication.description.substring(0, 100)}..."`);
    
    const result = await server.testAnalyzeApplication(circuitHubApplication);
    const analysis = JSON.parse(result.content[0].text);
    
    console.log('\n📊 ANALYSIS RESULT:');
    console.log(`🎯 Recommendation: ${analysis.recommendation}`);
    console.log(`📈 Similarity: ${analysis.overallSimilarity || analysis.similarityScore}%`);
    console.log(`💭 Reason: ${analysis.reason || analysis.feedback}`);
    
    if (analysis.recommendation === 'REJECT') {
      console.log('✅ CORRECT: CircuitHub application properly rejected');
    } else {
      console.log('❌ BUG: CircuitHub application incorrectly approved!');
      console.log('🐛 This is the bug - the system should reject exact YC company matches');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testCircuitHubDetection().catch(console.error);
