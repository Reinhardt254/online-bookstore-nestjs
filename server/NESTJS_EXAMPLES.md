# NestJS Examples: Complete Code Walkthrough

This file contains detailed examples from your bookstore project with comprehensive explanations of each NestJS concept.

## 1. Main Application Entry Point

```typescript
// src/main.ts - Application Bootstrap
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
```

## 2. Root Module Configuration

```typescript
// src/app.module.ts - Root Module
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
```

## 3. Authentication Controller

```typescript
// src/auth/auth.controller.ts - Authentication Controller
import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '../database/schema';

/**
 * AuthController - Handles authentication-related HTTP requests
 *
 * This controller manages user authentication, registration, and profile management.
 * It uses various guards to protect routes and ensure proper authentication.
 *
 * Route prefix: /api/auth (set globally in main.ts)
 */
@Controller('auth')
export class AuthController {
  /**
   * Constructor with dependency injection
   * AuthService is automatically injected by NestJS DI container
   */
  constructor(private authService: AuthService) {}

  /**
   * POST /api/auth/login
   *
   * Handles user login with email/password
   * @UseGuards(LocalAuthGuard) - Applies local authentication strategy
   * @CurrentUser() - Custom decorator that extracts user from request
   * @Body() - Extracts and validates request body using LoginDto
   */
  @Post('login')
  @UseGuards(LocalAuthGuard) // Uses Passport local strategy for email/password auth
  async login(@CurrentUser() user: User, @Body() loginDto: LoginDto) {
    // user is already validated by LocalAuthGuard
    return this.authService.login(user);
  }

  /**
   * POST /api/auth/register
   *
   * Handles user registration
   * @Body() - Extracts and validates request body using RegisterDto
   */
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * GET /api/auth/google
   *
   * Initiates Google OAuth flow
   * @UseGuards(GoogleAuthGuard) - Applies Google OAuth strategy
   */
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // This endpoint initiates Google OAuth flow
    // The guard handles the OAuth redirect automatically
  }

  /**
   * GET /api/auth/google/callback
   *
   * Google OAuth callback endpoint
   * @UseGuards(GoogleAuthGuard) - Applies Google OAuth strategy
   * @Req() - Access to Express request object
   * @Res() - Access to Express response object
   */
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const result = req.user as any;

    // Redirect to frontend with access token
    // In a real application, you might redirect to your frontend with the token
    res.redirect(
      `http://localhost:3000/auth/success?token=${result.access_token}`,
    );
  }

  /**
   * GET /api/auth/profile
   *
   * Get current user profile (protected route)
   * @UseGuards(JwtAuthGuard) - Requires valid JWT token
   * @CurrentUser() - Custom decorator that extracts user from JWT
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard) // Requires valid JWT token in Authorization header
  async getProfile(@CurrentUser() user: User) {
    // Remove password from user object before returning
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * POST /api/auth/change-password
   *
   * Change user password (protected route)
   * @UseGuards(JwtAuthGuard) - Requires valid JWT token
   * @HttpCode(HttpStatus.OK) - Explicitly set HTTP status code to 200
   * @CurrentUser() - Custom decorator that extracts user from JWT
   * @Body() - Extracts and validates request body using ChangePasswordDto
   */
  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK) // Explicitly set HTTP status code
  async changePassword(
    @CurrentUser() user: User,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(
      user.id,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
    return { message: 'Password changed successfully' };
  }
}
```

## 4. Authentication Service

```typescript
// src/auth/auth.service.ts - Authentication Service
import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import { Database, DATABASE_CONNECTION } from '../database/database.module';
import { users, User, NewUser } from '../database/schema';

/**
 * JWT Payload interface - defines the structure of JWT token payload
 * This is what gets encoded in the JWT token
 */
export interface JwtPayload {
  sub: number; // Subject (user ID)
  email: string; // User email
  firstName?: string; // User first name
  lastName?: string; // User last name
}

