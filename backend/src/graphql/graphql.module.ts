import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';

// Import resolvers
import { ApplicationsResolver } from '../applications/applications.resolver';
import { UsersResolver } from '../users/users.resolver';
import { ReviewsResolver } from '../reviews/reviews.resolver';

// Import modules that contain services
import { ApplicationsModule } from '../applications/applications.module';
import { UsersModule } from '../users/users.module';
import { ReviewsModule } from '../reviews/reviews.module';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
      introspection: true,
      formatError: (error) => {
        console.error('GraphQL Error:', error);
        return {
          message: error.message,
          code: error.extensions?.code,
          path: error.path,
        };
      },
      context: ({ req, res }) => ({ req, res }),
    }),
    ApplicationsModule,
    UsersModule,
    ReviewsModule,
  ],
  providers: [
    ApplicationsResolver,
    UsersResolver,
    ReviewsResolver,
  ],
  exports: [GraphQLModule],
})
export class GraphqlModule {}
