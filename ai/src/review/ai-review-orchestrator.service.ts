import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ExternalIdeaReviewService } from './external-idea-review.service';
import { InternalIdeaReviewService } from './internal-idea-review.service';
import { CategorizationService } from './categorization.service';
import { ImplementationReviewService } from './implementation-review.service';
import { CostReviewService } from './cost-review.service';
import { CustomerImpactReviewService } from './customer-impact-review.service';

@Injectable()
export class AIReviewOrchestratorService {
  private readonly logger = new Logger(AIReviewOrchestratorService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly externalIdeaReviewService: ExternalIdeaReviewService,
    private readonly internalIdeaReviewService: InternalIdeaReviewService,
    private readonly categorizationService: CategorizationService,
    private readonly implementationReviewService: ImplementationReviewService,
    private readonly costReviewService: CostReviewService,
    private readonly customerImpactReviewService: CustomerImpactReviewService,
  ) {}

  async processApplicationReview(applicationId: string): Promise<void> {
    this.logger.log(`Starting AI review process for application ${applicationId}`);

    try {
      const application = await this.databaseService.application.findUnique({
        where: { id: applicationId },
        include: {
          user: true,
          aiReviews: true,
        },
      });

      if (!application) {
        throw new Error(`Application ${applicationId} not found`);
      }

      // Check if application is in SUBMITTED status
      if (application.status !== 'SUBMITTED') {
        this.logger.warn(`Application ${applicationId} is not in SUBMITTED status. Current status: ${application.status}`);
        return;
      }

      // Start the review pipeline
      await this.startReviewPipeline(applicationId);
      
    } catch (error) {
      this.logger.error(`Error processing application review for ${applicationId}:`, error);
      
      // Update application status to indicate AI review failure
      await this.databaseService.application.update({
        where: { id: applicationId },
        data: {
          status: 'REJECTED',
          rejectionReason: `AI review system error: ${error.message}`,
        },
      });
    }
  }

  private async startReviewPipeline(applicationId: string): Promise<void> {
    this.logger.log(`Starting review pipeline for application ${applicationId}`);

    try {
      // Step 1: External Idea Review
      await this.databaseService.application.update({
        where: { id: applicationId },
        data: { status: 'EXTERNAL_IDEA_REVIEW' },
      });
      
      await this.externalIdeaReviewService.reviewIdea(applicationId);
      
      // Check if application was rejected
      const afterExternal = await this.databaseService.application.findUnique({
        where: { id: applicationId },
      });
      
      if (afterExternal?.status === 'REJECTED') {
        this.logger.log(`Application ${applicationId} rejected in external idea review`);
        return;
      }

      // Step 2: Internal Idea Review
      await this.internalIdeaReviewService.reviewIdea(applicationId);
      
      const afterInternal = await this.databaseService.application.findUnique({
        where: { id: applicationId },
      });
      
      if (afterInternal?.status === 'REJECTED') {
        this.logger.log(`Application ${applicationId} rejected in internal idea review`);
        return;
      }

      // Step 3: Categorization
      await this.categorizationService.categorizeIdea(applicationId);
      
      // Step 4: Implementation Feasibility Review
      await this.implementationReviewService.reviewImplementationFeasibility(applicationId);
      
      const afterImplementation = await this.databaseService.application.findUnique({
        where: { id: applicationId },
      });
      
      if (afterImplementation?.status === 'REJECTED') {
        this.logger.log(`Application ${applicationId} rejected in implementation review`);
        return;
      }

      // Step 5: Cost Review
      await this.costReviewService.reviewCostFeasibility(applicationId);
      
      const afterCost = await this.databaseService.application.findUnique({
        where: { id: applicationId },
      });
      
      if (afterCost?.status === 'REJECTED') {
        this.logger.log(`Application ${applicationId} rejected in cost review`);
        return;
      }

      // Step 6: Customer Impact Review
      await this.customerImpactReviewService.reviewCustomerImpact(applicationId);
      
      const finalStatus = await this.databaseService.application.findUnique({
        where: { id: applicationId },
      });
      
      if (finalStatus?.status === 'UNDER_REVIEW') {
        this.logger.log(`Application ${applicationId} passed all AI reviews and moved to manual review`);
        await this.notifyReviewCompletion(applicationId, 'PASSED');
      } else {
        this.logger.log(`Application ${applicationId} rejected in customer impact review`);
        await this.notifyReviewCompletion(applicationId, 'REJECTED');
      }

    } catch (error) {
      this.logger.error(`Error in review pipeline for application ${applicationId}:`, error);
      throw error;
    }
  }

