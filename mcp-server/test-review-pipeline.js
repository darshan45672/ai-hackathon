#!/usr/bin/env node

/**
 * AI Review Pipeline Test
 * Tests the complete review pipeline flow with target audience and business outcome analysis
 * 
 * This simulates the actual AI review process:
 * 1. External Idea Review
 * 2. Internal Idea Review  
 * 3. Categorization
 * 4. Implementation Review (simulated)
 * 5. Target Audience Analysis (simulated)
 * 6. Business Outcome Analysis (simulated)
 * 7. Cost Review
 * 8. Customer Impact Review (simulated)
 */

import dotenv from 'dotenv';
import { ExternalReviewMCPServer } from './index.js';

dotenv.config();

class ReviewPipelineTester {
  constructor() {
    this.server = new ExternalReviewMCPServer();
    this.testResults = {
      external: null,
      internal: null, 
      cost: null,
      targetAudience: null,
      businessOutcome: null
    };
  }

  async runPipelineTest() {
    console.log('🔄 AI Review Pipeline Test Suite');
    console.log('='.repeat(80));
    
    // Test application with comprehensive data for all review types
    const testApplication = {
      title: "SmartLearning AI - Personalized Education Platform",
      description: "An AI-powered educational platform that creates personalized learning paths for students based on their learning style, pace, and knowledge gaps.",
      problemStatement: "Traditional education systems use one-size-fits-all approaches that don't account for individual learning differences, leading to poor outcomes and student disengagement.",
      proposedSolution: "Our AI analyzes student performance data, learning patterns, and preferences to create dynamic, personalized curricula that adapt in real-time to optimize learning outcomes.",
      
      // Target Audience Data
      targetAudience: `
      Primary Audience:
      - K-12 students (ages 6-18) in public and private schools
      - Demographics: Global reach, starting with English-speaking countries
      - Psychographics: Students struggling with traditional learning methods, visual/kinesthetic learners
      
      Secondary Audience:
      - Teachers and educators seeking differentiation tools
      - Parents wanting to support their children's learning at home
      - Homeschooling families needing structured curriculum guidance
      - Educational institutions (schools, districts) looking for academic improvement
      
      Market Segmentation:
      - B2C: Individual families ($9.99/month per student)
      - B2B: Schools and districts ($5-15 per student per month)
      - B2G: Government education initiatives and grants
      
      Market Size:
      - TAM: 1.6 billion students globally
      - SAM: 200 million students in target regions with internet access
      - Initial Target: 100,000 active students within 24 months
      `,
      
      // Business Outcome Data
      businessOutcome: `
      Financial Goals:
      - Year 1: $2M ARR with 200K freemium users, 20K premium subscribers
      - Year 2: $10M ARR expanding to institutional customers
      - Year 3: $30M ARR with international expansion
      - Break-even: Month 18 with 150K paying users
      
      Learning Impact Metrics:
      - Improve student test scores by average 25% within 6 months
      - Increase student engagement metrics by 40%
      - Reduce achievement gaps between different learning styles by 30%
      - Help 90% of struggling students reach grade-level proficiency
      
      Business Performance KPIs:
      - User Acquisition: 50K new students monthly by year 2
      - Retention: 85% annual retention for premium subscribers
      - Conversion: 15% freemium to premium conversion rate
      - NPS Score: >70 from students, teachers, and parents
      
      Operational Outcomes:
      - Build largest personalized learning dataset in education
      - Establish partnerships with 1,000+ schools and districts
      - Create scalable AI infrastructure supporting 1M+ concurrent users
      - Develop market-leading adaptive learning algorithms
      
      Strategic Goals:
      - Become the de facto standard for personalized learning
      - Potential acquisition by major education technology company
      - International expansion to emerging markets
      - Build defensive moat through proprietary learning data and AI models
      `,
      
      techStack: ['Python', 'TensorFlow', 'React', 'Node.js', 'PostgreSQL', 'AWS', 'Kubernetes'],
      teamSize: 8,
      estimatedCost: 1200000,
      currentUserId: "pipeline-test-user"
    };

    console.log(`\n🎯 Testing Application: ${testApplication.title}`);
    console.log(`📊 Team Size: ${testApplication.teamSize} members`);
    console.log(`💰 Estimated Cost: $${testApplication.estimatedCost.toLocaleString()}`);
    
    // Run pipeline tests
    await this.testExternalReview(testApplication);
    await this.testInternalReview(testApplication);
    await this.testCostFeasibility(testApplication);
    await this.simulateTargetAudienceAnalysis(testApplication);
    await this.simulateBusinessOutcomeAnalysis(testApplication);
    
    // Generate pipeline summary
    this.generatePipelineSummary();
  }

