#!/usr/bin/env node

const { spawn } = require('child_process');

console.log('🧪 Testing Enhanced MCP Logic with Void...');

async function testEnhancedMCPCall() {
  const userApplication = {
    title: "Void",
    description: "Open source code editor with AI features similar to Cursor and GitHub Copilot",
    problemStatement: "Existing code editors lack privacy and local control over AI features",
    proposedSolution: "Open source code editor that keeps data private while providing AI assistance",
    targetMarket: "Privacy-conscious developers",
    businessModel: "Open source with premium enterprise features"
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

  console.log('📋 Testing application: "Void"');
  console.log('📝 Description: Open source code editor with AI features');

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
    
    if (stderr) {
      console.log('STDERR:', stderr.slice(0, 500) + '...');
    }

    if (code === 0 && stdout) {
      try {
        const lines = stdout.trim().split('\n');
        for (const line of lines) {
          if (line.trim().startsWith('{') && line.includes('"result"')) {
            const response = JSON.parse(line);
            if (response.result && response.result.content) {
              const analysisText = response.result.content[0].text;
              const analysis = JSON.parse(analysisText);
              console.log('\n🔍 Enhanced Analysis Result:');
              console.log('✅ Recommendation:', analysis.recommendation);
              console.log('📊 Similarity Score:', analysis.similarityScore);
              console.log('🏢 Most Similar Company:', analysis.mostSimilarCompany?.name || 'None');
              console.log('📝 Feedback Preview:', analysis.feedback?.substring(0, 200) + '...');
              
              if (analysis.similarCompanies && analysis.similarCompanies.length > 0) {
                console.log(`\n📋 Found ${analysis.similarCompanies.length} similar companies:`);
                analysis.similarCompanies.slice(0, 3).forEach((comp, i) => {
                  console.log(`  ${i+1}. ${comp.name} (${comp.batch}) - ${comp.similarityScore}% similar`);
                });
              }
            }
            break;
          }
        }
      } catch (e) {
        console.error('Failed to parse response:', e.message);
        console.log('Raw stdout (first 1000 chars):', stdout.slice(0, 1000));
      }
    }
  });
}

testEnhancedMCPCall();
