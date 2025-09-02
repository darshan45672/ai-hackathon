#!/usr/bin/env node

const { spawn } = require('child_process');

console.log('🧪 Testing AI Service MCP call with 42Floors...');

async function testMCPCall() {
  const userApplication = {
    title: "42Floors",
    description: "We make it easy to search for office space. Commercial real estate platform.",
    problemStatement: "Commercial real estate search is difficult and time-consuming",
    proposedSolution: "Online platform to search and discover office spaces",
    targetMarket: "Businesses looking for office space",
    businessModel: "Commission from real estate transactions"
  };

  const mcpRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'analyze_idea_similarity',
      arguments: {
        userApplication,
        externalData: {
          ycCompanies: [] // Let MCP server fetch them
        }
      }
    }
  };

  console.log('📋 Request:', JSON.stringify(mcpRequest, null, 2));

  const mcpProcess = spawn('node', ['/app/mcp-server/index.js'], {
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

  mcpProcess.stdin.write(JSON.stringify(mcpRequest) + '\n');
  mcpProcess.stdin.end();

  mcpProcess.on('close', (code) => {
    console.log(`\n📊 MCP Server Response (exit code: ${code}):`);
    console.log('STDOUT:', stdout);
    if (stderr) {
      console.log('STDERR:', stderr);
    }

    if (code === 0 && stdout) {
      try {
        const lines = stdout.trim().split('\n');
        for (const line of lines) {
          if (line.trim().startsWith('{')) {
            const response = JSON.parse(line);
            if (response.result && response.result.content) {
              const analysisText = response.result.content[0].text;
              const analysis = JSON.parse(analysisText);
              console.log('\n🔍 Parsed Analysis:');
              console.log('Status:', analysis.status);
              console.log('Recommendation:', analysis.recommendation);
              console.log('Reason:', analysis.reason);
              console.log('Similar Company:', analysis.similarCompany?.name || 'None');
              console.log('Similarity Score:', analysis.similarityScore || 0);
            }
            break;
          }
        }
      } catch (e) {
        console.error('Failed to parse response:', e.message);
      }
    }
  });
}

testMCPCall();
