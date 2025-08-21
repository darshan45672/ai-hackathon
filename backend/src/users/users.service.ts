import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private databaseService: DatabaseService) {}

  async findById(id: string) {
    return this.databaseService.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string) {
    return this.databaseService.user.findUnique({
      where: { email },
    });
  }

  async findOne(id: string) {
    const user = await this.databaseService.user.findUnique({
      where: { id },
      include: {
        applications: true,
        reviews: true,
        notifications: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findAll(page: number = 1, limit: number = 10, role?: string, search?: string) {
    const skip = (page - 1) * limit;
    
    const where: any = {};
    
    if (role) {
      where.role = role as UserRole;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.databaseService.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          applications: true,
          reviews: true,
          notifications: true,
        },
      }),
      this.databaseService.user.count({ where }),
    ]);

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAllUsers(page: number = 1, limit: number = 10) {
    return this.findAll(page, limit);
  }

  async update(id: string, updateData: {
    name?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  }) {
    const user = await this.findOne(id);
    
    return this.databaseService.user.update({
      where: { id },
      data: updateData,
      include: {
        applications: true,
        reviews: true,
        notifications: true,
      },
    });
  }

  async updateRole(id: string, role: UserRole) {
    const user = await this.findOne(id);
    
    return this.databaseService.user.update({
      where: { id },
      data: { role },
      include: {
        applications: true,
        reviews: true,
        notifications: true,
      },
    });
  }

  async updateUserRole(id: string, role: string) {
    return this.updateRole(id, role as UserRole);
  }

  async remove(id: string) {
    const user = await this.findOne(id);
    
    return this.databaseService.user.delete({
      where: { id },
    });
  }
}