  async testExternalReview(application) {
    console.log('\n🌐 Step 1: External Idea Review');
    console.log('-'.repeat(40));
    
    try {
      // Fetch YC companies
      console.log('📥 Fetching Y Combinator companies...');
      const ycResult = await this.server.fetchYCCompanies({});
      const ycData = JSON.parse(ycResult.content[0].text);
      console.log(`✅ Fetched ${ycData.total} Y Combinator companies`);
      
      // Analyze similarity
      console.log('🔍 Analyzing external idea similarity...');
      const analysisResult = await this.server.analyzeIdeaSimilarity({
        userApplication: application,
        externalData: { ycCompanies: ycData.companies.slice(0, 30) }
      });
      
      const analysis = JSON.parse(analysisResult.content[0].text);
      this.testResults.external = analysis;
      
      console.log(`📈 Similarity Score: ${Math.round(analysis.similarityScore * 100)}%`);
      console.log(`🎯 Decision: ${analysis.decision || analysis.recommendation || 'PENDING'}`);
      console.log(`💭 Recommendation: ${analysis.recommendation}`);
      
      if (analysis.mostSimilarCompany) {
        console.log(`🏢 Most Similar: ${analysis.mostSimilarCompany.name} (${Math.round(analysis.mostSimilarCompany.similarity * 100)}%)`);
      }
      
      if (analysis.concerns && analysis.concerns.length > 0) {
        console.log(`⚠️ Concerns: ${analysis.concerns.slice(0, 2).join(', ')}`);
      }
      
    } catch (error) {
      console.log(`❌ External Review Failed: ${error.message}`);
      this.testResults.external = { error: error.message };
    }
  }

  async testInternalReview(application) {
    console.log('\n🏢 Step 2: Internal Idea Review');
    console.log('-'.repeat(40));
    
    try {
      // Fetch internal applications
      console.log('📥 Fetching internal applications...');
      const internalResult = await this.server.fetchInternalApplications({
        excludeUserId: application.currentUserId,
        forSimilarityAnalysis: true
      });
      
      const internalData = JSON.parse(internalResult.content[0].text);
      console.log(`✅ Fetched ${internalData.total} internal applications`);
      
      // Analyze internal similarity
      console.log('🔍 Analyzing internal idea similarity...');
      const analysisResult = await this.server.analyzeInternalIdeaSimilarity({
        userApplication: application,
        internalData: { applications: internalData.applications }
      });
      
      const analysis = JSON.parse(analysisResult.content[0].text);
      this.testResults.internal = analysis;
      
      console.log(`📈 Similarity Score: ${Math.round(analysis.similarityScore * 100)}%`);
      console.log(`🎯 Decision: ${analysis.decision || analysis.recommendation || 'PENDING'}`);
      console.log(`💭 Recommendation: ${analysis.recommendation}`);
      
      if (analysis.similarApplications && analysis.similarApplications.length > 0) {
        console.log(`🔍 Similar Internal Apps: ${analysis.similarApplications.length} found`);
        analysis.similarApplications.slice(0, 2).forEach(app => {
          console.log(`   • ${app.title} (${Math.round(app.similarity * 100)}%)`);
        });
      }
      
    } catch (error) {
      console.log(`❌ Internal Review Failed: ${error.message}`);
      this.testResults.internal = { error: error.message };
    }
  }

