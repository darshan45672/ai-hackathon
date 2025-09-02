const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function testCostAnalysis() {
  console.log('💰 Testing Cost Analysis MCP Feature...');
  console.log('📋 Testing application: "AI-Powered E-commerce Platform"');

  try {
    const testInput = JSON.stringify({
      method: 'analyze_cost_feasibility',
      params: {
        arguments: {
          application: {
            title: 'AI-Powered E-commerce Platform',
            description: 'A comprehensive e-commerce platform with AI-powered recommendations, real-time inventory management, and advanced analytics. Features include machine learning-based product recommendations, fraud detection, and automated customer support.',
            problemStatement: 'Small businesses struggle with creating competitive e-commerce platforms that can provide personalized shopping experiences and compete with larger retailers.',
            solution: 'Build an AI-powered e-commerce platform that provides intelligent product recommendations, fraud detection, inventory optimization, and customer insights to help small businesses compete effectively.',
            techStack: ['React', 'Node.js', 'Python', 'TensorFlow', 'PostgreSQL', 'Redis', 'AWS', 'Docker', 'Kubernetes'],
            teamSize: 5,
            estimatedCost: 75000,
            targetMarket: 'Small to medium-sized businesses',
            businessModel: 'SaaS subscription with transaction fees'
          }
        }
      }
    });

    console.log('📤 Sending cost analysis request to MCP server...');
    const { stdout, stderr } = await execAsync(`echo '${testInput}' | node /app/mcp-server/index.js`, {
      timeout: 60000,
      maxBuffer: 1024 * 1024 * 10
    });

    if (stderr) {
      console.log('🔍 STDERR (Debug Output):');
      console.log(stderr.substring(0, 500));
    }

    let result;
    try {
      result = JSON.parse(stdout);
    } catch (e) {
      console.log('Raw stdout preview:', stdout.substring(0, 1000));
      throw new Error('Failed to parse JSON response');
    }

    const analysis = result.result?.content?.[0]?.text ? JSON.parse(result.result.content[0].text) : result;

    console.log('\n💰 Cost Analysis Results:');
    console.log('✅ Feasible:', analysis.isFeasible);
    console.log('📊 Feasibility Score:', analysis.feasibilityScore);
    console.log('💵 Requested Budget: $' + analysis.requestedBudget?.toLocaleString());
    console.log('💵 Estimated Total Cost: $' + analysis.totalEstimatedCost?.toLocaleString());
    console.log('📈 Budget Variance:', analysis.budgetVariancePercentage + '%');
    
    if (analysis.costBreakdown) {
      console.log('\n📋 Cost Breakdown:');
      console.log('  👨‍💻 Development: $' + analysis.costBreakdown.development?.toLocaleString());
      console.log('  🏗️ Infrastructure: $' + analysis.costBreakdown.infrastructure?.toLocaleString());
      console.log('  🔗 Third-party Services: $' + analysis.costBreakdown.thirdPartyServices?.toLocaleString());
      console.log('  ⚙️ Operational: $' + analysis.costBreakdown.operational?.toLocaleString());
      console.log('  🛡️ Contingency: $' + analysis.costBreakdown.contingency?.toLocaleString());
    }

    if (analysis.detailedAnalysis) {
      console.log('\n🔍 Detailed Analysis:');
      console.log('  📊 Complexity:', analysis.detailedAnalysis.complexityAssessment);
      console.log('  ⏱️ Timeline:', analysis.detailedAnalysis.developmentTimeEstimate);
      console.log('  🎯 Main Cost Drivers:', analysis.detailedAnalysis.mainCostDrivers?.join(', '));
    }

    console.log('\n📝 Recommendation:');
    console.log(analysis.recommendation);

    console.log('\n🎉 Test Completed Successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.stdout) console.log('STDOUT:', error.stdout.substring(0, 1000));
    if (error.stderr) console.log('STDERR:', error.stderr.substring(0, 1000));
  }
}

testCostAnalysis();
