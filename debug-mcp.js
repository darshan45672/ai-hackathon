#!/usr/bin/env node

// Debug script to test MCP server behavior
import { spawn } from 'child_process';

async function testMCPServerDirectly() {
  console.log('🧪 Testing MCP Server Direct Analysis\n');
  
  const testRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'analyze_idea_similarity',
      arguments: {
        userApplication: {
          title: 'CircuitHub',
          description: 'On-demand electronics manufacturing powered by our factory-scale robotics platform, The Grid. This platform delivers a 10x improvement in the speed and cost of small-batch electronics production.',
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
            },
            {
              name: "Stripe",
              oneLiner: "Online payment processing",
              description: "Stripe is a technology company that builds economic infrastructure for the internet.",
              tags: ["Fintech", "Payments", "API"],
              industry: "Fintech"
            }
          ]
        }
      }
    }
  };

  return new Promise((resolve, reject) => {
    const mcpProcess = spawn('node', ['index.js'], {
      cwd: '/Users/darshandineshbhandary/GitHub/ai-hackathon/mcp-server',
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, GEMINI_API_KEY: 'test-key' }
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
      console.log('📊 MCP Server Output:');
      console.log('STDOUT:', stdout);
      console.log('STDERR:', stderr);
      console.log('Exit Code:', code);
      
      try {
        const lines = stdout.trim().split('\n');
        for (const line of lines) {
          if (line.trim().startsWith('{')) {
            const response = JSON.parse(line);
            console.log('\n🔍 Parsed Response:');
            console.log(JSON.stringify(response, null, 2));
            
            if (response.result?.content?.[0]?.text) {
              const analysis = JSON.parse(response.result.content[0].text);
              console.log('\n🤖 Gemini Analysis Result:');
              console.log(JSON.stringify(analysis, null, 2));
            }
            break;
          }
        }
      } catch (parseError) {
        console.log('\n❌ Failed to parse response:', parseError.message);
      }
      
      resolve();
    });

    mcpProcess.on('error', (error) => {
      console.log('❌ Process Error:', error);
      reject(error);
    });

    // Send the request
    mcpProcess.stdin.write(JSON.stringify(testRequest) + '\n');
    mcpProcess.stdin.end();
  });
}

console.log('🎯 Expected Behavior:');
console.log('- Input: CircuitHub with exact YC company description');
console.log('- Expected: REJECT with high similarity score');
console.log('- Reason: Direct match with existing YC company');
console.log('\n' + '─'.repeat(50) + '\n');

testMCPServerDirectly().catch(console.error);