  async testCostFeasibility(application) {
    console.log('\n💰 Step 3: Cost Feasibility Review');
    console.log('-'.repeat(40));
    
    try {
      console.log('💵 Analyzing cost feasibility...');
      const analysisResult = await this.server.analyzeCostFeasibility({
        application: application  // Pass as 'application' property
      });
      
      const analysis = JSON.parse(analysisResult.content[0].text);
      this.testResults.cost = analysis;
      
      console.log(`📊 Feasibility Score: ${Math.round((analysis.feasibilityScore || 0) * 100)}%`);
      console.log(`💰 Estimated Cost: $${(analysis.estimatedCost || 0).toLocaleString()}`);
      console.log(`🎯 Decision: ${analysis.decision}`);
      console.log(`💭 Recommendation: ${analysis.recommendation}`);
      
      if (analysis.costBreakdown) {
        console.log('📋 Cost Breakdown:');
        Object.entries(analysis.costBreakdown).forEach(([category, cost]) => {
          if (typeof cost === 'number') {
            console.log(`   • ${category}: $${cost.toLocaleString()}`);
          }
        });
      }
      
    } catch (error) {
      console.log(`❌ Cost Review Failed: ${error.message}`);
      this.testResults.cost = { error: error.message };
    }
  }

  async simulateTargetAudienceAnalysis(application) {
    console.log('\n🎯 Step 4: Target Audience Analysis (Simulated)');
    console.log('-'.repeat(40));
    
    try {
      // Simulate the target audience analysis that would be done by the AI service
      const audienceAnalysis = this.analyzeTargetAudienceText(application.targetAudience);
      this.testResults.targetAudience = audienceAnalysis;
      
      console.log('🔍 Analyzing target audience and market reach...');
      console.log(`📈 Market Clarity Score: ${Math.round(audienceAnalysis.marketClarityScore * 100)}%`);
      console.log(`🎯 Segmentation Score: ${Math.round(audienceAnalysis.segmentationScore * 100)}%`);
      console.log(`📞 Reachability Score: ${Math.round(audienceAnalysis.reachabilityScore * 100)}%`);
      console.log(`📊 Market Size Score: ${Math.round(audienceAnalysis.marketSizeScore * 100)}%`);
      console.log(`🏆 Overall Score: ${Math.round(audienceAnalysis.overallScore * 100)}%`);
      console.log(`🎯 Decision: ${audienceAnalysis.decision}`);
      
      if (audienceAnalysis.strengths.length > 0) {
        console.log(`✅ Strengths: ${audienceAnalysis.strengths.slice(0, 2).join(', ')}`);
      }
      
      if (audienceAnalysis.issues.length > 0) {
        console.log(`⚠️ Issues: ${audienceAnalysis.issues.slice(0, 2).join(', ')}`);
      }
      
    } catch (error) {
      console.log(`❌ Target Audience Analysis Failed: ${error.message}`);
      this.testResults.targetAudience = { error: error.message };
    }
  }

  async simulateBusinessOutcomeAnalysis(application) {
    console.log('\n📈 Step 5: Business Outcome Analysis (Simulated)');
    console.log('-'.repeat(40));
    
    try {
      // Simulate the business outcome analysis that would be done by the AI service
      const outcomeAnalysis = this.analyzeBusinessOutcomeText(application.businessOutcome);
      this.testResults.businessOutcome = outcomeAnalysis;
      
      console.log('🔍 Analyzing business outcomes and viability...');
      console.log(`🎯 Goal Clarity Score: ${Math.round(outcomeAnalysis.goalClarityScore * 100)}%`);
      console.log(`📏 Measurability Score: ${Math.round(outcomeAnalysis.measurabilityScore * 100)}%`);
      console.log(`✅ Achievability Score: ${Math.round(outcomeAnalysis.achievabilityScore * 100)}%`);
      console.log(`💰 Revenue Viability Score: ${Math.round(outcomeAnalysis.revenueViabilityScore * 100)}%`);
      console.log(`🏆 Overall Score: ${Math.round(outcomeAnalysis.overallScore * 100)}%`);
      console.log(`🎯 Decision: ${outcomeAnalysis.decision}`);
      
      if (outcomeAnalysis.strengths.length > 0) {
        console.log(`✅ Strengths: ${outcomeAnalysis.strengths.slice(0, 2).join(', ')}`);
      }
      
      if (outcomeAnalysis.issues.length > 0) {
        console.log(`⚠️ Issues: ${outcomeAnalysis.issues.slice(0, 2).join(', ')}`);
      }
      
    } catch (error) {
      console.log(`❌ Business Outcome Analysis Failed: ${error.message}`);
      this.testResults.businessOutcome = { error: error.message };
    }
  }

