import { Resolver, Query, Mutation, Args, ID, Context } from '@nestjs/graphql';
import { UseGuards, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User, Application, ApplicationConnection } from '../graphql/models';
import { 
  CreateApplicationInput, 
  UpdateApplicationInput, 
  PaginationInput, 
  ApplicationFilterInput 
} from '../graphql/inputs';
import { ApplicationsService } from './applications.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';

@Resolver(() => Application)
export class ApplicationsResolver {
  constructor(private readonly applicationsService: ApplicationsService) {}

  // Helper method to convert Prisma application to GraphQL Application
  private mapToGraphQLApplication(prismaApp: any): Application {
    return {
      ...prismaApp,
      githubRepo: prismaApp.githubRepo || undefined,
      demoUrl: prismaApp.demoUrl || undefined,
      submittedAt: prismaApp.submittedAt || undefined,
      rejectionReason: prismaApp.rejectionReason || undefined,
    };
  }

  // Helper method to convert GraphQL input to DTO
  private mapCreateInputToDto(input: CreateApplicationInput): CreateApplicationDto {
    return {
      title: input.title,
      description: input.description,
      problemStatement: input.problemStatement,
      solution: input.solution,
      techStack: input.techStack,
      teamSize: input.teamSize,
      teamMembers: input.teamMembers,
      githubRepo: input.githubRepo,
      demoUrl: input.demoUrl,
      // Map GraphQL ApplicationStatus to DTO status
      status: input.status === 'DRAFT' || input.status === 'SUBMITTED' ? input.status : undefined,
    };
  }

  private mapUpdateInputToDto(input: UpdateApplicationInput): UpdateApplicationDto {
    return {
      title: input.title,
      description: input.description,
      problemStatement: input.problemStatement,
      solution: input.solution,
      techStack: input.techStack,
      teamSize: input.teamSize,
      teamMembers: input.teamMembers,
      githubRepo: input.githubRepo,
      demoUrl: input.demoUrl,
      // Only allow DRAFT/SUBMITTED status updates through regular update
      status: input.status === 'DRAFT' || input.status === 'SUBMITTED' ? input.status : undefined,
    };
  }

  @Query(() => ApplicationConnection)
  @UseGuards(AuthGuard('jwt'))
  async applications(
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
    @Args('filter', { nullable: true }) filter?: ApplicationFilterInput,
    @CurrentUser() user?: User,
  ): Promise<ApplicationConnection> {
    const page = pagination?.first ? Math.ceil((pagination.first || 10) / 10) : 1;
    const limit = pagination?.first || 10;
    
    // Use basic findAll method - it only accepts page, limit, status
    const result = await this.applicationsService.findAll(page, limit, filter?.status);

    const mappedApplications = result.applications.map(app => this.mapToGraphQLApplication(app));

    return {
      nodes: mappedApplications,
      pageInfo: {
        hasNextPage: page * limit < result.total,
        hasPreviousPage: page > 1,
        startCursor: mappedApplications.length > 0 ? mappedApplications[0].id : undefined,
        endCursor: mappedApplications.length > 0 ? mappedApplications[mappedApplications.length - 1].id : undefined,
      },
      totalCount: result.total,
    };
  }

  @Query(() => Application, { nullable: true })
  @UseGuards(AuthGuard('jwt'))
  async application(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ): Promise<Application> {
    const application = await this.applicationsService.findOne(id);
    
    // Non-admin users can only see their own applications
    if (user.role !== 'ADMIN' && application.userId !== user.id) {
      throw new ForbiddenException('You can only access your own applications');
    }

    return this.mapToGraphQLApplication(application);
  }

  @Query(() => [Application])
  @UseGuards(AuthGuard('jwt'))
  async myApplications(
    @CurrentUser() user: User,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  ): Promise<Application[]> {
    const page = pagination?.first ? Math.ceil((pagination.first || 10) / 10) : 1;
    const limit = pagination?.first || 10;

    const result = await this.applicationsService.findUserApplications(user.id, page, limit);
    return result.applications.map(app => this.mapToGraphQLApplication(app));
  }

  @Mutation(() => Application)
  @UseGuards(AuthGuard('jwt'))
  async createApplication(
    @Args('input') input: CreateApplicationInput,
    @CurrentUser() user: User,
  ): Promise<Application> {
    const dto = this.mapCreateInputToDto(input);
    const application = await this.applicationsService.create(dto, user.id);
    return this.mapToGraphQLApplication(application);
  }

  @Mutation(() => Application)
  @UseGuards(AuthGuard('jwt'))
  async updateApplication(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateApplicationInput,
    @CurrentUser() user: User,
  ): Promise<Application> {
    const application = await this.applicationsService.findOne(id);
    
    // Non-admin users can only update their own applications
    if (user.role !== 'ADMIN' && application.userId !== user.id) {
      throw new ForbiddenException('You can only update your own applications');
    }

    const dto = this.mapUpdateInputToDto(input);
    const updatedApplication = await this.applicationsService.update(id, dto, user.id, user.role);
    return this.mapToGraphQLApplication(updatedApplication);
  }

  @Mutation(() => Application)
  @UseGuards(AuthGuard('jwt'))
  async submitApplication(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ): Promise<Application> {
    const application = await this.applicationsService.findOne(id);
    
    // Users can only submit their own applications
    if (application.userId !== user.id) {
      throw new ForbiddenException('You can only submit your own applications');
    }

    // Use update method to submit the application
    const dto: UpdateApplicationDto = { status: 'SUBMITTED' };
    const submittedApplication = await this.applicationsService.update(id, dto, user.id, user.role);
    return this.mapToGraphQLApplication(submittedApplication);
  }

  @Mutation(() => Boolean)
  @UseGuards(AuthGuard('jwt'))
  async deleteApplication(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ): Promise<boolean> {
    const application = await this.applicationsService.findOne(id);
    
    // Non-admin users can only delete their own applications
    if (user.role !== 'ADMIN' && application.userId !== user.id) {
      throw new ForbiddenException('You can only delete your own applications');
    }

    await this.applicationsService.remove(id, user.id, user.role);
    return true;
  }

  @Mutation(() => Application)
  @Roles('ADMIN')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async updateApplicationStatus(
    @Args('id', { type: () => ID }) id: string,
    @Args('status') status: string,
    @Args('rejectionReason', { nullable: true }) rejectionReason?: string,
    @CurrentUser() user?: User,
  ): Promise<Application> {
    const updatedApplication = await this.applicationsService.updateStatus(id, status, user?.id);
    return this.mapToGraphQLApplication(updatedApplication);
  }

  @Query(() => String)
  @UseGuards(AuthGuard('jwt'))
  async getAIReviewStatus(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ): Promise<string> {
    const status = await this.applicationsService.getAIReviewStatus(id, user.id, user.role);
    return JSON.stringify(status);
  }
}
