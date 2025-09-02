const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function testVoidWithDebug() {
  console.log('🧪 Testing Void with Full Debug Output...');
  console.log('📋 Testing application: "Void"');
  console.log('📝 Description: Open source code editor with AI features');

  try {
    const testInput = JSON.stringify({
      method: 'analyze_idea_similarity',
      params: {
        arguments: {
          userApplication: {
            title: 'Void',
            description: 'Open source code editor with AI features similar to Cursor and GitHub Copilot. Unlike other tools, Void lets developers keep their data completely private by connecting directly to any LLM.',
            problemStatement: 'Developers want AI-powered code assistance but are concerned about data privacy and vendor lock-in with proprietary tools.',
            proposedSolution: 'Create an open-source code editor that provides AI features while ensuring complete data privacy through direct LLM connections.',
            targetMarket: 'Privacy-conscious developers and enterprises',
            businessModel: 'Open source with premium enterprise features'
          },
          externalData: {
            ycCompanies: []  // Empty array to force server-side fetching
          }
        }
      }
    });

    console.log('📤 Sending request to MCP server...');
    const { stdout, stderr } = await execAsync(`echo '${testInput}' | node /app/mcp-server/index.js`, {
      timeout: 30000,
      maxBuffer: 1024 * 1024 * 10
    });

    console.log('\n📥 Raw STDERR (Debug Output):');
    console.log(stderr);
    
    console.log('\n📥 Raw STDOUT (Result):');
    console.log(stdout.substring(0, 1000));

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.stdout) console.log('STDOUT:', error.stdout.substring(0, 1000));
    if (error.stderr) console.log('STDERR:', error.stderr.substring(0, 1000));
  }
}

testVoidWithDebug();