  analyzeTargetAudienceText(targetAudience) {
    const text = targetAudience.toLowerCase();
    
    // Simple scoring algorithm based on keywords and structure
    let marketClarityScore = 0;
    let segmentationScore = 0;
    let reachabilityScore = 0;
    let marketSizeScore = 0;
    
    const strengths = [];
    const issues = [];
    
    // Market Clarity Analysis
    const demographicKeywords = ['age', 'years old', 'demographics', 'students', 'families', 'teachers'];
    const hasSpecificDemographics = demographicKeywords.some(keyword => text.includes(keyword));
    if (hasSpecificDemographics) {
      marketClarityScore += 0.4;
      strengths.push('Specific demographic targeting');
    } else {
      issues.push('Needs more specific demographic details');
    }
    
    const geographicKeywords = ['global', 'countries', 'regions', 'international'];
    const hasGeographicScope = geographicKeywords.some(keyword => text.includes(keyword));
    if (hasGeographicScope) {
      marketClarityScore += 0.3;
      strengths.push('Geographic scope defined');
    }
    
    const psychographicKeywords = ['learning style', 'struggling', 'visual', 'kinesthetic'];
    const hasPsychographics = psychographicKeywords.some(keyword => text.includes(keyword));
    if (hasPsychographics) {
      marketClarityScore += 0.3;
      strengths.push('Behavioral characteristics identified');
    }
    
    // Segmentation Analysis
    const segmentKeywords = ['primary', 'secondary', 'b2c', 'b2b', 'b2g'];
    const hasSegmentation = segmentKeywords.some(keyword => text.includes(keyword));
    if (hasSegmentation) {
      segmentationScore += 0.5;
      strengths.push('Multiple audience segments identified');
    } else {
      issues.push('Limited audience segmentation');
    }
    
    const pricingKeywords = ['$', 'per month', 'per student', 'pricing'];
    const hasPricing = pricingKeywords.some(keyword => text.includes(keyword));
    if (hasPricing) {
      segmentationScore += 0.3;
      strengths.push('Pricing strategy by segment');
    }
    
    // Reachability Analysis
    const channelKeywords = ['schools', 'districts', 'institutions', 'families', 'parents'];
    const hasChannels = channelKeywords.some(keyword => text.includes(keyword));
    if (hasChannels) {
      reachabilityScore += 0.4;
      strengths.push('Clear access channels identified');
    } else {
      issues.push('Unclear market access strategy');
    }
    
    const partnershipKeywords = ['partnerships', 'schools', 'government', 'grants'];
    const hasPartnerships = partnershipKeywords.some(keyword => text.includes(keyword));
    if (hasPartnerships) {
      reachabilityScore += 0.4;
      strengths.push('Partnership opportunities identified');
    }
    
    // Market Size Analysis
    const sizeKeywords = ['billion', 'million', 'tam', 'sam', 'target'];
    const hasSizeMetrics = sizeKeywords.some(keyword => text.includes(keyword));
    if (hasSizeMetrics) {
      marketSizeScore += 0.5;
      strengths.push('Market size metrics provided');
    } else {
      issues.push('Market size not quantified');
    }
    
    const targetKeywords = ['100,000', '200k', 'users', 'students', 'months'];
    const hasTargets = targetKeywords.some(keyword => text.includes(keyword));
    if (hasTargets) {
      marketSizeScore += 0.3;
      strengths.push('Specific user targets set');
    }
    
    // Calculate overall score
    const overallScore = (marketClarityScore + segmentationScore + reachabilityScore + marketSizeScore) / 4;
    
    return {
      marketClarityScore: Math.min(1, marketClarityScore),
      segmentationScore: Math.min(1, segmentationScore),
      reachabilityScore: Math.min(1, reachabilityScore),
      marketSizeScore: Math.min(1, marketSizeScore),
      overallScore: Math.min(1, overallScore),
      decision: overallScore >= 0.6 ? 'APPROVED' : 'REJECTED',
      strengths,
      issues
    };
  }

