# Bookstore NestJS Application

A comprehensive bookstore management system built with NestJS, featuring user authentication, book management, and order processing.

## Features

- **Authentication & Authorization**
  - JWT-based authentication
  - Google OAuth integration
  - User registration and login
  - Protected routes with guards

- **User Management**
  - User profiles with CRUD operations
  - User activation/deactivation
  - Google account linking

- **Book Management**
  - Complete book catalog with CRUD operations
  - Book search and filtering
  - Category and author-based filtering
  - Stock management
  - ISBN validation

- **Database**
  - PostgreSQL database with Drizzle ORM
  - Type-safe database operations
  - Database migrations and schema management

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: PassportJS with JWT and Google OAuth
- **Validation**: class-validator
- **Configuration**: @nestjs/config

## Prerequisites

- Node.js 18+
- PostgreSQL 13+
- pnpm (recommended) or npm

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd bookstore

# Install dependencies
pnpm install
```

## Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/bookstore"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Google OAuth Configuration
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:3000/auth/google/callback"

# Application Configuration
PORT=3000
NODE_ENV="development"

# CORS Configuration
CORS_ORIGIN="http://localhost:3000"
```

## Database Setup

1. Create a PostgreSQL database named `bookstore`
2. Update the `DATABASE_URL` in your `.env` file
3. Generate and run database migrations:

```bash
# Generate migration files
pnpm run db:generate

# Apply migrations to database
pnpm run db:migrate

# Or push schema directly (for development)
pnpm run db:push
```

## Running the Application

```bash
# Development mode
pnpm run start:dev

# Production mode
pnpm run start:prod

# Debug mode
pnpm run start:debug
```

The application will be available at `http://localhost:3000`

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login (email/password)
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/profile` - Get user profile (protected)
- `POST /api/auth/change-password` - Change user password (protected)

### User Endpoints

- `GET /api/users` - Get all users (protected)
- `GET /api/users/:id` - Get user by ID (protected)
- `PATCH /api/users/:id` - Update user (protected)
- `DELETE /api/users/:id` - Delete user (protected)
- `PATCH /api/users/:id/activate` - Activate user (protected)
- `PATCH /api/users/:id/deactivate` - Deactivate user (protected)

### Book Endpoints

- `GET /api/books` - Get all books
- `GET /api/books/:id` - Get book by ID
- `POST /api/books` - Create book (protected)
- `PATCH /api/books/:id` - Update book (protected)
- `DELETE /api/books/:id` - Delete book (protected)
- `GET /api/books/search?q=query` - Search books
- `GET /api/books/category/:category` - Get books by category
- `GET /api/books/author/:author` - Get books by author
- `GET /api/books/isbn/:isbn` - Get book by ISBN
- `PATCH /api/books/:id/stock` - Update book stock (protected)

## Database Commands

```bash
# Generate migration files
pnpm run db:generate

# Apply migrations to database
pnpm run db:migrate

# Push schema directly (for development)
pnpm run db:push

# Open Drizzle Studio (database browser)
pnpm run db:studio
```

## Testing

```bash
# Unit tests
pnpm run test

# E2E tests
pnpm run test:e2e

# Test coverage
pnpm run test:cov
```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs: `http://localhost:3000/auth/google/callback`
6. Copy the client ID and client secret to your `.env` file

## Project Structure

```
src/
├── auth/                 # Authentication module
│   ├── dto/             # Authentication DTOs
│   ├── guards/          # Authentication guards
│   ├── strategies/      # Passport strategies
│   └── auth.service.ts  # Authentication service
├── books/               # Books module
│   ├── dto/             # Book DTOs
│   └── books.service.ts # Book service
├── users/               # Users module
│   ├── dto/             # User DTOs
│   └── users.service.ts # User service
├── database/            # Database configuration
│   ├── schema.ts        # Database schema
│   └── database.ts      # Database connection
├── config/              # Configuration
│   └── configuration.ts # Environment configuration
└── main.ts             # Application entry point
```

## Security Considerations

- Change the JWT secret in production
- Use environment variables for sensitive data
- Implement rate limiting for authentication endpoints
- Validate and sanitize user inputs
- Use HTTPS in production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is [MIT licensed](LICENSE).
