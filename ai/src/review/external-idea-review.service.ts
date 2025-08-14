import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { DatabaseService } from '../database/database.service';

export interface ExternalSourceResult {
  found: boolean;
  source?: string;
  url?: string;
  similarity?: number;
  details?: string;
}

@Injectable()
export class ExternalIdeaReviewService {
  private readonly logger = new Logger(ExternalIdeaReviewService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly databaseService: DatabaseService,
  ) {}

  async reviewIdea(applicationId: string): Promise<void> {
    this.logger.log(`Starting external idea review for application ${applicationId}`);

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
          type: 'EXTERNAL_IDEA',
          result: 'PENDING',
        },
      });

      // Check external sources
      const results = await Promise.all([
        this.checkProductHunt(application.title, application.description),
        this.checkYCombinator(application.title, application.description),
        this.checkGeneralWeb(application.title, application.description),
      ]);

      const foundInExternal = results.some(result => result.found);
      
      let feedback = '';
      let metadata = {
        productHunt: JSON.parse(JSON.stringify(results[0])),
        yCombinator: JSON.parse(JSON.stringify(results[1])),
        webSearch: JSON.parse(JSON.stringify(results[2])),
      };

      if (foundInExternal) {
        const foundSources = results.filter(r => r.found);
        feedback = `Similar idea found in external sources: ${foundSources.map(s => s.source).join(', ')}. `;
        feedback += foundSources.map(s => s.details).join(' ');
        
        // Update AI review and application status
        await this.databaseService.aIReview.update({
          where: { id: aiReview.id },
          data: {
            result: 'REJECTED',
            feedback,
            metadata,
            processedAt: new Date(),
            score: foundSources.reduce((acc, s) => Math.max(acc, s.similarity || 0), 0),
          },
        });

        await this.databaseService.application.update({
          where: { id: applicationId },
          data: {
            status: 'REJECTED',
            rejectionReason: feedback,
          },
        });
      } else {
        feedback = 'No similar ideas found in external sources. Proceeding to internal review.';
        
        await this.databaseService.aIReview.update({
          where: { id: aiReview.id },
          data: {
            result: 'APPROVED',
            feedback,
            metadata,
            processedAt: new Date(),
            score: 0.9, // High confidence for not found
          },
        });

        // Move to next stage
        await this.databaseService.application.update({
          where: { id: applicationId },
          data: {
            status: 'INTERNAL_IDEA_REVIEW',
          },
        });
      }

      this.logger.log(`External idea review completed for application ${applicationId}: ${foundInExternal ? 'REJECTED' : 'APPROVED'}`);
    } catch (error) {
      this.logger.error(`Error in external idea review for application ${applicationId}:`, error);
      
      // Update AI review with error
      await this.databaseService.aIReview.updateMany({
        where: { 
          applicationId,
          type: 'EXTERNAL_IDEA',
        },
        data: {
          result: 'REJECTED',
          errorMessage: error.message,
          processedAt: new Date(),
        },
      });
    }
  }

  private async checkProductHunt(title: string, description: string): Promise<ExternalSourceResult> {
    try {
      // Simulate Product Hunt API check
      // In real implementation, you would use Product Hunt API
      this.logger.log('Checking Product Hunt for similar ideas...');
      
      // Mock implementation - replace with actual API call
      const searchQuery = encodeURIComponent(title);
      const mockSimilarity = Math.random();
      
      if (mockSimilarity > 0.7) {
        return {
          found: true,
          source: 'Product Hunt',
          similarity: mockSimilarity,
          details: `Found similar product on Product Hunt with ${Math.round(mockSimilarity * 100)}% similarity.`,
        };
      }

      return { found: false, source: 'Product Hunt' };
    } catch (error) {
      this.logger.error('Error checking Product Hunt:', error);
      return { found: false, source: 'Product Hunt' };
    }
  }

  private async checkYCombinator(title: string, description: string): Promise<ExternalSourceResult> {
    try {
      // Simulate Y Combinator startup database check
      this.logger.log('Checking Y Combinator database for similar ideas...');
      
      // Mock implementation - replace with actual scraping or API
      const mockSimilarity = Math.random();
      
      if (mockSimilarity > 0.75) {
        return {
          found: true,
          source: 'Y Combinator',
          similarity: mockSimilarity,
          details: `Found similar startup in Y Combinator portfolio with ${Math.round(mockSimilarity * 100)}% similarity.`,
        };
      }

      return { found: false, source: 'Y Combinator' };
    } catch (error) {
      this.logger.error('Error checking Y Combinator:', error);
      return { found: false, source: 'Y Combinator' };
    }
  }

  private async checkGeneralWeb(title: string, description: string): Promise<ExternalSourceResult> {
    try {
      // Simulate general web search for similar products/services
      this.logger.log('Performing general web search for similar ideas...');
      
      // Mock implementation - replace with actual search API (Google, Bing, etc.)
      const mockSimilarity = Math.random();
      
      if (mockSimilarity > 0.8) {
        return {
          found: true,
          source: 'Web Search',
          similarity: mockSimilarity,
          details: `Found similar product/service on the web with ${Math.round(mockSimilarity * 100)}% similarity.`,
        };
      }

      return { found: false, source: 'Web Search' };
    } catch (error) {
      this.logger.error('Error in web search:', error);
      return { found: false, source: 'Web Search' };
    }
  }
}
