import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';

@Injectable()
export class ApplicationsService {
  constructor(
    private databaseService: DatabaseService,
    private notificationsService: NotificationsService,
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

    // If the application is submitted directly (not as draft), create notifications
    if (application.status === 'SUBMITTED') {
      // Notify the user about successful submission
      await this.notificationsService.createApplicationStatusNotification(
        application.id,
        userId,
        'SUBMITTED',
      );

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

    return this.databaseService.application.update({
      where: { id },
      data: updateApplicationDto,
      include: {
        user: true,
        reviews: {
          include: {
            reviewer: true,
          },
        },
      },
    });
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
}
