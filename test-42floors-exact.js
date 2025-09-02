const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function test42FloorsExactMatch() {
  console.log('🧪 Testing 42Floors Exact Match Detection...');
  console.log('📋 Testing application: "42Floors"');
  console.log('📝 Description: Commercial real estate search platform');

  try {
    const testInput = JSON.stringify({
      method: 'analyze_idea_similarity',
      params: {
        arguments: {
          userApplication: {
            title: '42Floors',
            description: 'A comprehensive commercial real estate search and listing platform that helps businesses find office spaces.',
            problemStatement: 'Finding commercial real estate is difficult and time-consuming for businesses.',
            proposedSolution: 'Create an online platform that simplifies commercial real estate search with advanced filters and detailed listings.',
            targetMarket: 'Small to medium businesses looking for office space',
            businessModel: 'Commission-based revenue from successful leases'
          },
          externalData: {
            ycCompanies: []  // Empty array to force server-side fetching
          }
        }
      }
    });

    console.log('📤 Sending request to MCP server...');
    
    // Let's run this and capture both stdout and stderr separately
    const { stdout, stderr } = await execAsync(`echo '${testInput}' | node /app/mcp-server/index.js 2>&1`, {
      timeout: 60000,
      maxBuffer: 1024 * 1024 * 10
    });

    console.log('\n🔍 Complete Output:');
    console.log(stdout);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.stdout) {
      console.log('📥 Full Output:');
      console.log(error.stdout);
    }
  }
}

test42FloorsExactMatch();
