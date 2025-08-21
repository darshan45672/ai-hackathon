import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User, Review, ReviewConnection } from '../graphql/models';
import { 
  CreateReviewInput, 
  UpdateReviewInput, 
  PaginationInput, 
  ReviewFilterInput 
} from '../graphql/inputs';
import { ReviewsService } from './reviews.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Resolver(() => Review)
export class ReviewsResolver {
  constructor(private readonly reviewsService: ReviewsService) {}

  // Helper method to convert Prisma review to GraphQL Review
  private mapToGraphQLReview(prismaReview: any): Review {
    return {
      ...prismaReview,
      feedback: prismaReview.feedback || undefined,
      score: prismaReview.score || undefined,
    };
  }

  @Query(() => ReviewConnection)
  @Roles('ADMIN')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async reviews(
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
    @Args('filter', { nullable: true }) filter?: ReviewFilterInput,
  ): Promise<ReviewConnection> {
    const page = pagination?.first ? Math.ceil((pagination.first || 10) / 10) : 1;
    const limit = pagination?.first || 10;
    
    const result = await this.reviewsService.findAll(
      page, 
      limit, 
      filter?.applicationId,
      filter?.reviewerId
    );

    const mappedReviews = result.reviews.map(review => this.mapToGraphQLReview(review));

    return {
      nodes: mappedReviews,
      pageInfo: {
        hasNextPage: page * limit < result.total,
        hasPreviousPage: page > 1,
        startCursor: mappedReviews.length > 0 ? mappedReviews[0].id : undefined,
        endCursor: mappedReviews.length > 0 ? mappedReviews[mappedReviews.length - 1].id : undefined,
      },
      totalCount: result.total,
    };
  }

  @Query(() => Review, { nullable: true })
  @UseGuards(AuthGuard('jwt'))
  async review(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ): Promise<Review> {
    const review = await this.reviewsService.findOne(id);
    
    // Users can only view reviews for their own applications or reviews they created
    // Admins can view all reviews
    if (user.role !== 'ADMIN' && 
        review.reviewerId !== user.id && 
        review.application.userId !== user.id) {
      throw new ForbiddenException('You can only view reviews for your own applications or reviews you created');
    }

    return this.mapToGraphQLReview(review);
  }

  @Query(() => [Review])
  @UseGuards(AuthGuard('jwt'))
  async reviewsForApplication(
    @Args('applicationId', { type: () => ID }) applicationId: string,
    @CurrentUser() user: User,
  ): Promise<Review[]> {
    const reviews = await this.reviewsService.findByApplicationId(applicationId);
    
    // Check if user has permission to view these reviews
    if (reviews.length > 0) {
      const firstReview = reviews[0];
      if (user.role !== 'ADMIN' && firstReview.application.userId !== user.id) {
        throw new ForbiddenException('You can only view reviews for your own applications');
      }
    }

    return reviews.map(review => this.mapToGraphQLReview(review));
  }

  @Query(() => [Review])
  @UseGuards(AuthGuard('jwt'))
  async myReviews(
    @CurrentUser() user: User,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  ): Promise<Review[]> {
    const page = pagination?.first ? Math.ceil((pagination.first || 10) / 10) : 1;
    const limit = pagination?.first || 10;

    const result = await this.reviewsService.findByReviewerId(user.id, page, limit);
    return result.reviews.map(review => this.mapToGraphQLReview(review));
  }

  @Mutation(() => Review)
  @Roles('ADMIN')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async createReview(
    @Args('input') input: CreateReviewInput,
    @CurrentUser() user: User,
  ): Promise<Review> {
    const review = await this.reviewsService.create(
      input.applicationId,
      {
        score: input.score,
        feedback: input.feedback,
      },
      user.id
    );
    
    return this.mapToGraphQLReview(review);
  }

  @Mutation(() => Review)
  @UseGuards(AuthGuard('jwt'))
  async updateReview(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateReviewInput,
    @CurrentUser() user: User,
  ): Promise<Review> {
    const review = await this.reviewsService.findOne(id);
    
    // Only the reviewer or admin can update a review
    if (user.role !== 'ADMIN' && review.reviewerId !== user.id) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    const updatedReview = await this.reviewsService.update(id, {
      feedback: input.feedback,
      score: input.score || 0, // Default score if not provided
    }, user.id);

    return this.mapToGraphQLReview(updatedReview);
  }

  @Mutation(() => Boolean)
  @Roles('ADMIN')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async deleteReview(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ): Promise<boolean> {
    await this.reviewsService.remove(id, user.id);
    return true;
  }
}
