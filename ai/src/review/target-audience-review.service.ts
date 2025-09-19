import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class TargetAudienceReviewService {
  private readonly logger = new Logger(TargetAudienceReviewService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async reviewTargetAudience(applicationId: string): Promise<void> {
    this.logger.log(`Starting target audience analysis for application ${applicationId}`);

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
          type: 'TARGET_AUDIENCE_ANALYSIS',
          result: 'PENDING',
        },
      });

      // Analyze target audience
      const audienceAnalysis = await this.analyzeTargetAudience(application);
      
      const metadata = {
        ...audienceAnalysis,
        evaluationCriteria: {
          marketClarity: audienceAnalysis.marketClarityScore,
          segmentation: audienceAnalysis.segmentationScore,
          reachability: audienceAnalysis.reachabilityScore,
          sizeAndPotential: audienceAnalysis.marketSizeScore,
        },
      };

      let feedback = '';
      let result: 'APPROVED' | 'REJECTED' = 'APPROVED';

      if (audienceAnalysis.overallScore < 0.6) {
        result = 'REJECTED';
        feedback = `Target audience analysis failed. Overall score: ${Math.round(audienceAnalysis.overallScore * 100)}%. `;
        feedback += `Issues identified: ${audienceAnalysis.issues.join(', ')}. `;
        feedback += `Recommendations: ${audienceAnalysis.recommendations.join('; ')}.`;
      } else {
        feedback = `Target audience analysis passed. Overall score: ${Math.round(audienceAnalysis.overallScore * 100)}%. `;
        feedback += `Strengths: ${audienceAnalysis.strengths.join(', ')}. `;
        if (audienceAnalysis.recommendations.length > 0) {
          feedback += `Recommendations for improvement: ${audienceAnalysis.recommendations.join('; ')}.`;
        }
      }

      // Update the AI review with results
      await this.databaseService.aIReview.update({
        where: { id: aiReview.id },
        data: {
          result,
          score: audienceAnalysis.overallScore,
          feedback,
          metadata,
          processedAt: new Date(),
        },
      });

      this.logger.log(`Target audience analysis completed for application ${applicationId}: ${result}`);
    } catch (error) {
      this.logger.error(`Error in target audience analysis for application ${applicationId}:`, error);
      
      // Update AI review with error
      await this.databaseService.aIReview.updateMany({
        where: { 
          applicationId,
          type: 'TARGET_AUDIENCE_ANALYSIS',
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

  private async analyzeTargetAudience(application: any): Promise<{
    overallScore: number;
    marketClarityScore: number;
    segmentationScore: number;
    reachabilityScore: number;
    marketSizeScore: number;
    strengths: string[];
    issues: string[];
    recommendations: string[];
    analysis: {
      marketClarity: any;
      segmentation: any;
      reachability: any;
      marketSize: any;
    };
  }> {
    const targetAudience = application.targetAudience || '';
    const description = application.description || '';
    const solution = application.solution || '';
    const problemStatement = application.problemStatement || '';

    // Combined text for analysis
    const combinedText = `${targetAudience} ${description} ${solution} ${problemStatement}`.toLowerCase();

    // 1. Market Clarity Analysis
    const marketClarityAnalysis = this.analyzeMarketClarity(targetAudience, combinedText);
    
    // 2. Audience Segmentation Analysis
    const segmentationAnalysis = this.analyzeAudienceSegmentation(targetAudience, combinedText);
    
    // 3. Reachability Analysis
    const reachabilityAnalysis = this.analyzeMarketReachability(targetAudience, combinedText);
    
    // 4. Market Size and Potential Analysis
    const marketSizeAnalysis = this.analyzeMarketSizeAndPotential(targetAudience, combinedText);

    // Calculate weighted overall score
    const weights = {
      marketClarity: 0.25,
      segmentation: 0.25,
      reachability: 0.3,
      marketSize: 0.2,
    };

    const overallScore = 
      marketClarityAnalysis.score * weights.marketClarity +
      segmentationAnalysis.score * weights.segmentation +
      reachabilityAnalysis.score * weights.reachability +
      marketSizeAnalysis.score * weights.marketSize;

    // Collect strengths and issues
    const strengths = [
      ...marketClarityAnalysis.strengths,
      ...segmentationAnalysis.strengths,
      ...reachabilityAnalysis.strengths,
      ...marketSizeAnalysis.strengths,
    ];

    const issues = [
      ...marketClarityAnalysis.issues,
      ...segmentationAnalysis.issues,
      ...reachabilityAnalysis.issues,
      ...marketSizeAnalysis.issues,
    ];

    const recommendations = [
      ...marketClarityAnalysis.recommendations,
      ...segmentationAnalysis.recommendations,
      ...reachabilityAnalysis.recommendations,
      ...marketSizeAnalysis.recommendations,
    ];

    return {
      overallScore,
      marketClarityScore: marketClarityAnalysis.score,
      segmentationScore: segmentationAnalysis.score,
      reachabilityScore: reachabilityAnalysis.score,
      marketSizeScore: marketSizeAnalysis.score,
      strengths,
      issues,
      recommendations,
      analysis: {
        marketClarity: marketClarityAnalysis,
        segmentation: segmentationAnalysis,
        reachability: reachabilityAnalysis,
        marketSize: marketSizeAnalysis,
      },
    };
  }

  private analyzeMarketClarity(targetAudience: string, combinedText: string): {
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

    // Check for specific demographic indicators
    const demographicIndicators = [
      'age', 'years old', 'generation', 'millennials', 'gen z', 'baby boomers',
      'professionals', 'students', 'entrepreneurs', 'businesses', 'companies',
      'small business', 'enterprise', 'startups', 'developers', 'designers',
      'marketers', 'managers', 'executives', 'consumers', 'users'
    ];

    const hasSpecificDemographics = demographicIndicators.some(indicator => 
      combinedText.includes(indicator.toLowerCase())
    );

    if (hasSpecificDemographics) {
      score += 0.3;
      strengths.push('Specific demographic targeting identified');
    } else {
      issues.push('Lacks specific demographic targeting');
      recommendations.push('Define specific age groups, professions, or user types');
    }

    // Check for geographic specificity
    const geographicIndicators = [
      'local', 'global', 'nationwide', 'international', 'urban', 'rural',
      'city', 'country', 'region', 'north america', 'europe', 'asia',
      'united states', 'canada', 'uk', 'australia'
    ];

    const hasGeographicClarity = geographicIndicators.some(indicator => 
      combinedText.includes(indicator.toLowerCase())
    );

    if (hasGeographicClarity) {
      score += 0.2;
      strengths.push('Geographic market scope defined');
    } else {
      issues.push('Unclear geographic market scope');
      recommendations.push('Specify target geographic regions or markets');
    }

    // Check for behavioral/psychographic indicators
    const behavioralIndicators = [
      'tech-savvy', 'early adopters', 'price-sensitive', 'quality-focused',
      'convenience-seeking', 'environmentally conscious', 'health-conscious',
      'budget-conscious', 'premium users', 'frequent users', 'occasional users'
    ];

    const hasBehavioralInsights = behavioralIndicators.some(indicator => 
      combinedText.includes(indicator.toLowerCase())
    );

    if (hasBehavioralInsights) {
      score += 0.25;
      strengths.push('Behavioral characteristics identified');
    } else {
      issues.push('Limited behavioral insights about target audience');
      recommendations.push('Include behavioral and psychographic characteristics');
    }

    // Check for pain point alignment
    const painPointIndicators = [
      'problem', 'challenge', 'frustration', 'difficulty', 'pain point',
      'struggle', 'issue', 'barrier', 'obstacle', 'need', 'want', 'desire'
    ];

    const hasPainPointAlignment = painPointIndicators.some(indicator => 
      combinedText.includes(indicator.toLowerCase())
    );

    if (hasPainPointAlignment) {
      score += 0.25;
      strengths.push('Clear alignment with audience pain points');
    } else {
      issues.push('Unclear how solution addresses audience pain points');
      recommendations.push('Better articulate audience pain points and solution fit');
    }

    // Target audience detail analysis
    const audienceLength = targetAudience.trim().length;
    if (audienceLength > 100) {
      strengths.push('Detailed target audience description provided');
    } else if (audienceLength > 50) {
      score -= 0.1;
      recommendations.push('Consider providing more detailed audience description');
    } else {
      score -= 0.2;
      issues.push('Target audience description is too brief');
      recommendations.push('Provide comprehensive target audience description');
    }

    return {
      score: Math.max(0, Math.min(1, score)),
      strengths,
      issues,
      recommendations,
      details: {
        hasSpecificDemographics,
        hasGeographicClarity,
        hasBehavioralInsights,
        hasPainPointAlignment,
        audienceDescriptionLength: audienceLength,
      }
    };
  }

  private analyzeAudienceSegmentation(targetAudience: string, combinedText: string): {
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

    // Check for multiple segment identification
    const segmentIndicators = [
      'primary', 'secondary', 'segment', 'group', 'type', 'category',
      'both', 'also', 'additionally', 'including', 'ranging from'
    ];

    const hasMultipleSegments = segmentIndicators.some(indicator => 
      targetAudience.toLowerCase().includes(indicator)
    );

    if (hasMultipleSegments) {
      score += 0.3;
      strengths.push('Multiple audience segments identified');
    } else {
      score -= 0.1;
      recommendations.push('Consider identifying primary and secondary target segments');
    }

    // Check for B2B vs B2C clarity
    const b2bIndicators = ['business', 'company', 'enterprise', 'organization', 'corporate'];
    const b2cIndicators = ['consumer', 'individual', 'personal', 'household', 'people'];

    const isB2B = b2bIndicators.some(indicator => combinedText.includes(indicator));
    const isB2C = b2cIndicators.some(indicator => combinedText.includes(indicator));

    if (isB2B || isB2C) {
      score += 0.2;
      strengths.push(isB2B ? 'Clear B2B market focus' : 'Clear B2C market focus');
    } else {
      issues.push('Unclear whether targeting B2B or B2C market');
      recommendations.push('Clarify if targeting businesses or consumers');
    }

    // Check for segment prioritization
    const prioritizationIndicators = [
      'primarily', 'mainly', 'focus on', 'target', 'key audience',
      'most important', 'priority', 'first', 'initial'
    ];

    const hasPrioritization = prioritizationIndicators.some(indicator => 
      targetAudience.toLowerCase().includes(indicator)
    );

    if (hasPrioritization) {
      score += 0.25;
      strengths.push('Clear segment prioritization identified');
    } else {
      recommendations.push('Prioritize target segments for focused market entry');
    }

    // Check for segment size estimation
    const sizeIndicators = [
      'large', 'small', 'medium', 'niche', 'broad', 'narrow',
      'millions', 'thousands', 'hundreds', 'market size', 'population'
    ];

    const hasSegmentSizing = sizeIndicators.some(indicator => 
      combinedText.includes(indicator.toLowerCase())
    );

    if (hasSegmentSizing) {
      score += 0.25;
      strengths.push('Segment size considerations mentioned');
    } else {
      recommendations.push('Estimate size of target market segments');
    }

    return {
      score: Math.max(0, Math.min(1, score)),
      strengths,
      issues,
      recommendations,
      details: {
        hasMultipleSegments,
        isB2B,
        isB2C,
        hasPrioritization,
        hasSegmentSizing,
      }
    };
  }

  private analyzeMarketReachability(targetAudience: string, combinedText: string): {
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

    // Check for digital reachability
    const digitalChannels = [
      'social media', 'facebook', 'instagram', 'twitter', 'linkedin', 'tiktok',
      'google', 'search', 'online', 'digital', 'website', 'app', 'mobile',
      'email', 'content marketing', 'seo', 'paid ads', 'influencer'
    ];

    const hasDigitalStrategy = digitalChannels.some(channel => 
      combinedText.includes(channel.toLowerCase())
    );

    if (hasDigitalStrategy) {
      score += 0.3;
      strengths.push('Digital reach channels identified');
    } else {
      issues.push('No clear digital reach strategy');
      recommendations.push('Define digital marketing and reach channels');
    }

    // Check for existing community/network access
    const communityIndicators = [
      'community', 'network', 'existing users', 'current customers',
      'partners', 'ecosystem', 'platform', 'marketplace', 'forum'
    ];

    const hasExistingAccess = communityIndicators.some(indicator => 
      combinedText.includes(indicator.toLowerCase())
    );

    if (hasExistingAccess) {
      score += 0.25;
      strengths.push('Existing community or network access identified');
    } else {
      recommendations.push('Identify existing communities or networks for audience access');
    }

    // Check for partnership/collaboration potential
    const partnershipIndicators = [
      'partnership', 'collaborate', 'integrate', 'work with', 'team up',
      'alliance', 'channel', 'distributor', 'reseller', 'affiliate'
    ];

    const hasPartnershipPotential = partnershipIndicators.some(indicator => 
      combinedText.includes(indicator.toLowerCase())
    );

    if (hasPartnershipPotential) {
      score += 0.2;
      strengths.push('Partnership opportunities for reach identified');
    } else {
      recommendations.push('Consider partnership channels for audience reach');
    }

    // Check for content/value proposition clarity for outreach
    const valueIndicators = [
      'benefit', 'value', 'advantage', 'solve', 'improve', 'save',
      'increase', 'reduce', 'optimize', 'streamline', 'enhance'
    ];

    const hasValueClarity = valueIndicators.some(indicator => 
      combinedText.includes(indicator.toLowerCase())
    );

    if (hasValueClarity) {
      score += 0.25;
      strengths.push('Clear value proposition for audience outreach');
    } else {
      issues.push('Unclear value proposition for audience acquisition');
      recommendations.push('Clarify unique value proposition for marketing messages');
    }

    return {
      score: Math.max(0, Math.min(1, score)),
      strengths,
      issues,
      recommendations,
      details: {
        hasDigitalStrategy,
        hasExistingAccess,
        hasPartnershipPotential,
        hasValueClarity,
      }
    };
  }

  private analyzeMarketSizeAndPotential(targetAudience: string, combinedText: string): {
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

    // Check for market size indicators
    const sizeIndicators = [
      'billion', 'million', 'thousand', 'large market', 'growing market',
      'market size', 'addressable market', 'total addressable market', 'tam',
      'serviceable addressable market', 'sam', 'serviceable obtainable market', 'som'
    ];

    const hasSizeMetrics = sizeIndicators.some(indicator => 
      combinedText.includes(indicator.toLowerCase())
    );

    if (hasSizeMetrics) {
      score += 0.3;
      strengths.push('Market size metrics or indicators mentioned');
    } else {
      issues.push('No market size estimation provided');
      recommendations.push('Research and include total addressable market (TAM) estimates');
    }

    // Check for growth potential indicators
    const growthIndicators = [
      'growing', 'expanding', 'increasing', 'trend', 'emerging',
      'adoption', 'demand', 'popularity', 'uptake', 'penetration'
    ];

    const hasGrowthPotential = growthIndicators.some(indicator => 
      combinedText.includes(indicator.toLowerCase())
    );

    if (hasGrowthPotential) {
      score += 0.25;
      strengths.push('Market growth potential indicated');
    } else {
      recommendations.push('Assess market growth trends and potential');
    }

    // Check for competitive landscape awareness
    const competitiveIndicators = [
      'competitor', 'competition', 'existing solution', 'alternative',
      'market leader', 'incumbent', 'differentiation', 'unique'
    ];

    const hasCompetitiveAwareness = competitiveIndicators.some(indicator => 
      combinedText.includes(indicator.toLowerCase())
    );

    if (hasCompetitiveAwareness) {
      score += 0.2;
      strengths.push('Competitive landscape awareness demonstrated');
    } else {
      issues.push('Limited competitive analysis');
      recommendations.push('Analyze competitive landscape and market positioning');
    }

    // Check for scalability indicators
    const scalabilityIndicators = [
      'scale', 'scalable', 'expand', 'global', 'international',
      'multiple markets', 'additional segments', 'growth'
    ];

    const hasScalabilityVision = scalabilityIndicators.some(indicator => 
      combinedText.includes(indicator.toLowerCase())
    );

    if (hasScalabilityVision) {
      score += 0.25;
      strengths.push('Scalability vision and potential identified');
    } else {
      recommendations.push('Consider scalability potential and expansion opportunities');
    }

    return {
      score: Math.max(0, Math.min(1, score)),
      strengths,
      issues,
      recommendations,
      details: {
        hasSizeMetrics,
        hasGrowthPotential,
        hasCompetitiveAwareness,
        hasScalabilityVision,
      }
    };
  }
}