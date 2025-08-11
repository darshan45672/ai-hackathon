import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';

@Injectable()
export class ApplicationsService {
  constructor(private databaseService: DatabaseService) {}

  async create(createApplicationDto: CreateApplicationDto, userId: string) {
    return this.databaseService.application.create({
      data: {
        ...createApplicationDto,
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

  async updateStatus(id: string, status: string) {
    return this.databaseService.application.update({
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
