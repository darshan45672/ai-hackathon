#!/usr/bin/env node

// Test script to verify CircuitHub rejection in containerized environment
async function testContainerizedExternalReview() {
  console.log('🧪 Testing CircuitHub rejection in containerized environment...');
  
  const applicationData = {
    title: "CircuitHub",
    description: "CircuitHub offers on-demand electronics manufacturing powered by our factory-scale robotics platform, The Grid. This platform delivers a 10x improvement in the speed and cost of small-batch electronics production. Leading customers like Tesla, NASA, and Zipline rely on CircuitHub to cut their time to market in half.",
    problemStatement: "CircuitHub offers on-demand electronics manufacturing powered by our factory-scale robotics platform, The Grid. This platform delivers a 10x improvement in the speed and cost of small-batch electronics production. Leading customers like Tesla, NASA, and Zipline rely on CircuitHub to cut their time to market in half.",
    proposedSolution: "CircuitHub offers on-demand electronics manufacturing powered by our factory-scale robotics platform, The Grid. This platform delivers a 10x improvement in the speed and cost of small-batch electronics production. Leading customers like Tesla, NASA, and Zipline rely on CircuitHub to cut their time to market in half.",
    targetMarket: "Electronics manufacturers, hardware startups, Tesla, NASA, Zipline",
    businessModel: "On-demand manufacturing service"
  };

  try {
    // Test the AI service external review endpoint
    const response = await fetch('http://localhost:3002/ai-review/test-external', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userApplication: applicationData
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('📊 External Review Result:', JSON.stringify(result, null, 2));

    if (result.recommendation === 'REJECT') {
      console.log('✅ SUCCESS: CircuitHub was correctly REJECTED by containerized external review!');
      console.log(`🎯 Similarity Score: ${result.similarityScore * 100}%`);
      console.log(`📋 Reason: ${result.mostSimilarCompany?.reason || 'Name conflict'}`);
    } else {
      console.log('❌ PROBLEM: CircuitHub was APPROVED instead of rejected!');
      console.log('🔍 This indicates the containerized MCP server is not working correctly');
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
    
    // If the endpoint doesn't exist, test the MCP client directly
    console.log('🔄 Falling back to direct container test...');
    
    try {
      const { exec } = require('child_process');
      const util = require('util');
      const execPromise = util.promisify(exec);
      
      const testCommand = `podman exec ai_hackathon_dev_ai-service_1 node -e "
        const { MCPClientService } = require('./dist/mcp/mcp-client.service.js');
        async function test() {
          const service = new MCPClientService();
          const ycCompanies = [
            {
              name: 'CircuitHub',
              oneLiner: 'On-Demand Electronics Manufacturing',
              description: 'CircuitHub offers on-demand electronics manufacturing.',
              industry: 'Industrials',
              tags: ['Hard Tech', 'Hardware', 'Robotics']
            }
          ];
          
          const result = await service.analyzeIdeaSimilarity(${JSON.stringify(applicationData)}, ycCompanies);
          console.log('CONTAINER_TEST_RESULT:', JSON.stringify(result));
        }
        test().catch(console.error);
      "`;
      
      const { stdout, stderr } = await execPromise(testCommand);
      console.log('📋 Container Test Output:', stdout);
      if (stderr) console.error('❌ Container Test Errors:', stderr);
      
    } catch (containerError) {
      console.error('💥 Container test also failed:', containerError.message);
    }
  }
}

// Run the test
testContainerizedExternalReview();
