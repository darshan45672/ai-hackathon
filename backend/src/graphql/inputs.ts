import { InputType, Field, ID } from '@nestjs/graphql';
import { IsEmail, IsString, IsOptional, IsArray, IsNumber, IsEnum, Min, Max, IsBoolean } from 'class-validator';
import { ApplicationStatus, ReviewType } from '@prisma/client';

// User Inputs
@InputType()
export class CreateUserInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @IsString()
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  firstName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  lastName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  avatar?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  password?: string;
}

@InputType()
export class UpdateUserInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  firstName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  lastName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  avatar?: string;
}

// Application Inputs
@InputType()
export class CreateApplicationInput {
  @Field()
  @IsString()
  title: string;

  @Field()
  @IsString()
  description: string;

  @Field()
  @IsString()
  problemStatement: string;

  @Field()
  @IsString()
  solution: string;

  @Field(() => [String])
  @IsArray()
  @IsString({ each: true })
  techStack: string[];

  @Field()
  @IsNumber()
  @Min(1)
  teamSize: number;

  @Field(() => [String])
  @IsArray()
  @IsString({ each: true })
  teamMembers: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  githubRepo?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  demoUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedCost?: number;

  @Field(() => ApplicationStatus, { nullable: true })
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;
}

@InputType()
export class UpdateApplicationInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  title?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  problemStatement?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  solution?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  techStack?: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  teamSize?: number;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  teamMembers?: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  githubRepo?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  demoUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedCost?: number;

  @Field(() => ApplicationStatus, { nullable: true })
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  category?: string;
}

// Review Inputs
@InputType()
export class CreateReviewInput {
  @Field()
  @IsString()
  applicationId: string;

  @Field()
  @IsNumber()
  @Min(1)
  @Max(10)
  score: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  feedback?: string;
}

@InputType()
export class UpdateReviewInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  score?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  feedback?: string;
}

// AI Review Inputs
@InputType()
export class CreateAIReviewInput {
  @Field()
  @IsString()
  applicationId: string;

  @Field(() => ReviewType)
  @IsEnum(ReviewType)
  type: ReviewType;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  score?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  feedback?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  metadata?: string;
}

// Notification Inputs
@InputType()
export class MarkNotificationReadInput {
  @Field()
  @IsString()
  notificationId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  read?: boolean;
}

// Pagination Inputs
@InputType()
export class PaginationInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  first?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  after?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  last?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  before?: string;
}

// Filter Inputs
@InputType()
export class UserFilterInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  role?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  search?: string; // Search in name, email, firstName, lastName
}

@InputType()
export class ApplicationFilterInput {
  @Field(() => ApplicationStatus, { nullable: true })
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  userId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  category?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  search?: string; // Search in title, description, problemStatement
}

@InputType()
export class ReviewFilterInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  applicationId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  reviewerId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  minScore?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  maxScore?: number;
}

@InputType()
export class NotificationFilterInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  read?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  userId?: string;
}
