import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User, UserConnection } from '../graphql/models';
import { 
  CreateUserInput, 
  UpdateUserInput, 
  PaginationInput, 
  UserFilterInput 
} from '../graphql/inputs';
import { UsersService } from './users.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  // Helper method to convert Prisma user to GraphQL User
  private mapToGraphQLUser(prismaUser: any): User {
    return {
      ...prismaUser,
      firstName: prismaUser.firstName || undefined,
      lastName: prismaUser.lastName || undefined,
      avatar: prismaUser.avatar || undefined,
      provider: prismaUser.provider || undefined,
      providerId: prismaUser.providerId || undefined,
    };
  }

  @Query(() => UserConnection)
  @Roles('ADMIN')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async users(
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
    @Args('filter', { nullable: true }) filter?: UserFilterInput,
  ): Promise<UserConnection> {
    const page = pagination?.first ? Math.ceil((pagination.first || 10) / 10) : 1;
    const limit = pagination?.first || 10;
    
    const result = await this.usersService.findAll(page, limit, filter?.role, filter?.search);
    const mappedUsers = result.users.map(user => this.mapToGraphQLUser(user));

    return {
      nodes: mappedUsers,
      pageInfo: {
        hasNextPage: page * limit < result.total,
        hasPreviousPage: page > 1,
        startCursor: mappedUsers.length > 0 ? mappedUsers[0].id : undefined,
        endCursor: mappedUsers.length > 0 ? mappedUsers[mappedUsers.length - 1].id : undefined,
      },
      totalCount: result.total,
    };
  }

  @Query(() => User, { nullable: true })
  @UseGuards(AuthGuard('jwt'))
  async user(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() currentUser: User,
  ): Promise<User> {
    // Users can only view their own profile unless they're admin
    if (currentUser.role !== 'ADMIN' && currentUser.id !== id) {
      throw new ForbiddenException('You can only view your own profile');
    }

    const user = await this.usersService.findOne(id);
    return this.mapToGraphQLUser(user);
  }

  @Query(() => User)
  @UseGuards(AuthGuard('jwt'))
  async me(@CurrentUser() user: User): Promise<User> {
    const fullUser = await this.usersService.findOne(user.id);
    return this.mapToGraphQLUser(fullUser);
  }

  @Mutation(() => User)
  @UseGuards(AuthGuard('jwt'))
  async updateProfile(
    @Args('input') input: UpdateUserInput,
    @CurrentUser() user: User,
  ): Promise<User> {
    const updatedUser = await this.usersService.update(user.id, {
      name: input.name,
      firstName: input.firstName,
      lastName: input.lastName,
      avatar: input.avatar,
    });
    return this.mapToGraphQLUser(updatedUser);
  }

  @Mutation(() => User)
  @Roles('ADMIN')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async updateUserRole(
    @Args('id', { type: () => ID }) id: string,
    @Args('role') role: string,
  ): Promise<User> {
    const updatedUser = await this.usersService.updateRole(id, role as any);
    return this.mapToGraphQLUser(updatedUser);
  }

  @Mutation(() => Boolean)
  @Roles('ADMIN')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async deleteUser(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    await this.usersService.remove(id);
    return true;
  }
}