/**
 * Login Response interface - defines the structure of login response
 * This is what gets returned when a user successfully logs in
 */
export interface LoginResponse {
  access_token: string; // JWT token for authentication
  user: Omit<User, 'password'>; // User data without password
}

/**
 * AuthService - Handles authentication business logic
 *
 * This service manages user authentication, registration, and password management.
 * It uses dependency injection to access database, JWT service, and configuration.
 *
 * @Injectable() decorator makes this class injectable by NestJS DI container
 */
@Injectable()
export class AuthService {
  /**
   * Constructor with dependency injection
   *
   * @param db - Database connection (injected by token)
   * @param jwtService - JWT service for token generation/validation
   * @param configService - Configuration service for environment variables
   */
  constructor(
    @Inject(DATABASE_CONNECTION) private db: Database,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Validates user credentials
   *
   * This method is used by the LocalAuthGuard to validate email/password
   *
   * @param email - User email
   * @param password - User password (plain text)
   * @returns User object if valid, null otherwise
   */
  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.findUserByEmail(email);
    // Compare password with hashed password in database
    if (
      user &&
      user.password &&
      (await bcrypt.compare(password, user.password))
    ) {
      return user;
    }
    return null;
  }

  /**
   * Logs in a user and generates JWT token
   *
   * @param user - User object (already validated)
   * @returns LoginResponse with JWT token and user data
   */
  async login(user: User): Promise<LoginResponse> {
    // Create JWT payload with user information
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    // Remove password from user object before returning
    const { password: _, ...userWithoutPassword } = user;

    return {
      access_token: this.jwtService.sign(payload), // Generate JWT token
      user: userWithoutPassword,
    };
  }

  /**
   * Registers a new user
   *
   * @param userData - User registration data
   * @returns LoginResponse with JWT token and user data
   */
  async register(userData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<LoginResponse> {
    // Check if user already exists
    const existingUser = await this.findUserByEmail(userData.email);
    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const newUser: NewUser = {
      email: userData.email,
      password: hashedPassword,
      firstName: userData.firstName,
      lastName: userData.lastName,
    };

    // Insert new user into database
    const [createdUser] = await this.db
      .insert(users)
      .values(newUser)
      .returning();
    return this.login(createdUser); // Return login response
  }

  /**
   * Handles Google OAuth login
   *
   * This method is called by GoogleAuthGuard when user authenticates with Google
   *
   * @param profile - Google OAuth profile data
   * @returns LoginResponse with JWT token and user data
   */
  async googleLogin(profile: any): Promise<LoginResponse> {
    const { id, emails, name, photos } = profile;
    const email = emails[0].value;

    // Try to find user by Google ID first
    let user = await this.findUserByGoogleId(id);

    if (!user) {
      // If not found by Google ID, try to find by email
      user = await this.findUserByEmail(email);
      if (user) {
        // Link Google account to existing user
        await this.db
          .update(users)
          .set({ googleId: id, avatar: photos[0]?.value })
          .where(eq(users.id, user.id));
        user.googleId = id;
        user.avatar = photos[0]?.value;
      } else {
        // Create new user with Google account
        const newUser: NewUser = {
          email,
          googleId: id,
          firstName: name.givenName,
          lastName: name.familyName,
          avatar: photos[0]?.value,
        };
        [user] = await this.db.insert(users).values(newUser).returning();
      }
    }

    return this.login(user);
  }

  /**
   * Finds user by email address
   *
   * @param email - User email
   * @returns User object or null
   */
  async findUserByEmail(email: string): Promise<User | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user || null;
  }

