import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    
    // Handle GraphQL context
    if (request) {
      return request.user;
    }
    
    // Handle GraphQL context
    const gqlContext = GqlExecutionContext.create(ctx);
    const { req } = gqlContext.getContext();
    return req.user;
  },
);
