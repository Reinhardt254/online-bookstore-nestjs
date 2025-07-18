# NestJS Fundamentals: Complete Guide

## Table of Contents

1. [Introduction to NestJS](#introduction-to-nestjs)
2. [Core Concepts](#core-concepts)
3. [Architecture Overview](#architecture-overview)
4. [Modules](#modules)
5. [Controllers](#controllers)
6. [Providers & Services](#providers--services)
7. [Dependency Injection](#dependency-injection)
8. [Guards](#guards)
9. [Interceptors](#interceptors)
10. [Pipes](#pipes)
11. [Exception Filters](#exception-filters)
12. [Middleware](#middleware)
13. [Custom Decorators](#custom-decorators)
14. [Configuration](#configuration)
15. [Database Integration](#database-integration)
16. [Authentication & Authorization](#authentication--authorization)
17. [Testing](#testing)
18. [Best Practices](#best-practices)

---
 
## Introduction to NestJS

NestJS is a progressive Node.js framework for building efficient, scalable, and maintainable server-side applications. It combines elements of Object-Oriented Programming (OOP), Functional Programming (FP), and Functional Reactive Programming (FRP).

### Key Features:

- **TypeScript First**: Built with TypeScript for better developer experience
- **Modular Architecture**: Built on top of Express.js but can work with any HTTP framework
- **Dependency Injection**: Built-in DI container for better testability
- **Decorators**: Uses decorators for metadata and configuration
- **Guards & Interceptors**: Built-in security and cross-cutting concerns

---

## Core Concepts

### 1. Decorators

Decorators are functions that modify classes, methods, properties, or parameters. They start with `@` and are used extensively in NestJS.

```typescript
// Example from: src/auth/auth.controller.ts
@Controller('auth') // Class decorator
export class AuthController {
  @Post('login') // Method decorator
  @UseGuards(LocalAuthGuard) // Method decorator
  async login(@Body() loginDto: LoginDto) {
    // Parameter decorator
    // Method implementation
  }
}
```

### 2. Metadata

NestJS uses reflection and metadata to understand your application structure at runtime.

---

## Architecture Overview

NestJS follows a modular architecture where each module encapsulates related functionality:

```
src/
├── app.module.ts          # Root module
├── auth/                  # Authentication module
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── guards/
│   ├── strategies/
│   └── dto/
├── users/                 # Users module
├── books/                 # Books module
└── database/              # Database module
```

---

## Modules

Modules are the basic building blocks of NestJS applications. They organize related functionality.

### Root Module

```typescript
// src/app.module.ts
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    BooksModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
  ],
})
export class AppModule {}
```

**Explanation:**

- `@Module()` decorator defines a module
- `imports`: Other modules this module depends on
- `controllers`: Controllers that belong to this module
- `providers`: Services and other providers
- `exports`: What this module makes available to other modules

### Feature Module

```typescript
// src/auth/auth.module.ts
@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiresIn'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy, LocalStrategy],
  exports: [AuthService], // Makes AuthService available to other modules
})
export class AuthModule {}
```

### Global Module

```typescript
// src/database/database.module.ts
@Global() // Makes this module available everywhere without importing
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: DATABASE_CONNECTION,
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('database.url');
        return createDatabaseConnection(databaseUrl);
      },
      inject: [ConfigService],
    },
  ],
  exports: [DATABASE_CONNECTION],
})
export class DatabaseModule {}
```

---

## Controllers

Controllers handle incoming HTTP requests and return responses to the client.

```typescript
// src/auth/auth.controller.ts
@Controller('auth') // Route prefix: /api/auth
export class AuthController {
  constructor(private authService: AuthService) {} // Dependency injection

  @Post('login') // POST /api/auth/login
  @UseGuards(LocalAuthGuard) // Apply authentication guard
  async login(@CurrentUser() user: User, @Body() loginDto: LoginDto) {
    return this.authService.login(user);
  }

  @Get('profile') // GET /api/auth/profile
  @UseGuards(JwtAuthGuard) // Protected route
  async getProfile(@CurrentUser() user: User) {
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK) // Explicit HTTP status code
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

**Key Concepts:**

- `@Controller()`: Defines a controller and route prefix
- `@Post()`, `@Get()`, `@Patch()`, `@Delete()`: HTTP method decorators
- `@Body()`: Extracts request body
- `@Param()`: Extracts route parameters
- `@Query()`: Extracts query parameters
- `@Headers()`: Extracts request headers
- `@UseGuards()`: Applies guards to routes

---

## Providers & Services

Providers are the fundamental concept in NestJS. They can be services, repositories, factories, helpers, etc.

### Service Example

```typescript
// src/auth/auth.service.ts
@Injectable() // Marks this class as injectable
export class AuthService {
  constructor(
    @Inject(DATABASE_CONNECTION) private db: Database, // Inject database
    private jwtService: JwtService, // Inject JWT service
    private configService: ConfigService, // Inject config service
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.findUserByEmail(email);
    if (
      user &&
      user.password &&
      (await bcrypt.compare(password, user.password))
    ) {
      return user;
    }
    return null;
  }

  async login(user: User): Promise<LoginResponse> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    const { password: _, ...userWithoutPassword } = user;

    return {
      access_token: this.jwtService.sign(payload),
      user: userWithoutPassword,
    };
  }
}
```

### Custom Provider Example

```typescript
// src/database/database.module.ts
export const DATABASE_CONNECTION = 'DATABASE_CONNECTION'; // Custom token

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: DATABASE_CONNECTION, // Custom provider
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('database.url');
        return createDatabaseConnection(databaseUrl);
      },
      inject: [ConfigService], // Dependencies for the factory
    },
  ],
  exports: [DATABASE_CONNECTION],
})
export class DatabaseModule {}
```

**Provider Types:**

1. **Class Providers**: Regular services (most common)
2. **Value Providers**: Simple values
3. **Factory Providers**: Complex objects that need configuration
4. **Async Providers**: Providers that need async initialization

---

## Dependency Injection

NestJS has a powerful built-in DI container that manages dependencies automatically.

### Constructor Injection

```typescript
// src/books/books.controller.ts
@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {} // Automatic injection
}
```

### Property Injection

```typescript
// src/auth/auth.service.ts
export class AuthService {
  @Inject(DATABASE_CONNECTION) // Inject by token
  private db: Database;
}
```

### Optional Dependencies

```typescript
@Injectable()
export class SomeService {
  constructor(
    @Optional() // Makes dependency optional
    @Inject('OPTIONAL_SERVICE')
    private optionalService?: SomeService,
  ) {}
}
```

---

## Guards

Guards determine whether a request should be handled by the route handler. They run before interceptors and pipes.

### Built-in Guards

```typescript
// src/auth/guards/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {} // Extends Passport guard
```

### Custom Guard

```typescript
// Example custom guard
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}
```

### Using Guards

```typescript
// src/auth/auth.controller.ts
@Controller('auth')
export class AuthController {
  @Get('profile')
  @UseGuards(JwtAuthGuard) // Apply guard to specific route
  async getProfile(@CurrentUser() user: User) {
    return user;
  }
}

// Or apply to entire controller
@Controller('users')
@UseGuards(JwtAuthGuard) // Apply to all routes in controller
export class UsersController {}
```

---

## Interceptors

Interceptors transform the result returned from a route handler. They can also transform exceptions thrown from a route handler.

### Built-in Interceptors

```typescript
// Logging interceptor example
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;

    const now = Date.now();
    return next.handle().pipe(
      tap(() => {
        console.log(`${method} ${url} ${Date.now() - now}ms`);
      }),
    );
  }
}
```

### Using Interceptors

```typescript
// Apply to specific route
@Get('books')
@UseInterceptors(LoggingInterceptor)
findAll() {
  return this.booksService.findAll();
}

// Apply globally in main.ts
app.useGlobalInterceptors(new LoggingInterceptor());
```

---

## Pipes

Pipes transform input data to the desired form and validate input data.

### Built-in Pipes

```typescript
// Validation pipe (global)
{
  provide: APP_PIPE,
  useValue: new ValidationPipe({
    whitelist: true, // Remove properties not in DTO
    forbidNonWhitelisted: true, // Throw error for non-whitelisted properties
    transform: true, // Transform payloads to DTO instances
    transformOptions: {
      enableImplicitConversion: true, // Enable automatic type conversion
    },
  }),
}
```

### Custom Pipe

```typescript
// ParseIntPipe example
@Injectable()
export class ParseIntPipe implements PipeTransform {
  transform(value: string, metadata: ArgumentMetadata) {
    const val = parseInt(value, 10);
    if (isNaN(val)) {
      throw new BadRequestException('Validation failed');
    }
    return val;
  }
}
```

### Using Pipes

```typescript
// src/books/books.controller.ts
@Get(':id')
findOne(@Param('id', ParseIntPipe) id: number) { // Parse string to number
  return this.booksService.findOne(id);
}
```

---

## Exception Filters

Exception filters handle exceptions thrown during request processing.

### Built-in Exceptions

```typescript
// src/books/books.service.ts
async findOne(id: number): Promise<Book> {
  const [book] = await this.db.select().from(books).where(eq(books.id, id));

  if (!book) {
    throw new NotFoundException(`Book with ID ${id} not found`); // Built-in exception
  }

  return book;
}
```

### Custom Exception Filter

```typescript
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: exception.message,
    });
  }
}
```

---

## Middleware

Middleware functions have access to the request and response objects, and the next middleware function.

### Custom Middleware

```typescript
// Logger middleware
export function logger(req: Request, res: Response, next: NextFunction) {
  console.log(`Request: ${req.method} ${req.url}`);
  next();
}
```

### Using Middleware

```typescript
// In main.ts
app.use(logger);

// Or apply to specific routes
app.use('/auth', authMiddleware);
```

---

## Custom Decorators

Decorators are functions that can be used to extract metadata from requests.

### Parameter Decorator

```typescript
// src/auth/decorators/current-user.decorator.ts
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user; // Extract user from request
  },
);
```

### Using Custom Decorators

```typescript
// src/auth/auth.controller.ts
@Get('profile')
@UseGuards(JwtAuthGuard)
async getProfile(@CurrentUser() user: User) { // Use custom decorator
  return user;
}
```

---

## Configuration

NestJS provides a configuration module for managing environment variables.

### Configuration Module

```typescript
// src/config/configuration.ts
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
});
```

### Using Configuration

```typescript
// src/app.module.ts
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Make config available everywhere
      load: [configuration], // Load configuration function
    }),
  ],
})
export class AppModule {}