  /**
   * Finds user by Google ID
   *
   * @param googleId - Google OAuth ID
   * @returns User object or null
   */
  async findUserByGoogleId(googleId: string): Promise<User | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.googleId, googleId));
    return user || null;
  }

  /**
   * Finds user by ID
   *
   * @param id - User ID
   * @returns User object or null
   */
  async findUserById(id: number): Promise<User | null> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user || null;
  }

  /**
   * Changes user password
   *
   * @param userId - User ID
   * @param currentPassword - Current password (plain text)
   * @param newPassword - New password (plain text)
   */
  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.findUserById(userId);
    if (!user || !user.password) {
      throw new UnauthorizedException('User not found or no password set');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password and update database
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await this.db
      .update(users)
      .set({
        password: hashedNewPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }
}
```

## 5. JWT Strategy (Passport)

```typescript
// src/auth/strategies/jwt.strategy.ts - JWT Authentication Strategy
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService, JwtPayload } from '../auth.service';

/**
 * JwtStrategy - Handles JWT token validation
 *
 * This strategy is used by JwtAuthGuard to validate JWT tokens in requests.
 * It extends PassportStrategy and uses the 'jwt' strategy from passport-jwt.
 *
 * The strategy:
 * 1. Extracts JWT token from Authorization header
 * 2. Validates the token using the secret
 * 3. Calls validate() method with the decoded payload
 * 4. Returns user object if valid, throws UnauthorizedException if invalid
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    super({
      // Extract JWT token from Authorization header
      // Format: "Bearer <token>"
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // Don't ignore expired tokens (let them fail)
      ignoreExpiration: false,

      // Secret key for token validation
      secretOrKey: configService.get<string>('jwt.secret'),
    });
  }

  /**
   * Validates JWT payload and returns user
   *
   * This method is called by Passport after token is decoded.
   * It should return the user object or throw an exception.
   *
   * @param payload - Decoded JWT payload (JwtPayload interface)
   * @returns User object
   * @throws UnauthorizedException if user not found
   */
  async validate(payload: JwtPayload) {
    // Find user by ID from JWT payload
    const user = await this.authService.findUserById(payload.sub);

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
```

## 6. Custom Decorator

```typescript
// src/auth/decorators/current-user.decorator.ts - Custom Parameter Decorator
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * CurrentUser - Custom parameter decorator
 *
 * This decorator extracts the current user from the request object.
 * It's used in controllers to get the authenticated user without
 * manually accessing req.user.
 *
 * Usage: @CurrentUser() user: User
 *
 * @param data - Additional data (not used in this case)
 * @param ctx - Execution context containing request/response objects
 * @returns User object from request
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    // Get the HTTP request object
    const request = ctx.switchToHttp().getRequest();

    // Return the user object (set by authentication guards)
    return request.user;
  },
);
```

## 7. Database Module (Global)

```typescript
// src/database/database.module.ts - Global Database Module
import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createDatabaseConnection, Database } from './database';

// Custom token for database connection
export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';

/**
 * DatabaseModule - Global module for database connection
 *
 * This module provides database connection to the entire application.
 * It's marked as @Global() so it doesn't need to be imported in other modules.
 *
 * Features:
 * - Uses factory provider to create database connection
 * - Injects ConfigService to get database URL
 * - Exports database connection for use in other modules
 */
@Global() // Makes this module available everywhere without importing
@Module({
  imports: [ConfigModule], // Import ConfigModule to access environment variables
  providers: [
    {
      // Custom provider using factory pattern
      provide: DATABASE_CONNECTION, // Token for injection
      useFactory: (configService: ConfigService) => {
        // Get database URL from environment variables
        const databaseUrl = configService.get<string>('database.url');

        // Create and return database connection
        return createDatabaseConnection(databaseUrl);
      },
      inject: [ConfigService], // Dependencies for the factory
    },
  ],
  exports: [DATABASE_CONNECTION], // Export for use in other modules
})
export class DatabaseModule {}

export { Database };
```

## 8. Data Transfer Objects (DTOs)

```typescript
// src/auth/dto/auth.dto.ts - Authentication DTOs
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';

/**
 * LoginDto - Data transfer object for login requests
 *
 * This DTO defines the structure and validation rules for login requests.
 * The ValidationPipe will automatically validate incoming requests against this DTO.
 */
