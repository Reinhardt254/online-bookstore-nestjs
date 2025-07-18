import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import { Database, DATABASE_CONNECTION } from '../database/database.module';
import { users, User, NewUser } from '../database/schema';

export interface JwtPayload {
  sub: number;
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginResponse {
  access_token: string;
  user: Omit<User, 'password'>;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(DATABASE_CONNECTION) private db: Database,
    private jwtService: JwtService,
    private configService: ConfigService,
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;

    return {
      access_token: this.jwtService.sign(payload),
      user: userWithoutPassword,
    };
  }

  async register(userData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<LoginResponse> {
    const existingUser = await this.findUserByEmail(userData.email);
    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const newUser: NewUser = {
      email: userData.email,
      password: hashedPassword,
      firstName: userData.firstName,
      lastName: userData.lastName,
    };

    const [createdUser] = await this.db
      .insert(users)
      .values(newUser)
      .returning();
    return this.login(createdUser);
  }

  async googleLogin(profile: any): Promise<LoginResponse> {
    const { id, emails, name, photos } = profile;
    const email = emails[0].value;

    let user = await this.findUserByGoogleId(id);

    if (!user) {
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

  async findUserByEmail(email: string): Promise<User | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user || null;
  }

  async findUserByGoogleId(googleId: string): Promise<User | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.googleId, googleId));
    return user || null;
  }

  async findUserById(id: number): Promise<User | null> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user || null;
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.findUserById(userId);
    if (!user || !user.password) {
      throw new UnauthorizedException('User not found or no password set');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

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
