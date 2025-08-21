import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { UserRole, ApplicationStatus, ReviewType, ReviewResult, NotificationType } from '@prisma/client';

// Register enums for GraphQL
registerEnumType(UserRole, {
  name: 'UserRole',
});

registerEnumType(ApplicationStatus, {
  name: 'ApplicationStatus',
});

registerEnumType(ReviewType, {
  name: 'ReviewType',
});

registerEnumType(ReviewResult, {
  name: 'ReviewResult',
});

registerEnumType(NotificationType, {
  name: 'NotificationType',
});

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field({ nullable: true })
  avatar?: string;

  @Field(() => UserRole)
  role: UserRole;

  @Field({ nullable: true })
  provider?: string;

  @Field({ nullable: true })
  providerId?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => [Application], { nullable: true })
  applications?: Application[];

  @Field(() => [Review], { nullable: true })
  reviews?: Review[];

  @Field(() => [Notification], { nullable: true })
  notifications?: Notification[];
}

@ObjectType()
export class Application {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field()
  description: string;

  @Field()
  problemStatement: string;

  @Field()
  solution: string;

  @Field(() => [String])
  techStack: string[];

  @Field()
  teamSize: number;

  @Field(() => [String])
  teamMembers: string[];

  @Field({ nullable: true })
  githubRepo?: string;

  @Field({ nullable: true })
  demoUrl?: string;

  @Field(() => ApplicationStatus)
  status: ApplicationStatus;

  @Field({ nullable: true })
  submittedAt?: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field({ nullable: true })
  estimatedCost?: number;

  @Field({ nullable: true })
  category?: string;

  @Field({ nullable: true })
  rejectionReason?: string;

  @Field()
  isActive: boolean;

  @Field()
  userId: string;

  @Field(() => User)
  user: User;

  @Field(() => [Review], { nullable: true })
  reviews?: Review[];

  @Field(() => [AIReview], { nullable: true })
  aiReviews?: AIReview[];
}

@ObjectType()
export class Review {
  @Field(() => ID)
  id: string;

  @Field()
  score: number;

  @Field({ nullable: true })
  feedback?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field()
  applicationId: string;

  @Field(() => Application)
  application: Application;

  @Field()
  reviewerId: string;

  @Field(() => User)
  reviewer: User;
}

@ObjectType()
export class AIReview {
  @Field(() => ID)
  id: string;

  @Field(() => ReviewType)
  type: ReviewType;

  @Field(() => ReviewResult)
  result: ReviewResult;

  @Field({ nullable: true })
  score?: number;

  @Field({ nullable: true })
  feedback?: string;

  @Field({ nullable: true })
  metadata?: string; // JSON as string

  @Field({ nullable: true })
  errorMessage?: string;

  @Field({ nullable: true })
  processedAt?: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field()
  applicationId: string;

  @Field(() => Application)
  application: Application;
}

@ObjectType()
export class Notification {
  @Field(() => ID)
  id: string;

  @Field(() => NotificationType)
  type: NotificationType;

  @Field()
  title: string;

  @Field()
  message: string;

  @Field()
  read: boolean;

  @Field({ nullable: true })
  actionUrl?: string;

  @Field({ nullable: true })
  metadata?: string; // JSON as string

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field()
  userId: string;

  @Field(() => User)
  user: User;

  @Field({ nullable: true })
  senderId?: string;

  @Field(() => User, { nullable: true })
  sender?: User;
}

// Pagination types
@ObjectType()
export class PaginationInfo {
  @Field()
  hasNextPage: boolean;

  @Field()
  hasPreviousPage: boolean;

  @Field({ nullable: true })
  startCursor?: string;

  @Field({ nullable: true })
  endCursor?: string;
}

@ObjectType()
export class ApplicationConnection {
  @Field(() => [Application])
  nodes: Application[];

  @Field(() => PaginationInfo)
  pageInfo: PaginationInfo;

  @Field()
  totalCount: number;
}

@ObjectType()
export class UserConnection {
  @Field(() => [User])
  nodes: User[];

  @Field(() => PaginationInfo)
  pageInfo: PaginationInfo;

  @Field()
  totalCount: number;
}

@ObjectType()
export class ReviewConnection {
  @Field(() => [Review])
  nodes: Review[];

  @Field(() => PaginationInfo)
  pageInfo: PaginationInfo;

  @Field()
  totalCount: number;
}

@ObjectType()
export class NotificationConnection {
  @Field(() => [Notification])
  nodes: Notification[];

  @Field(() => PaginationInfo)
  pageInfo: PaginationInfo;

  @Field()
  totalCount: number;
}
