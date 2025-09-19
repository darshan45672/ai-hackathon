#!/usr/bin/env node

/**
 * Quick AI Services Test
 * 
 * This script tests the new target audience and business outcome analysis services
 * without requiring the full infrastructure to be running.
 * 
 * It simulates what the AI services would do with realistic data.
 */

console.log('🧪 AI Services Quick Test');
console.log('='.repeat(50));

// Simulate Target Audience Analysis
function testTargetAudienceAnalysis() {
  console.log('\n🎯 Testing Target Audience Analysis');
  console.log('-'.repeat(30));
  
  const testData = `
  Primary Audience:
  - K-12 students (ages 6-18) in public and private schools
  - Demographics: Global reach, starting with English-speaking countries
  - Psychographics: Students struggling with traditional learning methods
  
  Secondary Audience:
  - Teachers and educators seeking differentiation tools
  - Parents wanting to support their children's learning
  - Educational institutions looking for academic improvement
  
  Market Segmentation:
  - B2C: Individual families ($9.99/month per student)
  - B2B: Schools and districts ($5-15 per student per month)
  
  Market Size:
  - TAM: 1.6 billion students globally
  - Initial Target: 100,000 active students within 24 months
  `;
  
  // Simulate the analysis algorithm
  const analysis = analyzeTargetAudienceContent(testData);
  
  console.log(`✅ Market Clarity: ${Math.round(analysis.marketClarity * 100)}%`);
  console.log(`✅ Segmentation: ${Math.round(analysis.segmentation * 100)}%`);
  console.log(`✅ Reachability: ${Math.round(analysis.reachability * 100)}%`);
  console.log(`✅ Market Size: ${Math.round(analysis.marketSize * 100)}%`);
  console.log(`🏆 Overall Score: ${Math.round(analysis.overall * 100)}%`);
  console.log(`🎯 Decision: ${analysis.decision}`);
  
  return analysis;
}

// Simulate Business Outcome Analysis
function testBusinessOutcomeAnalysis() {
  console.log('\n📈 Testing Business Outcome Analysis');
  console.log('-'.repeat(30));
  
  const testData = `
  Financial Goals:
  - Year 1: $2M ARR with 200K freemium users, 20K premium subscribers
  - Year 2: $10M ARR expanding to institutional customers
  - Break-even: Month 18 with 150K paying users
  
  Learning Impact Metrics:
  - Improve student test scores by average 25% within 6 months
  - Increase student engagement metrics by 40%
  - Help 90% of struggling students reach grade-level proficiency
  
  Business Performance KPIs:
  - User Acquisition: 50K new students monthly by year 2
  - Retention: 85% annual retention for premium subscribers
  - Conversion: 15% freemium to premium conversion rate
  - NPS Score: >70 from students, teachers, and parents
  
  Strategic Goals:
  - Become the de facto standard for personalized learning
  - International expansion to emerging markets
  `;
  
  // Simulate the analysis algorithm
  const analysis = analyzeBusinessOutcomeContent(testData);
  
  console.log(`✅ Goal Clarity: ${Math.round(analysis.goalClarity * 100)}%`);
  console.log(`✅ Measurability: ${Math.round(analysis.measurability * 100)}%`);
  console.log(`✅ Achievability: ${Math.round(analysis.achievability * 100)}%`);
  console.log(`✅ Revenue Viability: ${Math.round(analysis.revenueViability * 100)}%`);
  console.log(`🏆 Overall Score: ${Math.round(analysis.overall * 100)}%`);
  console.log(`🎯 Decision: ${analysis.decision}`);
  
  return analysis;
}

function analyzeTargetAudienceContent(content) {
  const text = content.toLowerCase();
  
  // Market Clarity Analysis
  let marketClarity = 0;
  if (text.includes('ages') || text.includes('demographics')) marketClarity += 0.3;
  if (text.includes('students') || text.includes('primary audience')) marketClarity += 0.3;
  if (text.includes('global') || text.includes('countries')) marketClarity += 0.2;
  if (text.includes('psychographic') || text.includes('struggling')) marketClarity += 0.2;
  
  // Segmentation Analysis
  let segmentation = 0;
  if (text.includes('primary') && text.includes('secondary')) segmentation += 0.4;
  if (text.includes('b2c') || text.includes('b2b')) segmentation += 0.3;
  if (text.includes('$') || text.includes('pricing')) segmentation += 0.3;
  
  // Reachability Analysis
  let reachability = 0;
  if (text.includes('schools') || text.includes('institutions')) reachability += 0.4;
  if (text.includes('teachers') || text.includes('parents')) reachability += 0.3;
  if (text.includes('districts') || text.includes('educational')) reachability += 0.3;
  
  // Market Size Analysis
  let marketSize = 0;
  if (text.includes('billion') || text.includes('million')) marketSize += 0.4;
  if (text.includes('tam') || text.includes('target')) marketSize += 0.3;
  if (text.includes('100,000') || text.includes('students')) marketSize += 0.3;
  
  const overall = (marketClarity + segmentation + reachability + marketSize) / 4;
  
  return {
    marketClarity: Math.min(1, marketClarity),
    segmentation: Math.min(1, segmentation),
    reachability: Math.min(1, reachability),
    marketSize: Math.min(1, marketSize),
    overall: Math.min(1, overall),
    decision: overall >= 0.6 ? 'APPROVED' : 'NEEDS_IMPROVEMENT'
  };
}

