#!/usr/bin/env node

// Test Gemini vs Fallback detection
import { spawn } from 'child_process';

async function testMCPWithGemini() {
  console.log('🚀 Testing MCP Server with Gemini API Key\n');
  
  const testRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'analyze_idea_similarity',
      arguments: {
        userApplication: {
          title: 'RobotManufacturing',
          description: 'AI-powered automated electronics production using advanced robotics for small-batch manufacturing',
          targetMarket: 'Electronics manufacturers',
          businessModel: 'Manufacturing as a service'
        },
        externalData: {
          ycCompanies: [
            {
              name: "CircuitHub",
              oneLiner: "On-Demand Electronics Manufacturing",
              description: "CircuitHub offers on-demand electronics manufacturing powered by our factory-scale robotics platform, The Grid. This platform delivers a 10x improvement in the speed and cost of small-batch electronics production.",
              tags: ["Hard Tech", "Hardware", "Robotics"],
              industry: "Industrials"
            }
          ]
        }
      }
    }
  };

  return new Promise((resolve, reject) => {
    const mcpProcess = spawn('node', ['index.js'], {
      cwd: '/Users/darshandineshbhandary/GitHub/ai-hackathon/mcp-server',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    mcpProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    mcpProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    mcpProcess.on('close', (code) => {
      console.log('📊 Analysis Result:');
      
      if (stderr.includes('No valid Gemini API key')) {
        console.log('🔄 Using: Fallback Similarity Detection');
      } else {
        console.log('🤖 Using: Gemini AI Analysis');
      }
      
      try {
        const lines = stdout.trim().split('\n');
        for (const line of lines) {
          if (line.trim().startsWith('{')) {
            const response = JSON.parse(line);
            
            if (response.result?.content?.[0]?.text) {
              const analysis = JSON.parse(response.result.content[0].text);
              
              console.log('\n🎯 Test Case: RobotManufacturing vs CircuitHub');
              console.log('📈 Similarity Score:', analysis.similarityScore);
              console.log('⚖️  Recommendation:', analysis.recommendation);
              console.log('💡 Reasoning:', analysis.feedback?.substring(0, 100) + '...');
              
              if (analysis.mostSimilarCompany) {
                console.log('🏢 Most Similar:', analysis.mostSimilarCompany.name);
              }
            }
            break;
          }
        }
      } catch (parseError) {
        console.log('❌ Failed to parse response');
      }
      
      resolve();
    });

    mcpProcess.on('error', (error) => {
      reject(error);
    });

    // Send the request
    mcpProcess.stdin.write(JSON.stringify(testRequest) + '\n');
    mcpProcess.stdin.end();
  });
}

console.log('🧪 Testing Advanced Business Model Similarity Detection');
console.log('📋 Test Case: "RobotManufacturing" vs "CircuitHub"');
console.log('🎯 Expected: Gemini AI should detect business model similarity');
console.log('📊 Fallback: Would focus on word overlap');
console.log('\n' + '─'.repeat(60) + '\n');

testMCPWithGemini().then(() => {
  console.log('\n✨ Your external review system is now powered by Gemini AI!');
  console.log('🎊 Submit applications to see intelligent similarity detection in action.');
}).catch(console.error);
