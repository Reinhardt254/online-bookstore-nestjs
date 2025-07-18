import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BooksModule } from './books/books.module';
import configuration from './config/configuration';

/**
 * AppModule - Root module of the NestJS application
 *
 * This is the main module that imports all other modules and configures
 * the application-wide providers and controllers.
 *
 * @Module decorator defines a module with its metadata:
 * - imports: Other modules this module depends on
 * - controllers: Controllers that belong to this module
 * - providers: Services and other providers
 * - exports: What this module makes available to other modules
 */

@Module({
  imports: [
    // ConfigModule.forRoot() loads environment variables from .env file
    // isGlobal: true makes the ConfigService available everywhere without importing
    // load: [configuration] loads our custom configuration function
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    // Import feature modules
    DatabaseModule, // Database connection and schema
    AuthModule, // Authentication and authorization
    UsersModule, // User management
    BooksModule, // Book management
  ],
  // Controllers handle HTTP requests
  controllers: [AppController],

  // Providers are services, repositories, factories, etc.
  providers: [
    AppService, // Basic application service

    // Global ValidationPipe - applies to all routes
    // This pipe validates incoming request data against DTOs
    {
      provide: APP_PIPE, // APP_PIPE is a special token for global pipes
      useValue: new ValidationPipe({
        whitelist: true, // Remove properties not in DTO
        forbidNonWhitelisted: true, // Throw error for non-whitelisted properties
        transform: true, // Transform payloads to DTO instances
        transformOptions: {
          enableImplicitConversion: true, // Enable automatic type conversion
        },
      }),
    },
  ],
})
export class AppModule {}