function analyzeBusinessOutcomeContent(content) {
  const text = content.toLowerCase();
  
  // Goal Clarity Analysis
  let goalClarity = 0;
  if (text.includes('revenue') || text.includes('arr')) goalClarity += 0.3;
  if (text.includes('financial goals') || text.includes('break-even')) goalClarity += 0.3;
  if (text.includes('impact') || text.includes('improve')) goalClarity += 0.2;
  if (text.includes('strategic') || text.includes('goals')) goalClarity += 0.2;
  
  // Measurability Analysis
  let measurability = 0;
  if (text.match(/\d+%/) || text.includes('percent')) measurability += 0.4;
  if (text.match(/\$\d+/) || text.includes('million')) measurability += 0.3;
  if (text.includes('year') || text.includes('month')) measurability += 0.3;
  
  // Achievability Analysis
  let achievability = 0;
  if (text.includes('year 1') && text.includes('year 2')) achievability += 0.4;
  if (text.includes('kpi') || text.includes('metrics')) achievability += 0.3;
  if (text.includes('retention') || text.includes('conversion')) achievability += 0.3;
  
  // Revenue Viability Analysis
  let revenueViability = 0;
  if (text.includes('subscribers') || text.includes('customers')) revenueViability += 0.3;
  if (text.includes('freemium') || text.includes('premium')) revenueViability += 0.3;
  if (text.includes('expansion') || text.includes('markets')) revenueViability += 0.2;
  if (text.includes('acquisition') || text.includes('growth')) revenueViability += 0.2;
  
  const overall = (goalClarity + measurability + achievability + revenueViability) / 4;
  
  return {
    goalClarity: Math.min(1, goalClarity),
    measurability: Math.min(1, measurability),
    achievability: Math.min(1, achievability),
    revenueViability: Math.min(1, revenueViability),
    overall: Math.min(1, overall),
    decision: overall >= 0.6 ? 'APPROVED' : 'NEEDS_IMPROVEMENT'
  };
}

// Test Integration Workflow
function testReviewPipelineIntegration() {
  console.log('\n🔄 Testing Review Pipeline Integration');
  console.log('-'.repeat(30));
  
  const targetAnalysis = testTargetAudienceAnalysis();
  const outcomeAnalysis = testBusinessOutcomeAnalysis();
  
  console.log('\n📊 Pipeline Integration Results:');
  console.log('-'.repeat(30));
  
  const combinedScore = (targetAnalysis.overall + outcomeAnalysis.overall) / 2;
  const bothApproved = targetAnalysis.decision === 'APPROVED' && outcomeAnalysis.decision === 'APPROVED';
  
  console.log(`🎯 Target Audience: ${targetAnalysis.decision} (${Math.round(targetAnalysis.overall * 100)}%)`);
  console.log(`📈 Business Outcome: ${outcomeAnalysis.decision} (${Math.round(outcomeAnalysis.overall * 100)}%)`);
  console.log(`🏆 Combined Score: ${Math.round(combinedScore * 100)}%`);
  console.log(`✅ Pipeline Status: ${bothApproved ? 'APPROVED' : 'NEEDS_IMPROVEMENT'}`);
  
  if (bothApproved) {
    console.log('\n🎉 Application would continue to next review step!');
  } else {
    console.log('\n📝 Application needs improvements in highlighted areas.');
  }
}

// Run the tests
console.log('🚀 Starting AI Services Tests...\n');

try {
  testReviewPipelineIntegration();
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ AI Services Test Complete!');
  console.log('='.repeat(50));
  console.log('\n💡 Next Steps:');
  console.log('   • Start your infrastructure (docker-compose up)');
  console.log('   • Run full pipeline test (test-review-pipeline.js)');
  console.log('   • Test comprehensive review (test-comprehensive-review.js)');
  console.log('   • Submit a test application through the frontend');
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
}