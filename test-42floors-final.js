const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function test42Floors() {
  console.log('🧪 Testing Final 42Floors Logic...');
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
            ycCompanies: []
          }
        }
      }
    });

    const { stdout, stderr } = await execAsync(`echo '${testInput}' | node /app/mcp-server/index.js`, {
      timeout: 30000,
      maxBuffer: 1024 * 1024 * 10
    });

    console.log('\n📊 MCP Server Response (exit code: 0):');
    if (stderr) {
      console.log('STDERR:', stderr.substring(0, 500) + '...');
    }

    let result;
    try {
      result = JSON.parse(stdout);
    } catch (e) {
      console.log('Raw stdout:', stdout.substring(0, 1000));
      throw new Error('Failed to parse JSON response');
    }

    console.log('\n🔍 Final Analysis Result:');
    console.log('✅ Recommendation:', result.result?.recommendation);
    console.log('📊 Similarity Score:', result.result?.similarityScore);
    console.log('🏢 Most Similar Company:', result.result?.mostSimilarCompany?.name);
    console.log('📝 Feedback Preview:', result.result?.feedback?.substring(0, 100) + '...');
    
    if (result.result?.similarCompanies?.length > 0) {
      console.log('🔗 Similar Companies Found:');
      result.result.similarCompanies.forEach((company, index) => {
        console.log(`   ${index + 1}. ${company.name} (${company.similarity}% similar) - ${company.batch}`);
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.stdout) console.log('STDOUT:', error.stdout.substring(0, 500));
    if (error.stderr) console.log('STDERR:', error.stderr.substring(0, 500));
  }
}

test42Floors();