  analyzeBusinessOutcomeText(businessOutcome) {
    const text = businessOutcome.toLowerCase();
    
    let goalClarityScore = 0;
    let measurabilityScore = 0;
    let achievabilityScore = 0;
    let revenueViabilityScore = 0;
    
    const strengths = [];
    const issues = [];
    
    // Goal Clarity Analysis
    const financialKeywords = ['revenue', 'arr', 'million', 'break-even', 'profit'];
    const hasFinancialGoals = financialKeywords.some(keyword => text.includes(keyword));
    if (hasFinancialGoals) {
      goalClarityScore += 0.4;
      strengths.push('Clear financial objectives');
    } else {
      issues.push('Missing financial goals');
    }
    
    const impactKeywords = ['improve', 'increase', 'reduce', 'help', 'achieve'];
    const hasImpactGoals = impactKeywords.some(keyword => text.includes(keyword));
    if (hasImpactGoals) {
      goalClarityScore += 0.3;
      strengths.push('Impact objectives defined');
    }
    
    const operationalKeywords = ['users', 'customers', 'retention', 'conversion'];
    const hasOperationalGoals = operationalKeywords.some(keyword => text.includes(keyword));
    if (hasOperationalGoals) {
      goalClarityScore += 0.3;
      strengths.push('Operational goals specified');
    }
    
    // Measurability Analysis
    const numberPattern = /\d+/;
    const hasNumbers = numberPattern.test(text);
    if (hasNumbers) {
      measurabilityScore += 0.4;
      strengths.push('Quantitative targets included');
    } else {
      issues.push('Lacks specific numerical targets');
    }
    
    const percentPattern = /%|percent/;
    const hasPercentages = percentPattern.test(text);
    if (hasPercentages) {
      measurabilityScore += 0.3;
      strengths.push('Percentage improvements specified');
    }
    
    const timelineKeywords = ['year', 'month', 'within', 'by year'];
    const hasTimeline = timelineKeywords.some(keyword => text.includes(keyword));
    if (hasTimeline) {
      measurabilityScore += 0.3;
      strengths.push('Timeline for outcomes specified');
    }
    
    // Achievability Analysis
    const phaseKeywords = ['year 1', 'year 2', 'year 3', 'phase', 'milestone'];
    const hasPhases = phaseKeywords.some(keyword => text.includes(keyword));
    if (hasPhases) {
      achievabilityScore += 0.4;
      strengths.push('Phased approach to goals');
    } else {
      issues.push('Consider phased milestone approach');
    }
    
    const realisticKeywords = ['gradual', 'progressive', 'scalable', 'sustainable'];
    const hasRealistic = realisticKeywords.some(keyword => text.includes(keyword));
    if (hasRealistic) {
      achievabilityScore += 0.3;
      strengths.push('Realistic growth expectations');
    }
    
    const metricKeywords = ['nps', 'retention', 'conversion', 'kpi'];
    const hasMetrics = metricKeywords.some(keyword => text.includes(keyword));
    if (hasMetrics) {
      achievabilityScore += 0.3;
      strengths.push('Key performance indicators defined');
    }
    
    // Revenue Viability Analysis
    const modelKeywords = ['subscription', 'per month', 'per student', 'pricing', 'b2b', 'b2c'];
    const hasRevenueModel = modelKeywords.some(keyword => text.includes(keyword));
    if (hasRevenueModel) {
      revenueViabilityScore += 0.4;
      strengths.push('Revenue model defined');
    } else {
      issues.push('Revenue model needs clarification');
    }
    
    const marketKeywords = ['market', 'customers', 'demand', 'competition'];
    const hasMarketViability = marketKeywords.some(keyword => text.includes(keyword));
    if (hasMarketViability) {
      revenueViabilityScore += 0.3;
      strengths.push('Market considerations included');
    }
    
    const scalabilityKeywords = ['scale', 'expansion', 'international', 'growth'];
    const hasScalability = scalabilityKeywords.some(keyword => text.includes(keyword));
    if (hasScalability) {
      revenueViabilityScore += 0.3;
      strengths.push('Scalability potential identified');
    }
    
    // Calculate overall score
    const overallScore = (goalClarityScore + measurabilityScore + achievabilityScore + revenueViabilityScore) / 4;
    
    return {
      goalClarityScore: Math.min(1, goalClarityScore),
      measurabilityScore: Math.min(1, measurabilityScore),
      achievabilityScore: Math.min(1, achievabilityScore),
      revenueViabilityScore: Math.min(1, revenueViabilityScore),
      overallScore: Math.min(1, overallScore),
      decision: overallScore >= 0.6 ? 'APPROVED' : 'REJECTED',
      strengths,
      issues
    };
  }

