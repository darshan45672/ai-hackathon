import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) {
      return true;
    }
    
    // Get user from either HTTP or GraphQL context
    let user;
    const request = context.switchToHttp().getRequest();
    
    if (request) {
      user = request.user;
    } else {
      // Handle GraphQL context
      const gqlContext = GqlExecutionContext.create(context);
      const { req } = gqlContext.getContext();
      user = req.user;
    }
    
    return requiredRoles.some((role) => user?.role === role);
  }
}
