import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

/**
 * Bootstrap function - Entry point of the NestJS application
 * This function creates the NestJS application instance and starts the server
 */
async function bootstrap() {
  // Create the NestJS application instance
  // NestFactory.create() creates a new NestJS application
  // It takes the root module (AppModule) as a parameter
  const app = await NestFactory.create(AppModule);

  // Get the ConfigService instance from the application
  // This allows us to access environment variables and configuration
  const configService = app.get(ConfigService);

  // Enable CORS (Cross-Origin Resource Sharing)
  // This allows the frontend to make requests to the backend
  // origin: specifies which domains can access the API
  // credentials: allows cookies and authentication headers
  app.enableCors({
    origin: configService.get<string>('cors.origin'),
    credentials: true,
  });

  // Set global prefix for all routes
  // All routes will now start with /api
  // Example: /auth/login becomes /api/auth/login
  app.setGlobalPrefix('api');

  // Get the port from configuration (defaults to 3000)
  const port = configService.get<number>('port');

  // Start the HTTP server
  // This makes the application listen for incoming requests
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}`);
}

// Call the bootstrap function to start the application
bootstrap();