// In service
@Injectable()
export class SomeService {
  constructor(private configService: ConfigService) {}

  someMethod() {
    const dbUrl = this.configService.get<string>('database.url');
    const port = this.configService.get<number>('port');
  }
}
```

---

## Database Integration

NestJS can work with any database through ORMs or query builders.

### Drizzle ORM Integration

```typescript
// src/database/schema.ts
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  password: varchar('password', { length: 255 }),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
});

// src/database/database.ts
export const createDatabaseConnection = (databaseUrl: string) => {
  const client = postgres(databaseUrl);
  return drizzle(client, { schema });
};
```

### Using Database in Services

```typescript
// src/users/users.service.ts
@Injectable()
export class UsersService {
  constructor(
    @Inject(DATABASE_CONNECTION) private db: Database, // Inject database
  ) {}

  async findAll(): Promise<Omit<User, 'password'>[]> {
    const allUsers = await this.db.select().from(users);
    return allUsers.map(({ password: _, ...user }) => user);
  }
}
```

---

## Authentication & Authorization

NestJS provides built-in support for authentication using Passport.js.

### JWT Strategy

```typescript
// src/auth/strategies/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.authService.findUserById(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
```

### Google OAuth Strategy

```typescript
// src/auth/strategies/google.strategy.ts
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    super({
      clientID: configService.get<string>('google.clientId'),
      clientSecret: configService.get<string>('google.clientSecret'),
      callbackURL: configService.get<string>('google.callbackUrl'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const result = await this.authService.googleLogin(profile);
      done(null, result);
    } catch (error) {
      done(error, null);
    }
  }
}
```

---

## Testing

NestJS provides excellent testing utilities.

### Unit Testing

```typescript
// src/auth/auth.service.spec.ts
describe('AuthService', () => {
  let service: AuthService;
  let mockJwtService: jest.Mocked<JwtService>;
  let mockDb: jest.Mocked<Database>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: DATABASE_CONNECTION,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

### E2E Testing

```typescript
// test/auth.e2e-spec.ts
describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/auth/login (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password' })
      .expect(401); // Should fail without proper setup
  });
});
```

---

## Best Practices

### 1. Module Organization

- Keep modules focused and cohesive
- Use feature modules for related functionality
- Export only what other modules need

### 2. Service Design

- Keep services focused on single responsibility
- Use dependency injection for external dependencies
- Make services testable

### 3. Error Handling

- Use built-in exceptions when possible
- Create custom exceptions for domain-specific errors
- Use exception filters for consistent error responses

### 4. Validation

- Use DTOs for input validation
- Enable whitelist and forbidNonWhitelisted in ValidationPipe
- Use class-validator decorators

### 5. Security

- Use guards for authentication and authorization
- Validate all inputs
- Use HTTPS in production
- Implement rate limiting

### 6. Performance

- Use interceptors for logging and monitoring
- Implement caching where appropriate
- Use async/await properly

### 7. Testing

- Write unit tests for services
- Write integration tests for controllers
- Use mocking for external dependencies

---

## Key Files in Your Bookstore Project

### 1. Main Application Files

- `src/main.ts` - Application entry point
- `src/app.module.ts` - Root module
- `src/app.controller.ts` - Root controller

### 2. Authentication

- `src/auth/auth.module.ts` - Authentication module
- `src/auth/auth.controller.ts` - Auth endpoints
- `src/auth/auth.service.ts` - Auth business logic
- `src/auth/strategies/` - Passport strategies
- `src/auth/guards/` - Authentication guards

### 3. Database

- `src/database/schema.ts` - Database schema
- `src/database/database.ts` - Database connection
- `src/database/database.module.ts` - Database module

### 4. Features

- `src/users/` - User management
- `src/books/` - Book management

### 5. Configuration

- `src/config/configuration.ts` - Environment configuration
- `.env.example` - Environment variables template

---

## Common Patterns

### 1. Repository Pattern

```typescript
@Injectable()
export class UserRepository {
  constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

  async findById(id: number): Promise<User | null> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user || null;
  }
}
```

### 2. Factory Pattern

```typescript
{
  provide: 'ASYNC_OPTIONS',
  useFactory: async (configService: ConfigService) => {
    const options = await someAsyncOperation();
    return options;
  },
  inject: [ConfigService],
}
```

### 3. Observer Pattern (with RxJS)

```typescript
@Injectable()
export class EventService {
  private events$ = new Subject<Event>();

  emit(event: Event) {
    this.events$.next(event);
  }

  onEvent(): Observable<Event> {
    return this.events$.asObservable();
  }
}
```

---

This guide covers the fundamental concepts of NestJS. The framework is designed to be scalable and maintainable, following SOLID principles and modern architectural patterns. The examples from your bookstore project demonstrate real-world usage of these concepts.

Remember:

- **Dependency Injection** is at the heart of NestJS
- **Decorators** provide metadata and configuration
- **Modules** organize your application
- **Guards, Interceptors, and Pipes** handle cross-cutting concerns
- **Testing** is built into the framework

Practice with the examples in your bookstore project to reinforce these concepts!