  generatePipelineSummary() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 AI REVIEW PIPELINE SUMMARY');
    console.log('='.repeat(80));
    
    const reviews = [
      { name: 'External Review', result: this.testResults.external, weight: 0.15 },
      { name: 'Internal Review', result: this.testResults.internal, weight: 0.15 },
      { name: 'Target Audience', result: this.testResults.targetAudience, weight: 0.25 },
      { name: 'Business Outcome', result: this.testResults.businessOutcome, weight: 0.25 },
      { name: 'Cost Feasibility', result: this.testResults.cost, weight: 0.20 }
    ];
    
    let totalScore = 0;
    let totalWeight = 0;
    let allPassed = true;
    
    console.log('\n📋 Review Results:');
    reviews.forEach(review => {
      if (review.result && !review.result.error) {
        const score = review.result.similarityScore || review.result.overallScore || review.result.feasibilityScore || 0;
        const decision = review.result.decision || review.result.recommendation || 'PENDING';
        const status = decision === 'APPROVED' || decision === 'ACCEPT' || decision === 'PROCEED' ? '✅' : '❌';
        
        console.log(`   ${status} ${review.name}: ${Math.round(score * 100)}% (${decision})`);
        
        totalScore += score * review.weight;
        totalWeight += review.weight;
        
        if (decision !== 'APPROVED' && decision !== 'ACCEPT' && decision !== 'PROCEED') {
          allPassed = false;
        }
      } else {
        console.log(`   ❌ ${review.name}: ERROR - ${review.result?.error || 'Unknown error'}`);
        allPassed = false;
      }
    });
    
    const weightedScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    const finalDecision = allPassed && weightedScore >= 0.6 ? 'APPROVED' : 'REJECTED';
    
    console.log('\n🏆 Final Results:');
    console.log(`   📊 Weighted Score: ${Math.round(weightedScore * 100)}%`);
    console.log(`   🎯 Final Decision: ${finalDecision}`);
    console.log(`   ⚖️  Status: ${finalDecision === 'APPROVED' ? '✅ PASSED' : '❌ FAILED'} Review Pipeline`);
    
    if (finalDecision === 'APPROVED') {
      console.log('\n🎉 Application would proceed to manual review!');
    } else {
      console.log('\n📝 Application needs improvements before approval.');
    }
    
    console.log('\n💡 Next Steps:');
    if (finalDecision === 'APPROVED') {
      console.log('   • Application ready for human reviewer assignment');
      console.log('   • Notification sent to admin for manual review');
      console.log('   • Applicant notified of progress to next stage');
    } else {
      console.log('   • Detailed feedback provided to applicant');
      console.log('   • Opportunity for revision and resubmission');
      console.log('   • Specific areas for improvement highlighted');
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('🎯 Pipeline Test Complete!');
    console.log('='.repeat(80));
  }
}

// Run the pipeline test
async function main() {
  const tester = new ReviewPipelineTester();
  await tester.runPipelineTest();
}

main().catch(console.error);