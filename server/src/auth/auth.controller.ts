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
    console.log(loginDto);
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