  async getReviewStatus(applicationId: string): Promise<any> {
    const application = await this.databaseService.application.findUnique({
      where: { id: applicationId },
      include: {
        aiReviews: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!application) {
      throw new Error(`Application ${applicationId} not found`);
    }

    // Map review types to their sequence
    const reviewSequence = [
      'EXTERNAL_IDEA',
      'INTERNAL_IDEA',
      'CATEGORIZATION',
      'IMPLEMENTATION_FEASIBILITY',
      'COST_ANALYSIS',
      'CUSTOMER_IMPACT',
    ];

    const reviewProgress = reviewSequence.map(reviewType => {
      const review = application.aiReviews.find(r => r.type === reviewType);
      return {
        type: reviewType,
        status: review?.result || 'PENDING',
        feedback: review?.feedback,
        score: review?.score,
        processedAt: review?.processedAt,
        error: review?.errorMessage,
      };
    });

    // Calculate overall progress percentage
    const completedReviews = reviewProgress.filter(r => r.status !== 'PENDING').length;
    const progressPercentage = (completedReviews / reviewSequence.length) * 100;

    return {
      applicationId,
      currentStatus: application.status,
      progressPercentage: Math.round(progressPercentage),
      reviews: reviewProgress,
      category: application.category,
      rejectionReason: application.rejectionReason,
      lastUpdated: application.updatedAt,
    };
  }

  async retryFailedReview(applicationId: string, reviewType: string): Promise<void> {
    this.logger.log(`Retrying ${reviewType} review for application ${applicationId}`);

    try {
      // Delete the failed review record
      await this.databaseService.aIReview.deleteMany({
        where: {
          applicationId,
          type: reviewType as any,
        },
      });

      // Reset application status to retry from this step
      const statusMap: { [key: string]: string } = {
        'EXTERNAL_IDEA': 'EXTERNAL_IDEA_REVIEW',
        'INTERNAL_IDEA': 'INTERNAL_IDEA_REVIEW',
        'CATEGORIZATION': 'CATEGORIZATION',
        'IMPLEMENTATION_FEASIBILITY': 'IMPLEMENTATION_REVIEW',
        'COST_ANALYSIS': 'COST_REVIEW',
        'CUSTOMER_IMPACT': 'IMPACT_REVIEW',
      };

      await this.databaseService.application.update({
        where: { id: applicationId },
        data: {
          status: statusMap[reviewType] as any,
          rejectionReason: null,
        },
      });

      // Call the appropriate review service
      switch (reviewType) {
        case 'EXTERNAL_IDEA':
          await this.externalIdeaReviewService.reviewIdea(applicationId);
          break;
        case 'INTERNAL_IDEA':
          await this.internalIdeaReviewService.reviewIdea(applicationId);
          break;
        case 'CATEGORIZATION':
          await this.categorizationService.categorizeIdea(applicationId);
          break;
        case 'IMPLEMENTATION_FEASIBILITY':
          await this.implementationReviewService.reviewImplementationFeasibility(applicationId);
          break;
        case 'COST_ANALYSIS':
          await this.costReviewService.reviewCostFeasibility(applicationId);
          break;
        case 'CUSTOMER_IMPACT':
          await this.customerImpactReviewService.reviewCustomerImpact(applicationId);
          break;
        default:
          throw new Error(`Unknown review type: ${reviewType}`);
      }

    } catch (error) {
      this.logger.error(`Error retrying ${reviewType} review for application ${applicationId}:`, error);
      throw error;
    }
  }

  private async notifyReviewCompletion(applicationId: string, result: 'PASSED' | 'REJECTED'): Promise<void> {
    // This method would integrate with the notification service in the main backend
    // For now, we'll just log the completion
    this.logger.log(`AI review completed for application ${applicationId}: ${result}`);
    
    // TODO: Send notification to main backend service
    // This could be done via HTTP call, message queue, or database trigger
  }

  async getDetailedReviewReport(applicationId: string): Promise<any> {
    const application = await this.databaseService.application.findUnique({
      where: { id: applicationId },
      include: {
        aiReviews: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!application) {
      throw new Error(`Application ${applicationId} not found`);
    }

    // Organize reviews by type with detailed metadata
    const reviewDetails = application.aiReviews.reduce((acc, review) => {
      acc[review.type] = {
        result: review.result,
        feedback: review.feedback,
        score: review.score,
        metadata: review.metadata,
        processedAt: review.processedAt,
        error: review.errorMessage,
      };
      return acc;
    }, {} as any);

    return {
      application: {
        id: application.id,
        title: application.title,
        description: application.description,
        problemStatement: application.problemStatement,
        solution: application.solution,
        techStack: application.techStack,
        teamSize: application.teamSize,
        teamMembers: application.teamMembers,
        estimatedCost: application.estimatedCost,
        category: application.category,
        status: application.status,
        submittedAt: application.submittedAt,
        user: application.user,
      },
      reviewResults: reviewDetails,
      summary: {
        totalReviews: application.aiReviews.length,
        passedReviews: application.aiReviews.filter(r => r.result === 'APPROVED').length,
        failedReviews: application.aiReviews.filter(r => r.result === 'REJECTED').length,
        averageScore: application.aiReviews.reduce((acc, r) => acc + (r.score || 0), 0) / application.aiReviews.length,
        finalStatus: application.status,
        rejectionReason: application.rejectionReason,
      },
    };
  }
}