export class LoginDto {
  @IsEmail() // Must be a valid email format
  email: string;

  @IsString() // Must be a string
  @MinLength(6) // Must be at least 6 characters
  password: string;
}

/**
 * RegisterDto - Data transfer object for registration requests
 *
 * This DTO defines the structure and validation rules for registration requests.
 * It includes optional fields for user profile information.
 */
export class RegisterDto {
  @IsEmail() // Must be a valid email format
  email: string;

  @IsString() // Must be a string
  @MinLength(6) // Must be at least 6 characters
  @MaxLength(50) // Must be at most 50 characters
  password: string;

  @IsOptional() // Field is optional
  @IsString() // Must be a string if provided
  @MaxLength(50) // Must be at most 50 characters if provided
  firstName?: string;

  @IsOptional() // Field is optional
  @IsString() // Must be a string if provided
  @MaxLength(50) // Must be at most 50 characters if provided
  lastName?: string;
}
```

## 9. Guards

```typescript
// src/auth/guards/jwt-auth.guard.ts - JWT Authentication Guard
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JwtAuthGuard - JWT Authentication Guard
 *
 * This guard protects routes by requiring a valid JWT token.
 * It uses the 'jwt' Passport strategy to validate tokens.
 *
 * Usage:
 * - @UseGuards(JwtAuthGuard) on individual routes
 * - @UseGuards(JwtAuthGuard) on entire controllers
 *
 * The guard will:
 * 1. Extract JWT token from Authorization header
 * 2. Validate token using JwtStrategy
 * 3. Allow request if valid, return 401 if invalid
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

## 10. Configuration

```typescript
// src/config/configuration.ts - Application Configuration
/**
 * Configuration function - Loads and validates environment variables
 *
 * This function is used by ConfigModule to load configuration from environment variables.
 * It provides default values and type conversion for configuration values.
 *
 * @returns Configuration object with all application settings
 */
export default () => ({
  // Application settings
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database configuration
  database: {
    url:
      process.env.DATABASE_URL ||
      'postgresql://username:password@localhost:5432/bookstore',
  },

  // JWT configuration
  jwt: {
    secret:
      process.env.JWT_SECRET ||
      'your-super-secret-jwt-key-change-this-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // Google OAuth configuration
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || 'your-google-client-id',
    clientSecret:
      process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret',
    callbackUrl:
      process.env.GOOGLE_CALLBACK_URL ||
      'http://localhost:3000/auth/google/callback',
  },

  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
});
```

## Key Concepts Explained

### 1. Dependency Injection (DI)

- NestJS has a built-in DI container
- Services are automatically injected where needed
- Use `@Inject()` for custom tokens
- Use `@Optional()` for optional dependencies

### 2. Decorators

- `@Module()` - Defines a module
- `@Controller()` - Defines a controller
- `@Injectable()` - Makes a class injectable
- `@UseGuards()` - Applies guards to routes
- `@Body()`, `@Param()`, `@Query()` - Extract request data

### 3. Guards

- Run before route handlers
- Can prevent access to routes
- Used for authentication and authorization
- Can access request context

### 4. Pipes

- Transform and validate input data
- Can throw exceptions for invalid data
- Global pipes apply to all routes
- Built-in pipes: ValidationPipe, ParseIntPipe, etc.

### 5. Interceptors

- Transform response data
- Add logging, caching, etc.
- Can modify both request and response
- Use RxJS observables

### 6. Exception Filters

- Handle exceptions globally or per route
- Transform exceptions to consistent responses
- Can log errors and send notifications

### 7. Custom Decorators

- Extract metadata from requests
- Create reusable parameter decorators
- Use `createParamDecorator()` function

### 8. Configuration

- Use ConfigModule for environment variables
- Type-safe configuration with validation
- Global configuration available everywhere
- Environment-specific configuration

This comprehensive guide covers all the fundamental concepts of NestJS with real examples from your bookstore project. Each concept is explained with detailed comments to help you understand how everything works together.
