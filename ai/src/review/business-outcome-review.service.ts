import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class BusinessOutcomeReviewService {
  private readonly logger = new Logger(BusinessOutcomeReviewService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async reviewBusinessOutcome(applicationId: string): Promise<void> {
    this.logger.log(`Starting business outcome analysis for application ${applicationId}`);

    try {
      const application = await this.databaseService.application.findUnique({
        where: { id: applicationId },
      });

      if (!application) {
        throw new Error(`Application ${applicationId} not found`);
      }

      // Create AI review record
      const aiReview = await this.databaseService.aIReview.create({
        data: {
          applicationId,
          type: 'BUSINESS_OUTCOME_ANALYSIS',
          result: 'PENDING',
        },
      });

      // Analyze business outcomes
      const outcomeAnalysis = await this.analyzeBusinessOutcome(application);
      
      const metadata = {
        ...outcomeAnalysis,
        evaluationCriteria: {
          goalClarity: outcomeAnalysis.goalClarityScore,
          measurability: outcomeAnalysis.measurabilityScore,
          achievability: outcomeAnalysis.achievabilityScore,
          revenueViability: outcomeAnalysis.revenueViabilityScore,
        },
      };

      let feedback = '';
      let result: 'APPROVED' | 'REJECTED' = 'APPROVED';

      if (outcomeAnalysis.overallScore < 0.6) {
        result = 'REJECTED';
        feedback = `Business outcome analysis failed. Overall score: ${Math.round(outcomeAnalysis.overallScore * 100)}%. `;
        feedback += `Issues identified: ${outcomeAnalysis.issues.join(', ')}. `;
        feedback += `Recommendations: ${outcomeAnalysis.recommendations.join('; ')}.`;
      } else {
        feedback = `Business outcome analysis passed. Overall score: ${Math.round(outcomeAnalysis.overallScore * 100)}%. `;
        feedback += `Strengths: ${outcomeAnalysis.strengths.join(', ')}. `;
        if (outcomeAnalysis.recommendations.length > 0) {
          feedback += `Recommendations for improvement: ${outcomeAnalysis.recommendations.join('; ')}.`;
        }
      }

      // Update the AI review with results
      await this.databaseService.aIReview.update({
        where: { id: aiReview.id },
        data: {
          result,
          score: outcomeAnalysis.overallScore,
          feedback,
          metadata,
          processedAt: new Date(),
        },
      });

      this.logger.log(`Business outcome analysis completed for application ${applicationId}: ${result}`);
    } catch (error) {
      this.logger.error(`Error in business outcome analysis for application ${applicationId}:`, error);
      
      // Update AI review with error
      await this.databaseService.aIReview.updateMany({
        where: { 
          applicationId,
          type: 'BUSINESS_OUTCOME_ANALYSIS',
          result: 'PENDING'
        },
        data: {
          result: 'REJECTED',
          errorMessage: error.message,
          processedAt: new Date(),
        },
      });
      
      throw error;
    }
  }

  private async analyzeBusinessOutcome(application: any): Promise<{
    overallScore: number;
    goalClarityScore: number;
    measurabilityScore: number;
    achievabilityScore: number;
    revenueViabilityScore: number;
    strengths: string[];
    issues: string[];
    recommendations: string[];
    analysis: {
      goalClarity: any;
      measurability: any;
      achievability: any;
      revenueViability: any;
    };
  }> {
    const businessOutcome = application.businessOutcome || '';
    const description = application.description || '';
    const solution = application.solution || '';
    const problemStatement = application.problemStatement || '';
    const estimatedCost = application.estimatedCost || 0;

    // Combined text for analysis
    const combinedText = `${businessOutcome} ${description} ${solution} ${problemStatement}`.toLowerCase();

    // 1. Goal Clarity Analysis
    const goalClarityAnalysis = this.analyzeGoalClarity(businessOutcome, combinedText);
    
    // 2. Measurability Analysis
    const measurabilityAnalysis = this.analyzeMeasurability(businessOutcome, combinedText);
    
    // 3. Achievability Analysis
    const achievabilityAnalysis = this.analyzeAchievability(businessOutcome, combinedText, estimatedCost);
    
    // 4. Revenue Viability Analysis
    const revenueViabilityAnalysis = this.analyzeRevenueViability(businessOutcome, combinedText, estimatedCost);

    // Calculate weighted overall score
    const weights = {
      goalClarity: 0.25,
      measurability: 0.25,
      achievability: 0.25,
      revenueViability: 0.25,
    };

    const overallScore = 
      goalClarityAnalysis.score * weights.goalClarity +
      measurabilityAnalysis.score * weights.measurability +
      achievabilityAnalysis.score * weights.achievability +
      revenueViabilityAnalysis.score * weights.revenueViability;

    // Collect strengths and issues
    const strengths = [
      ...goalClarityAnalysis.strengths,
      ...measurabilityAnalysis.strengths,
      ...achievabilityAnalysis.strengths,
      ...revenueViabilityAnalysis.strengths,
    ];

    const issues = [
      ...goalClarityAnalysis.issues,
      ...measurabilityAnalysis.issues,
      ...achievabilityAnalysis.issues,
      ...revenueViabilityAnalysis.issues,
    ];

    const recommendations = [
      ...goalClarityAnalysis.recommendations,
      ...measurabilityAnalysis.recommendations,
      ...achievabilityAnalysis.recommendations,
      ...revenueViabilityAnalysis.recommendations,
    ];

    return {
      overallScore,
      goalClarityScore: goalClarityAnalysis.score,
      measurabilityScore: measurabilityAnalysis.score,
      achievabilityScore: achievabilityAnalysis.score,
      revenueViabilityScore: revenueViabilityAnalysis.score,
      strengths,
      issues,
      recommendations,
      analysis: {
        goalClarity: goalClarityAnalysis,
        measurability: measurabilityAnalysis,
        achievability: achievabilityAnalysis,
        revenueViability: revenueViabilityAnalysis,
      },
    };
  }

  private analyzeGoalClarity(businessOutcome: string, combinedText: string): {
    score: number;
    strengths: string[];
    issues: string[];
    recommendations: string[];
    details: any;
  } {
    const strengths: string[] = [];
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 0;

    // Check for specific business objectives
    const objectiveIndicators = [
      'increase revenue', 'reduce costs', 'improve efficiency', 'grow market share',
      'expand market', 'launch product', 'scale business', 'optimize processes',
      'enhance customer satisfaction', 'improve productivity', 'reduce time',
      'automate', 'streamline', 'accelerate growth'
    ];

    const hasSpecificObjectives = objectiveIndicators.some(indicator => 
      combinedText.includes(indicator.toLowerCase())
    );

    if (hasSpecificObjectives) {
      score += 0.3;
      strengths.push('Clear business objectives identified');
    } else {
      issues.push('Lacks specific business objectives');
      recommendations.push('Define clear and specific business goals');
    }

    // Check for financial outcomes
    const financialIndicators = [
      'revenue', 'profit', 'income', 'sales', 'roi', 'return on investment',
      'cost savings', 'margin', 'profitability', 'monetization', 'pricing',
      '$', 'dollars', 'money', 'financial', 'budget', 'funding'
    ];

    const hasFinancialGoals = financialIndicators.some(indicator => 
      combinedText.includes(indicator.toLowerCase())
    );

    if (hasFinancialGoals) {
      score += 0.25;
      strengths.push('Financial outcomes specified');
    } else {
      issues.push('No clear financial outcomes defined');
      recommendations.push('Include specific financial goals and expectations');
    }

    // Check for operational outcomes
    const operationalIndicators = [
      'efficiency', 'productivity', 'speed', 'quality', 'performance',
      'optimization', 'automation', 'simplification', 'scalability',
      'reliability', 'accuracy', 'consistency'
    ];

    const hasOperationalGoals = operationalIndicators.some(indicator => 
      combinedText.includes(indicator.toLowerCase())
    );

    if (hasOperationalGoals) {
      score += 0.2;
      strengths.push('Operational improvements identified');
    } else {
      recommendations.push('Consider operational efficiency goals');
    }

    // Check for customer/market outcomes
    const customerIndicators = [
      'customer satisfaction', 'user experience', 'customer retention',
      'customer acquisition', 'market penetration', 'brand awareness',
      'user engagement', 'customer loyalty', 'market reach'
    ];

    const hasCustomerGoals = customerIndicators.some(indicator => 
      combinedText.includes(indicator.toLowerCase())
    );

    if (hasCustomerGoals) {
      score += 0.25;
      strengths.push('Customer and market outcomes defined');
    } else {
      recommendations.push('Include customer impact and market goals');
    }

    // Business outcome detail analysis
    const outcomeLength = businessOutcome.trim().length;
    if (outcomeLength > 100) {
      strengths.push('Detailed business outcome description provided');
    } else if (outcomeLength > 50) {
      score -= 0.1;
      recommendations.push('Consider providing more detailed business outcome description');
    } else {
      score -= 0.2;
      issues.push('Business outcome description is too brief');
      recommendations.push('Provide comprehensive business outcome description');
    }

    return {
      score: Math.max(0, Math.min(1, score)),
      strengths,
      issues,
      recommendations,
      details: {
        hasSpecificObjectives,
        hasFinancialGoals,
        hasOperationalGoals,
        hasCustomerGoals,
        outcomeDescriptionLength: outcomeLength,
      }
    };
  }

  private analyzeMeasurability(businessOutcome: string, combinedText: string): {
    score: number;
    strengths: string[];
    issues: string[];
    recommendations: string[];
    details: any;
  } {
    const strengths: string[] = [];
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 0;

    // Check for quantitative metrics
    const quantitativeIndicators = [
      '%', 'percent', 'percentage', 'increase by', 'reduce by', 'improve by',
      'x times', 'fold', 'double', 'triple', 'half', 'quarter',
      'metric', 'kpi', 'measure', 'track', 'monitor', 'analyze'
    ];

    const hasQuantitativeMetrics = quantitativeIndicators.some(indicator => 
      businessOutcome.toLowerCase().includes(indicator)
    );

    if (hasQuantitativeMetrics) {
      score += 0.3;
      strengths.push('Quantitative metrics and targets specified');
    } else {
      issues.push('Lacks quantitative success metrics');
      recommendations.push('Define specific, measurable targets (e.g., % increase, $ amount)');
    }

    // Check for specific numbers
    const numberPattern = /\d+/;
    const hasSpecificNumbers = numberPattern.test(businessOutcome);

    if (hasSpecificNumbers) {
      score += 0.25;
      strengths.push('Specific numerical targets included');
    } else {
      issues.push('No specific numerical targets provided');
      recommendations.push('Include specific numbers for target outcomes');
    }

    // Check for timeline/timeframe
    const timelineIndicators = [
      'month', 'year', 'quarter', 'week', 'day', 'timeline', 'timeframe',
      'by', 'within', 'after', 'during', 'in', 'short-term', 'long-term',
      'immediate', 'gradual', 'phase'
    ];

    const hasTimeline = timelineIndicators.some(indicator => 
      businessOutcome.toLowerCase().includes(indicator)
    );

    if (hasTimeline) {
      score += 0.2;
      strengths.push('Timeline for outcomes specified');
    } else {
      issues.push('No timeline for achieving outcomes');
      recommendations.push('Specify timeframes for achieving business outcomes');
    }

    // Check for success criteria
    const successCriteriaIndicators = [
      'success', 'achieve', 'reach', 'attain', 'goal', 'target',
      'benchmark', 'milestone', 'criteria', 'indicator', 'result'
    ];

    const hasSuccessCriteria = successCriteriaIndicators.some(indicator => 
      businessOutcome.toLowerCase().includes(indicator)
    );

    if (hasSuccessCriteria) {
      score += 0.25;
      strengths.push('Success criteria and milestones defined');
    } else {
      recommendations.push('Define clear success criteria and milestones');
    }

    return {
      score: Math.max(0, Math.min(1, score)),
      strengths,
      issues,
      recommendations,
      details: {
        hasQuantitativeMetrics,
        hasSpecificNumbers,
        hasTimeline,
        hasSuccessCriteria,
      }
    };
  }

  private analyzeAchievability(businessOutcome: string, combinedText: string, estimatedCost: number): {
    score: number;
    strengths: string[];
    issues: string[];
    recommendations: string[];
    details: any;
  } {
    const strengths: string[] = [];
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 0;

    // Check for realistic scope
    const realisticIndicators = [
      'realistic', 'achievable', 'feasible', 'practical', 'reasonable',
      'incremental', 'gradual', 'step by step', 'phase', 'pilot'
    ];

    const hasRealisticScope = realisticIndicators.some(indicator => 
      combinedText.includes(indicator.toLowerCase())
    );

    if (hasRealisticScope) {
      score += 0.25;
      strengths.push('Realistic and achievable scope indicated');
    } else {
      recommendations.push('Ensure goals are realistic and achievable');
    }

    // Check for resource consideration
    const resourceIndicators = [
      'team', 'resources', 'budget', 'funding', 'investment', 'cost',
      'staff', 'expertise', 'skill', 'experience', 'capability',
      'infrastructure', 'technology', 'tools'
    ];

    const hasResourceConsideration = resourceIndicators.some(indicator => 
      combinedText.includes(indicator.toLowerCase())
    );

    if (hasResourceConsideration) {
      score += 0.25;
      strengths.push('Resource requirements considered');
    } else {
      issues.push('Limited consideration of required resources');
      recommendations.push('Assess required resources for achieving outcomes');
    }

    // Check for risk awareness
    const riskIndicators = [
      'risk', 'challenge', 'obstacle', 'barrier', 'difficulty',
      'constraint', 'limitation', 'assumption', 'dependency'
    ];

    const hasRiskAwareness = riskIndicators.some(indicator => 
      combinedText.includes(indicator.toLowerCase())
    );

    if (hasRiskAwareness) {
      score += 0.2;
      strengths.push('Risk awareness and challenges identified');
    } else {
      recommendations.push('Identify potential risks and challenges');
    }

    // Check for phased approach
    const phasedIndicators = [
      'phase', 'stage', 'step', 'milestone', 'iteration', 'version',
      'mvp', 'minimum viable', 'first', 'initial', 'pilot', 'prototype'
    ];

    const hasPhasedApproach = phasedIndicators.some(indicator => 
      combinedText.includes(indicator.toLowerCase())
    );

    if (hasPhasedApproach) {
      score += 0.3;
      strengths.push('Phased implementation approach indicated');
    } else {
      recommendations.push('Consider breaking down outcomes into achievable phases');
    }

    // Estimate cost-outcome ratio reasonableness
    if (estimatedCost > 0) {
      // Basic heuristic: very high costs might indicate overly ambitious goals
      if (estimatedCost > 1000000) { // Over $1M
        score -= 0.1;
        issues.push('High cost estimate may indicate overly ambitious goals');
        recommendations.push('Consider if outcomes justify the high investment');
      } else if (estimatedCost < 10000) { // Under $10K
        score += 0.1;
        strengths.push('Cost-effective approach to achieving outcomes');
      }
    }

    return {
      score: Math.max(0, Math.min(1, score)),
      strengths,
      issues,
      recommendations,
      details: {
        hasRealisticScope,
        hasResourceConsideration,
        hasRiskAwareness,
        hasPhasedApproach,
        estimatedCost,
      }
    };
  }

  private analyzeRevenueViability(businessOutcome: string, combinedText: string, estimatedCost: number): {
    score: number;
    strengths: string[];
    issues: string[];
    recommendations: string[];
    details: any;
  } {
    const strengths: string[] = [];
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 0;

    // Check for revenue model clarity
    const revenueModelIndicators = [
      'subscription', 'saas', 'recurring revenue', 'monthly recurring',
      'pricing', 'monetization', 'revenue model', 'business model',
      'freemium', 'pay per use', 'licensing', 'commission', 'advertising'
    ];

    const hasRevenueModel = revenueModelIndicators.some(indicator => 
      combinedText.includes(indicator.toLowerCase())
    );

    if (hasRevenueModel) {
      score += 0.3;
      strengths.push('Revenue model and monetization strategy indicated');
    } else {
      issues.push('Unclear revenue model or monetization strategy');
      recommendations.push('Define clear revenue model and pricing strategy');
    }

    // Check for market demand indicators
    const demandIndicators = [
      'demand', 'need', 'want', 'pain point', 'problem', 'market opportunity',
      'willing to pay', 'customer need', 'market gap', 'underserved'
    ];

    const hasMarketDemand = demandIndicators.some(indicator => 
      combinedText.includes(indicator.toLowerCase())
    );

    if (hasMarketDemand) {
      score += 0.25;
      strengths.push('Market demand and customer need identified');
    } else {
      issues.push('Limited evidence of market demand');
      recommendations.push('Validate market demand and customer willingness to pay');
    }

    // Check for competitive advantage
    const competitiveIndicators = [
      'unique', 'differentiation', 'competitive advantage', 'edge',
      'better than', 'faster than', 'cheaper than', 'innovation',
      'proprietary', 'patent', 'first mover', 'exclusive'
    ];

    const hasCompetitiveAdvantage = competitiveIndicators.some(indicator => 
      combinedText.includes(indicator.toLowerCase())
    );

    if (hasCompetitiveAdvantage) {
      score += 0.2;
      strengths.push('Competitive advantage and differentiation identified');
    } else {
      recommendations.push('Identify and articulate competitive advantages');
    }

    // Check for scalability potential
    const scalabilityIndicators = [
      'scale', 'scalable', 'growth', 'expand', 'viral', 'network effect',
      'platform', 'ecosystem', 'automation', 'leverage', 'multiply'
    ];

    const hasScalabilityPotential = scalabilityIndicators.some(indicator => 
      combinedText.includes(indicator.toLowerCase())
    );

    if (hasScalabilityPotential) {
      score += 0.25;
      strengths.push('Scalability potential for revenue growth');
    } else {
      recommendations.push('Consider scalability potential for long-term revenue growth');
    }

    // Check ROI considerations
    if (estimatedCost > 0) {
      // Look for ROI/payback indicators
      const roiIndicators = [
        'roi', 'return on investment', 'payback', 'break even', 'profit',
        'margin', 'value', 'benefit', 'worth', 'justify'
      ];

      const hasROIConsideration = roiIndicators.some(indicator => 
        combinedText.includes(indicator.toLowerCase())
      );

      if (hasROIConsideration) {
        score += 0.1;
        strengths.push('ROI and value justification considered');
      } else {
        recommendations.push('Calculate expected ROI and payback period');
      }
    }

    return {
      score: Math.max(0, Math.min(1, score)),
      strengths,
      issues,
      recommendations,
      details: {
        hasRevenueModel,
        hasMarketDemand,
        hasCompetitiveAdvantage,
        hasScalabilityPotential,
        estimatedCost,
      }
    };
  }
}