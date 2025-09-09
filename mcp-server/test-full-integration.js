#!/usr/bin/env node

// Test the entire AI backend -> MCP server integration
import { spawn } from 'child_process';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testFullIntegration() {
  console.log('🧪 Testing Full AI Backend -> MCP Server Integration\n');
  
  const mcpServerPath = join(__dirname, 'index.js');
  
  // Test the exact MCP request that the AI backend would send
  const mcpRequest = {
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'tools/call',
    params: {
      name: 'analyze_idea_similarity',
      arguments: {
        userApplication: {
          title: "CircuitHub",
          description: "CircuitHub offers on-demand electronics manufacturing powered by our factory-scale robotics platform, The Grid. This platform delivers a 10x improvement in the speed and cost of small-batch electronics production. Leading customers like Tesla, NASA, and Zipline rely on CircuitHub to cut their time to market in half.",
          problemStatement: "CircuitHub offers on-demand electronics manufacturing powered by our factory-scale robotics platform, The Grid. This platform delivers a 10x improvement in the speed and cost of small-batch electronics production. Leading customers like Tesla, NASA, and Zipline rely on CircuitHub to cut their time to market in half.",
          proposedSolution: "CircuitHub offers on-demand electronics manufacturing powered by our factory-scale robotics platform, The Grid. This platform delivers a 10x improvement in the speed and cost of small-batch electronics production. Leading customers like Tesla, NASA, and Zipline rely on CircuitHub to cut their time to market in half."
        }
        // No externalData - let MCP server fetch YC companies
      }
    }
  };

  console.log('📤 Sending MCP request...');
  console.log(`📋 Request: ${JSON.stringify(mcpRequest, null, 2).substring(0, 200)}...`);

  return new Promise((resolve, reject) => {
    const mcpProcess = spawn('node', [mcpServerPath], {
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
      console.log(`📊 MCP Process exited with code: ${code}`);
      
      if (stderr) {
        console.log(`📄 MCP stderr: ${stderr}`);
      }

      try {
        // Parse the MCP response
        const lines = stdout.split('\n').filter(line => line.trim());
        let mcpResponse = null;
        
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.id === mcpRequest.id) {
              mcpResponse = parsed;
              break;
            }
          } catch (e) {
            // Skip non-JSON lines (like log output)
          }
        }

        if (mcpResponse) {
          console.log('📥 MCP Response received');
          
          if (mcpResponse.error) {
            console.error('❌ MCP Error:', mcpResponse.error);
            resolve({ success: false, error: mcpResponse.error });
            return;
          }

          const analysisText = mcpResponse.result?.content?.[0]?.text;
          if (analysisText) {
            try {
              const analysis = JSON.parse(analysisText);
              console.log('\n📊 ANALYSIS RESULT:');
              console.log(`🎯 Recommendation: ${analysis.recommendation}`);
              console.log(`📈 Similarity: ${analysis.overallSimilarity || analysis.similarityScore || 'N/A'}%`);
              console.log(`💭 Feedback: ${analysis.feedback || analysis.reason}`);
              
              if (analysis.recommendation === 'REJECT') {
                console.log('\n✅ SUCCESS: Full integration correctly rejects CircuitHub');
                console.log('🔍 The AI backend -> MCP server integration is working properly');
              } else {
                console.log('\n❌ BUG: Full integration incorrectly approves CircuitHub');
                console.log('🐛 There may still be an issue in the integration');
              }
              
              resolve({ success: true, analysis });
            } catch (parseError) {
              console.error('❌ Failed to parse analysis:', parseError.message);
              console.log(`📄 Raw analysis text: ${analysisText}`);
              resolve({ success: false, error: 'Parse error' });
            }
          } else {
            console.error('❌ No analysis text in MCP response');
            console.log(`📄 Full response: ${JSON.stringify(mcpResponse, null, 2)}`);
            resolve({ success: false, error: 'No analysis text' });
          }
        } else {
          console.error('❌ No valid MCP response found');
          console.log(`📄 Raw stdout: ${stdout}`);
          resolve({ success: false, error: 'No response' });
        }
      } catch (error) {
        console.error('❌ Error processing MCP response:', error.message);
        resolve({ success: false, error: error.message });
      }
    });

    mcpProcess.on('error', (error) => {
      console.error('❌ Failed to start MCP process:', error.message);
      reject(error);
    });

    // Send the request
    mcpProcess.stdin.write(JSON.stringify(mcpRequest) + '\n');
    mcpProcess.stdin.end();
    
    // Set timeout
    setTimeout(() => {
      mcpProcess.kill();
      reject(new Error('MCP request timeout'));
    }, 30000); // 30 second timeout
  });
}

testFullIntegration().catch(console.error);
