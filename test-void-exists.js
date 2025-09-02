const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function checkVoidInYC() {
  console.log('🔍 Checking if Void exists in YC companies database...');

  try {
    const testInput = JSON.stringify({
      method: 'fetch_yc_companies',
      params: {
        arguments: {
          forSimilarityAnalysis: true
        }
      }
    });

    console.log('📤 Fetching YC companies...');
    const { stdout, stderr } = await execAsync(`echo '${testInput}' | node /app/mcp-server/index.js`, {
      timeout: 30000,
      maxBuffer: 1024 * 1024 * 10
    });

    if (stderr) {
      console.log('STDERR:', stderr.substring(0, 200));
    }

    let result;
    try {
      result = JSON.parse(stdout);
    } catch (e) {
      console.log('Raw stdout preview:', stdout.substring(0, 500));
      throw new Error('Failed to parse JSON response');
    }

    const companies = result.result?.content?.[0]?.text ? JSON.parse(result.result.content[0].text) : [];
    console.log(`📊 Total YC companies fetched: ${companies.length}`);
    
    // Search for Void
    const voidCompanies = companies.filter(company => 
      company.name.toLowerCase().includes('void') ||
      company.name.toLowerCase() === 'void'
    );
    
    console.log(`🔍 Companies with "void" in name: ${voidCompanies.length}`);
    
    if (voidCompanies.length > 0) {
      console.log('📋 Void-related companies found:');
      voidCompanies.forEach((company, index) => {
        console.log(`   ${index + 1}. "${company.name}" (${company.batch}) - ${company.oneLiner}`);
      });
    } else {
      console.log('❌ No companies with "Void" found in YC database');
      
      // Let's check some recent companies to see what's available
      console.log('\n📋 Sample of recent companies (for reference):');
      const recentCompanies = companies
        .filter(c => c.batch && c.batch.includes('2024'))
        .slice(0, 10);
      
      recentCompanies.forEach((company, index) => {
        console.log(`   ${index + 1}. "${company.name}" (${company.batch}) - ${company.oneLiner}`);
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.stdout) console.log('STDOUT:', error.stdout.substring(0, 500));
    if (error.stderr) console.log('STDERR:', error.stderr.substring(0, 500));
  }
}

checkVoidInYC();
