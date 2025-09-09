#!/usr/bin/env node

import { ExternalReviewMCPServer } from './index.js';

async function testActualMCPCall() {
  console.log('🧪 Testing Actual MCP analyze_idea_similarity Call\n');
  
  const server = new (class TestMCPServer extends ExternalReviewMCPServer {
    // Override to test the actual analyze_idea_similarity method that would be called by AI backend
    async testActualCall(userApplication) {
      console.log('🔍 Calling analyzeIdeaSimilarity with the exact same parameters the AI backend would use...');
      
      // This is exactly how the AI backend calls the MCP server
      const args = {
        userApplication: userApplication
        // Note: No externalData provided, so it should fetch YC companies from API
      };
      
      return this.analyzeIdeaSimilarity(args);
    }
  })();

  // Test with the exact CircuitHub application
  const circuitHubApplication = {
    title: "CircuitHub",
    description: "CircuitHub offers on-demand electronics manufacturing powered by our factory-scale robotics platform, The Grid. This platform delivers a 10x improvement in the speed and cost of small-batch electronics production. Leading customers like Tesla, NASA, and Zipline rely on CircuitHub to cut their time to market in half.",
    problemStatement: "CircuitHub offers on-demand electronics manufacturing powered by our factory-scale robotics platform, The Grid. This platform delivers a 10x improvement in the speed and cost of small-batch electronics production. Leading customers like Tesla, NASA, and Zipline rely on CircuitHub to cut their time to market in half.",
    proposedSolution: "CircuitHub offers on-demand electronics manufacturing powered by our factory-scale robotics platform, The Grid. This platform delivers a 10x improvement in the speed and cost of small-batch electronics production. Leading customers like Tesla, NASA, and Zipline rely on CircuitHub to cut their time to market in half."
  };

  try {
    console.log('📤 Simulating AI Backend call to MCP server...');
    console.log(`📋 Title: "${circuitHubApplication.title}"`);
    
    const result = await server.testActualCall(circuitHubApplication);
    
    console.log('\n📊 MCP SERVER RESPONSE:');
    console.log('📄 Raw result:', JSON.stringify(result, null, 2));
    
    if (result && result.content && result.content[0] && result.content[0].text) {
      try {
        const analysis = JSON.parse(result.content[0].text);
        console.log('\n📊 PARSED ANALYSIS:');
        console.log(`🎯 Recommendation: ${analysis.recommendation}`);
        console.log(`📈 Similarity: ${analysis.overallSimilarity || analysis.similarityScore || 'N/A'}%`);
        console.log(`💭 Reason: ${analysis.reason || analysis.feedback}`);
        
        if (analysis.recommendation === 'REJECT') {
          console.log('\n✅ SUCCESS: CircuitHub properly rejected by MCP server');
          console.log('🔍 The MCP server is working correctly');
          console.log('⚠️  The issue must be in the AI backend or frontend integration');
        } else {
          console.log('\n❌ BUG: CircuitHub incorrectly approved by MCP server');
        }
      } catch (parseError) {
        console.error('❌ Failed to parse MCP response:', parseError.message);
        console.log('📄 Raw response text:', result.content[0].text);
      }
    } else {
      console.error('❌ Invalid MCP response format');
    }
    
  } catch (error) {
    console.error('❌ MCP call failed:', error.message);
    console.error(error.stack);
  }
}

testActualMCPCall().catch(console.error);
