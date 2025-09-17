import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class ImplementationReviewService {
  private readonly logger = new Logger(ImplementationReviewService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async reviewImplementationFeasibility(applicationId: string): Promise<void> {
    this.logger.log(`Starting implementation feasibility review for application ${applicationId}`);

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
          type: 'IMPLEMENTATION_FEASIBILITY',
          result: 'PENDING',
        },
      });

      // Analyze implementation feasibility
      const feasibilityAnalysis = await this.analyzeFeasibility(application);
      
      const metadata = {
        ...feasibilityAnalysis,
        evaluationCriteria: {
          technicalComplexity: feasibilityAnalysis.technicalComplexityScore,
          teamCapability: feasibilityAnalysis.teamCapabilityScore,
          timeframe: feasibilityAnalysis.timeframeScore,
          resourceRequirements: feasibilityAnalysis.resourceScore,
        },
      };

      let feedback = '';
      let result: 'APPROVED' | 'REJECTED' = 'APPROVED';

      if (feasibilityAnalysis.overallScore < 0.6) {
        result = 'REJECTED';
        feedback = `Implementation feasibility assessment failed. Overall score: ${Math.round(feasibilityAnalysis.overallScore * 100)}%. `;
        feedback += `Issues identified: ${feasibilityAnalysis.issues.join(', ')}. `;
        feedback += feasibilityAnalysis.recommendation;
      } else {
        feedback = `Implementation is feasible. Overall score: ${Math.round(feasibilityAnalysis.overallScore * 100)}%. `;
        feedback += feasibilityAnalysis.recommendation;
      }

      // Update AI review
      await this.databaseService.aIReview.update({
        where: { id: aiReview.id },
        data: {
          result,
          feedback,
          metadata: JSON.parse(JSON.stringify(metadata)),
          processedAt: new Date(),
          score: feasibilityAnalysis.overallScore,
        },
      });

      if (result === 'REJECTED') {
        await this.databaseService.application.update({
          where: { id: applicationId },
          data: {
            status: 'REJECTED',
            rejectionReason: feedback,
          },
        });
      } else {
        await this.databaseService.application.update({
          where: { id: applicationId },
          data: {
            status: 'COST_REVIEW',
          },
        });
      }

      this.logger.log(`Implementation feasibility review completed for application ${applicationId}: ${result}`);
    } catch (error) {
      this.logger.error(`Error in implementation feasibility review for application ${applicationId}:`, error);
      
      await this.databaseService.aIReview.updateMany({
        where: { 
          applicationId,
          type: 'IMPLEMENTATION_FEASIBILITY',
        },
        data: {
          result: 'REJECTED',
          errorMessage: error.message,
          processedAt: new Date(),
        },
      });
    }
  }

  private async analyzeFeasibility(application: any): Promise<any> {
    // Analyze technical complexity
    const technicalComplexityScore = this.analyzeTechnicalComplexity(application);
    
    // Analyze team capability
    const teamCapabilityScore = this.analyzeTeamCapability(application);
    
    // Analyze timeframe feasibility
    const timeframeScore = this.analyzeTimeframe(application);
    
    // Analyze resource requirements
    const resourceScore = this.analyzeResourceRequirements(application);
    
    // NEW: Analyze implementation approach if provided
    const implementationScore = this.analyzeImplementationApproach(application);
    
    // Calculate overall score (weighted average with implementation approach)
    const weights = application.implementation ? 
      { technical: 0.25, team: 0.2, timeframe: 0.2, resource: 0.15, implementation: 0.2 } :
      { technical: 0.3, team: 0.25, timeframe: 0.25, resource: 0.2, implementation: 0 };
    
    const overallScore = (
      technicalComplexityScore * weights.technical +
      teamCapabilityScore * weights.team +
      timeframeScore * weights.timeframe +
      resourceScore * weights.resource +
      implementationScore * weights.implementation
    );

    // Identify issues
    const issues: string[] = [];
    if (technicalComplexityScore < 0.6) issues.push('High technical complexity');
    if (teamCapabilityScore < 0.6) issues.push('Insufficient team size/capability');
    if (timeframeScore < 0.6) issues.push('Unrealistic timeframe');
    if (resourceScore < 0.6) issues.push('Insufficient resources');
    if (application.implementation && implementationScore < 0.6) {
      issues.push('Implementation approach has significant gaps or concerns');
    }

    // Generate recommendation
    let recommendation = '';
    if (overallScore >= 0.8) {
      recommendation = 'Highly feasible project with good chances of success.';
      if (application.implementation && implementationScore >= 0.8) {
        recommendation += ' The implementation approach is well-thought-out and detailed.';
      }
    } else if (overallScore >= 0.6) {
      recommendation = 'Feasible project but requires careful planning and execution.';
      if (application.implementation && implementationScore < 0.7) {
        recommendation += ' Consider refining the implementation approach for better clarity.';
      }
    } else {
      recommendation = 'Project faces significant implementation challenges and may not be feasible within current constraints.';
      if (application.implementation && implementationScore < 0.5) {
        recommendation += ' The current implementation approach needs substantial improvement.';
      }
    }

    return {
      technicalComplexityScore,
      teamCapabilityScore,
      timeframeScore,
      resourceScore,
      implementationScore,
      overallScore,
      issues,
      recommendation,
      detailedAnalysis: {
        technical: this.getTechnicalComplexityDetails(application),
        team: this.getTeamCapabilityDetails(application),
        timeframe: this.getTimeframeDetails(application),
        resources: this.getResourceDetails(application),
        implementation: this.getImplementationDetails(application),
      },
    };
  }

  private analyzeTechnicalComplexity(application: any): number {
    const description = application.description.toLowerCase();
    const solution = application.solution.toLowerCase();
    const techStack = application.techStack.join(' ').toLowerCase();
    
    // Complex technologies/concepts that might increase difficulty
    const complexTechnologies = [
      'blockchain', 'machine learning', 'ai', 'artificial intelligence',
      'deep learning', 'neural network', 'cryptocurrency', 'smart contract',
      'ar', 'vr', 'augmented reality', 'virtual reality', 'iot', 'quantum',
      'microservices', 'kubernetes', 'big data', 'real-time', 'distributed',
    ];

    const moderateTechnologies = [
      'api', 'database', 'cloud', 'mobile', 'web app', 'authentication',
      'payment', 'notification', 'search', 'analytics', 'dashboard',
    ];

    const simpleTechnologies = [
      'html', 'css', 'javascript', 'react', 'node', 'express', 'crud',
      'form', 'list', 'basic', 'simple', 'static',
    ];

    const text = `${description} ${solution} ${techStack}`;
    
    let complexityScore = 0.7; // Default moderate complexity
    
    // Check for complex technologies
    const complexMatches = complexTechnologies.filter(tech => text.includes(tech));
    if (complexMatches.length > 0) {
      complexityScore -= complexMatches.length * 0.15;
    }
    
    // Check for moderate technologies
    const moderateMatches = moderateTechnologies.filter(tech => text.includes(tech));
    if (moderateMatches.length > 0) {
      complexityScore += 0.1;
    }
    
    // Check for simple technologies
    const simpleMatches = simpleTechnologies.filter(tech => text.includes(tech));
    if (simpleMatches.length > 0) {
      complexityScore += simpleMatches.length * 0.1;
    }

    return Math.max(0, Math.min(1, complexityScore));
  }

  private analyzeTeamCapability(application: any): number {
    const teamSize = application.teamSize;
    
    // Team size scoring
    let teamScore = 0.5;
    if (teamSize >= 5) teamScore = 1.0;
    else if (teamSize >= 3) teamScore = 0.8;
    else if (teamSize >= 2) teamScore = 0.6;
    else teamScore = 0.3;
    
    // Check if tech stack mentions experience
    const techStackText = application.techStack.join(' ').toLowerCase();
    const experienceKeywords = ['expert', 'experienced', 'senior', 'professional', 'years'];
    const hasExperience = experienceKeywords.some(keyword => techStackText.includes(keyword));
    
    if (hasExperience) teamScore += 0.2;
    
    return Math.min(1, teamScore);
  }

  private analyzeTimeframe(application: any): number {
    // Estimate based on project complexity and description
    const description = application.description.toLowerCase();
    const solution = application.solution.toLowerCase();
    
    // Keywords that suggest longer development time
    const complexFeatures = [
      'complex', 'advanced', 'comprehensive', 'full-featured', 'enterprise',
      'scalable', 'robust', 'sophisticated', 'multi-platform', 'integration',
    ];
    
    const quickFeatures = [
      'simple', 'basic', 'minimal', 'prototype', 'mvp', 'quick', 'fast',
      'lightweight', 'straightforward', 'easy',
    ];
    
    const text = `${description} ${solution}`;
    
    let timeScore = 0.7; // Default moderate timeframe
    
    const complexCount = complexFeatures.filter(feature => text.includes(feature)).length;
    const quickCount = quickFeatures.filter(feature => text.includes(feature)).length;
    
    timeScore -= complexCount * 0.1;
    timeScore += quickCount * 0.15;
    
    return Math.max(0.2, Math.min(1, timeScore));
  }

  private analyzeResourceRequirements(application: any): number {
    const description = application.description.toLowerCase();
    const techStack = application.techStack.join(' ').toLowerCase();
    
    // High resource requirements
    const resourceIntensiveKeywords = [
      'cloud', 'server', 'database', 'storage', 'cdn', 'api',
      'third-party', 'integration', 'payment', 'hosting',
    ];
    
    const lowResourceKeywords = [
      'static', 'client-side', 'local', 'offline', 'browser',
      'simple', 'lightweight',
    ];
    
    const text = `${description} ${techStack}`;
    
    let resourceScore = 0.7;
    
    const highResourceCount = resourceIntensiveKeywords.filter(keyword => text.includes(keyword)).length;
    const lowResourceCount = lowResourceKeywords.filter(keyword => text.includes(keyword)).length;
    
    resourceScore -= highResourceCount * 0.08;
    resourceScore += lowResourceCount * 0.1;
    
    return Math.max(0.2, Math.min(1, resourceScore));
  }

  private getTechnicalComplexityDetails(application: any): any {
    return {
      techStack: application.techStack,
      complexityIndicators: this.identifyComplexityIndicators(application),
      estimatedDifficulty: this.analyzeTechnicalComplexity(application) > 0.7 ? 'Low' : 
                           this.analyzeTechnicalComplexity(application) > 0.5 ? 'Medium' : 'High',
    };
  }

  private getTeamCapabilityDetails(application: any): any {
    return {
      teamSize: application.teamSize,
      teamMembers: application.teamMembers,
      adequacyAssessment: application.teamSize >= 3 ? 'Adequate' : 'May need additional members',
    };
  }

  private getTimeframeDetails(application: any): any {
    return {
      estimatedComplexity: this.analyzeTimeframe(application) > 0.7 ? 'Low' : 
                          this.analyzeTimeframe(application) > 0.5 ? 'Medium' : 'High',
      recommendedTimeframe: this.analyzeTimeframe(application) > 0.7 ? '2-4 weeks' : 
                           this.analyzeTimeframe(application) > 0.5 ? '1-3 months' : '3+ months',
    };
  }

  private getResourceDetails(application: any): any {
    return {
      estimatedResourceNeeds: this.analyzeResourceRequirements(application) > 0.7 ? 'Low' : 
                             this.analyzeResourceRequirements(application) > 0.5 ? 'Medium' : 'High',
      keyResourceRequirements: this.identifyResourceRequirements(application),
    };
  }

  private analyzeImplementationApproach(application: any): number {
    // If no implementation details provided, return neutral score
    if (!application.implementation || application.implementation.trim().length === 0) {
      return 0.7; // Neutral score when no implementation details provided
    }

    const implementation = application.implementation.toLowerCase();
    let score = 0.5; // Start with baseline score
    
    // Positive indicators in implementation approach
    const positiveIndicators = [
      'step-by-step', 'phase', 'milestone', 'architecture', 'design pattern',
      'testing', 'deployment', 'scalability', 'security', 'performance',
      'api design', 'database schema', 'user interface', 'user experience',
      'validation', 'error handling', 'monitoring', 'logging', 'documentation',
      'version control', 'git', 'ci/cd', 'continuous integration', 'agile',
      'sprint', 'iteration', 'prototype', 'mvp', 'minimum viable product',
      'timeline', 'schedule', 'deadline', 'deliverable', 'requirement',
      'specification', 'wireframe', 'mockup', 'framework', 'library',
      'best practice', 'standard', 'convention', 'pattern', 'methodology'
    ];

    // Technical depth indicators
    const technicalDepthIndicators = [
      'algorithm', 'data structure', 'optimization', 'cache', 'load balancing',
      'microservice', 'container', 'docker', 'kubernetes', 'cloud',
      'aws', 'azure', 'gcp', 'serverless', 'lambda', 'function',
      'database', 'sql', 'nosql', 'mongodb', 'postgresql', 'mysql',
      'redis', 'elasticsearch', 'queue', 'message', 'event',
      'webhook', 'websocket', 'real-time', 'streaming'
    ];

    // Risk awareness indicators
    const riskAwarenessIndicators = [
      'challenge', 'risk', 'limitation', 'constraint', 'dependency',
      'fallback', 'backup', 'contingency', 'alternative', 'mitigation',
      'consideration', 'trade-off', 'assumption', 'potential issue',
      'complexity', 'difficulty', 'obstacle', 'blocker'
    ];

    // Vague or concerning indicators
    const negativeIndicators = [
      'just', 'simply', 'easily', 'quickly', 'basic', 'straightforward',
      'no problem', 'piece of cake', 'trivial', 'obvious', 'clear',
      'i think', 'maybe', 'probably', 'might', 'could be', 'should work',
      'not sure', 'unclear', 'tbd', 'to be determined', 'figure out later'
    ];

    // Calculate scores for each category
    const positiveMatches = positiveIndicators.filter(indicator => 
      implementation.includes(indicator)
    ).length;
    
    const technicalMatches = technicalDepthIndicators.filter(indicator => 
      implementation.includes(indicator)
    ).length;
    
    const riskMatches = riskAwarenessIndicators.filter(indicator => 
      implementation.includes(indicator)
    ).length;
    
    const negativeMatches = negativeIndicators.filter(indicator => 
      implementation.includes(indicator)
    ).length;

    // Adjust score based on findings
    score += Math.min(0.3, positiveMatches * 0.03); // Up to 0.3 boost
    score += Math.min(0.2, technicalMatches * 0.02); // Up to 0.2 boost
    score += Math.min(0.1, riskMatches * 0.02); // Up to 0.1 boost for risk awareness
    score -= Math.min(0.3, negativeMatches * 0.05); // Up to 0.3 penalty

    // Length and structure bonus
    const wordCount = implementation.split(/\s+/).length;
    if (wordCount >= 200) score += 0.1; // Detailed implementation
    else if (wordCount >= 100) score += 0.05; // Moderate detail
    else if (wordCount < 30) score -= 0.1; // Too brief

    // Check for structured approach (numbered lists, bullet points, etc.)
    const hasStructure = /(\d+\.|•|\*|-|\n\s*\w+:)/.test(application.implementation);
    if (hasStructure) score += 0.1;

    // Ensure score is within bounds
    return Math.max(0, Math.min(1, score));
  }

  private getImplementationDetails(application: any): any {
    if (!application.implementation) {
      return {
        hasImplementationPlan: false,
        detail: 'No implementation approach provided',
        score: 0.7,
        strengths: [],
        concerns: ['Implementation approach not specified'],
        recommendations: ['Provide detailed implementation plan', 'Include technical architecture', 'Specify development phases']
      };
    }

    const implementation = application.implementation.toLowerCase();
    const score = this.analyzeImplementationApproach(application);
    
    const strengths: string[] = [];
    const concerns: string[] = [];
    const recommendations: string[] = [];

    // Analyze strengths
    if (implementation.includes('step') || implementation.includes('phase')) {
      strengths.push('Shows structured, phased approach');
    }
    if (implementation.includes('testing')) {
      strengths.push('Includes testing considerations');
    }
    if (implementation.includes('security')) {
      strengths.push('Addresses security concerns');
    }
    if (implementation.includes('scalability')) {
      strengths.push('Considers scalability requirements');
    }

    // Identify concerns
    if (implementation.includes('not sure') || implementation.includes('maybe')) {
      concerns.push('Contains uncertainty about implementation details');
    }
    if (implementation.split(/\s+/).length < 50) {
      concerns.push('Implementation plan lacks sufficient detail');
    }
    if (!implementation.includes('architecture') && !implementation.includes('design')) {
      concerns.push('Missing architectural design considerations');
    }

    // Generate recommendations
    if (score < 0.7) {
      recommendations.push('Provide more detailed technical approach');
      recommendations.push('Include system architecture overview');
      recommendations.push('Specify technology stack justification');
    }
    if (!implementation.includes('timeline')) {
      recommendations.push('Add development timeline and milestones');
    }
    if (!implementation.includes('risk')) {
      recommendations.push('Identify potential risks and mitigation strategies');
    }

    return {
      hasImplementationPlan: true,
      detail: score > 0.8 ? 'Comprehensive' : score > 0.6 ? 'Adequate' : 'Needs improvement',
      score,
      strengths,
      concerns,
      recommendations
    };
  }

  private identifyComplexityIndicators(application: any): string[] {
    const text = `${application.description} ${application.solution} ${application.techStack.join(' ')}`.toLowerCase();
    const complexIndicators = [
      'real-time', 'scalability', 'machine learning', 'ai', 'blockchain',
      'microservices', 'distributed', 'big data', 'security', 'performance',
    ];
    
    return complexIndicators.filter(indicator => text.includes(indicator));
  }

  private identifyResourceRequirements(application: any): string[] {
    const text = `${application.description} ${application.solution} ${application.techStack.join(' ')}`.toLowerCase();
    const resourceKeywords = [
      'database', 'server', 'cloud', 'storage', 'api', 'hosting',
      'third-party services', 'payment processing', 'authentication',
    ];
    
    return resourceKeywords.filter(keyword => text.includes(keyword));
  }
}
