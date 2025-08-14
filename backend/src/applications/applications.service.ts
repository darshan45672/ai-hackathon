import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AIServiceClient } from './ai-service-client.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';

@Injectable()
export class ApplicationsService {
  constructor(
    private databaseService: DatabaseService,
    private notificationsService: NotificationsService,
    private aiServiceClient: AIServiceClient,
  ) {}

  async create(createApplicationDto: CreateApplicationDto, userId: string) {
    const application = await this.databaseService.application.create({
      data: {
        ...createApplicationDto,
        status: createApplicationDto.status || 'DRAFT', // Default to DRAFT if not specified
        userId,
      },
      include: {
        user: true,
        reviews: {
          include: {
            reviewer: true,
          },
        },
      },
    });

    // If the application is submitted directly (not as draft), trigger AI review
    if (application.status === 'SUBMITTED') {
      // Update submission timestamp
      await this.databaseService.application.update({
        where: { id: application.id },
        data: { submittedAt: new Date() },
      });

      // Notify the user about successful submission
      await this.notificationsService.createApplicationStatusNotification(
        application.id,
        userId,
        'SUBMITTED',
      );

      // Trigger AI review process (async, don't wait for completion)
      this.triggerAIReview(application.id).catch(error => {
        console.error(`Failed to trigger AI review for application ${application.id}:`, error);
      });

      // Notify all admins about the new application
      const admins = await this.databaseService.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true },
      });

      for (const admin of admins) {
        await this.notificationsService.createNewApplicationNotification(
          application.title,
          application.user.name,
          application.id,
          admin.id,
        );
      }
    }

    return application;
  }

  async findAll(page: number = 1, limit: number = 10, status?: string) {
    const skip = (page - 1) * limit;
    const where = status ? { status: status as any } : {};
    
    const [applications, total] = await Promise.all([
      this.databaseService.application.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: true,
          reviews: {
            include: {
              reviewer: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.databaseService.application.count({ where }),
    ]);

    return {
      applications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findUserApplications(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const [applications, total] = await Promise.all([
      this.databaseService.application.findMany({
        where: { userId },
        skip,
        take: limit,
        include: {
          user: true,
          reviews: {
            include: {
              reviewer: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.databaseService.application.count({ where: { userId } }),
    ]);

    return {
      applications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const application = await this.databaseService.application.findUnique({
      where: { id },
      include: {
        user: true,
        reviews: {
          include: {
            reviewer: true,
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    return application;
  }

  async update(id: string, updateApplicationDto: UpdateApplicationDto, userId: string, userRole: string) {
    const application = await this.findOne(id);

    if (application.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('You can only update your own applications');
    }

    // Check if status is being updated
    const isStatusUpdate = updateApplicationDto.status && updateApplicationDto.status !== application.status;
    
    // Update the application
    const updatedApplication = await this.databaseService.application.update({
      where: { id },
      data: {
        ...updateApplicationDto,
        submittedAt: updateApplicationDto.status === 'SUBMITTED' ? new Date() : application.submittedAt,
      },
      include: {
        user: true,
        reviews: {
          include: {
            reviewer: true,
          },
        },
      },
    });

    // If status changed, create notifications
    if (isStatusUpdate && updateApplicationDto.status) {
      // ALWAYS notify the applicant about status changes on their own application
      await this.notificationsService.createApplicationStatusNotification(
        id,
        application.userId,
        updateApplicationDto.status,
        userRole === 'ADMIN' ? userId : undefined,
      );

      // If a draft application is being submitted by the user, notify all admins
      if (updateApplicationDto.status === 'SUBMITTED' && application.status === 'DRAFT' && userRole !== 'ADMIN') {
        const admins = await this.databaseService.user.findMany({
          where: { role: 'ADMIN' },
          select: { id: true },
        });

        for (const admin of admins) {
          await this.notificationsService.createNewApplicationNotification(
            application.title,
            application.user.name,
            id,
            admin.id,
          );
        }
      }
    }

    return updatedApplication;
  }

  async updateStatus(id: string, status: string, adminUserId?: string) {
    // First get the current application to check previous status
    const currentApplication = await this.databaseService.application.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!currentApplication) {
      throw new NotFoundException('Application not found');
    }

    // Update the application status
    const updatedApplication = await this.databaseService.application.update({
      where: { id },
      data: { 
        status: status as any,
        submittedAt: status === 'SUBMITTED' ? new Date() : undefined,
      },
      include: {
        user: true,
        reviews: {
          include: {
            reviewer: true,
          },
        },
      },
    });

    // Create notifications when status changes
    if (currentApplication.status !== status) {
      // ALWAYS notify the applicant about status changes on their own application
      // This ensures they get updates regardless of who made the change (admin or themselves)
      await this.notificationsService.createApplicationStatusNotification(
        id,
        currentApplication.userId,
        status,
        adminUserId,
      );

      // If a new application is submitted by a user (DRAFT -> SUBMITTED), notify all admins
      if (status === 'SUBMITTED' && currentApplication.status === 'DRAFT' && !adminUserId) {
        const admins = await this.databaseService.user.findMany({
          where: { role: 'ADMIN' },
          select: { id: true },
        });

        for (const admin of admins) {
          await this.notificationsService.createNewApplicationNotification(
            currentApplication.title,
            currentApplication.user.name,
            id,
            admin.id,
          );
        }
      }
    }

    return updatedApplication;
  }

  async remove(id: string, userId: string, userRole: string) {
    const application = await this.findOne(id);

    if (application.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('You can only delete your own applications');
    }

    return this.databaseService.application.delete({
      where: { id },
    });
  }

  // AI Review Integration Methods
  private async triggerAIReview(applicationId: string): Promise<void> {
    try {
      await this.aiServiceClient.processApplicationReview(applicationId);
    } catch (error) {
      console.error(`Failed to trigger AI review for application ${applicationId}:`, error);
      // Optionally, you could update the application status to indicate AI review failure
      // or create a notification for admins
    }
  }

  async getAIReviewStatus(applicationId: string, userId: string, userRole: string) {
    // Check if user has permission to view this application
    const application = await this.findOne(applicationId);
    
    if (application.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('You can only view your own applications');
    }

    try {
      return await this.aiServiceClient.getReviewStatus(applicationId);
    } catch (error) {
      throw new Error(`Failed to get AI review status: ${error.message}`);
    }
  }

  async retryAIReview(applicationId: string, reviewType: string, userId: string, userRole: string) {
    // Only admins can retry AI reviews
    if (userRole !== 'ADMIN') {
      throw new ForbiddenException('Only administrators can retry AI reviews');
    }

    try {
      return await this.aiServiceClient.retryReview(applicationId, reviewType);
    } catch (error) {
      throw new Error(`Failed to retry AI review: ${error.message}`);
    }
  }

  async submitApplication(applicationId: string, userId: string, userRole: string) {
    const application = await this.findOne(applicationId);
    
    // Check if user owns the application
    if (application.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('You can only submit your own applications');
    }

    // Check if application is in DRAFT status
    if (application.status !== 'DRAFT') {
      throw new Error('Only draft applications can be submitted');
    }

    // Update status to SUBMITTED
    const updatedApplication = await this.databaseService.application.update({
      where: { id: applicationId },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
      include: {
        user: true,
        reviews: {
          include: {
            reviewer: true,
          },
        },
      },
    });

    // Notify the user about successful submission
    await this.notificationsService.createApplicationStatusNotification(
      applicationId,
      userId,
      'SUBMITTED',
    );

    // Trigger AI review process (async, don't wait for completion)
    this.triggerAIReview(applicationId).catch(error => {
      console.error(`Failed to trigger AI review for application ${applicationId}:`, error);
    });

    // Notify all admins about the new application
    const admins = await this.databaseService.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });

    for (const admin of admins) {
      await this.notificationsService.createNewApplicationNotification(
        updatedApplication.title,
        updatedApplication.user.name,
        applicationId,
        admin.id,
      );
    }

    return updatedApplication;
  }
}
