import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UserEntity } from '../../database/entities/user.entity';
import { EmailService } from '../email/email.service';
import { LoginDto, RegisterDto, ResendVerificationDto, VerifyEmailDto } from './auth.dto';
import { AuthTokens } from '@stockhome/shared';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async register(dto: RegisterDto): Promise<{ message: string }> {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const existing = await this.userRepo.findOneBy({ email: normalizedEmail });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    // Auto-generate username: firstname.lastname.XX
    const base = `${dto.firstName.toLowerCase().replace(/[^a-z0-9]/g, '')}.${dto.lastName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    const username = await this.generateUniqueUsername(base);

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const verificationToken = uuidv4();
    const tokenExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    const user = this.userRepo.create({
      id: uuidv4(),
      email: normalizedEmail,
      firstName: dto.firstName,
      lastName: dto.lastName,
      displayName: `${dto.firstName} ${dto.lastName}`,
      username,
      passwordHash,
      isEmailVerified: false,
      isAdmin: false,
      isBanned: false,
      emailVerificationToken: verificationToken,
      emailVerificationTokenExpiry: tokenExpiry,
      lastVerificationSentAt: new Date(),
    });
    await this.userRepo.save(user);

    await this.emailService.sendVerificationEmail(normalizedEmail, verificationToken);

    return { message: 'Account created. Please check your email to confirm your address.' };
  }

  async login(dto: LoginDto): Promise<{ tokens: AuthTokens; user: object }> {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const user = await this.userRepo.findOneBy({ email: normalizedEmail });

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isBanned) {
      throw new ForbiddenException('Your account has been suspended');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('EMAIL_NOT_VERIFIED');
    }

    const tokens = this.generateTokens(user);
    return {
      tokens,
      user: this.toUserDto(user),
    };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = this.jwtService.verify<{
        sub: string;
        username: string;
        isAdmin: boolean;
        type: string;
      }>(refreshToken, {
        secret: process.env['JWT_REFRESH_SECRET'] ?? 'dev_refresh_secret',
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const user = await this.userRepo.findOneBy({ id: payload.sub });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      if (user.isBanned) {
        throw new ForbiddenException('Your account has been suspended');
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<{ message: string }> {
    this.logger.debug(`Verifying token: "${dto.token}"`);
    const user = await this.userRepo.findOneBy({ emailVerificationToken: dto.token });
    this.logger.debug(`Token lookup result: ${user ? user.email : 'NOT FOUND'}`);
    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    if (user.emailVerificationTokenExpiry && user.emailVerificationTokenExpiry < new Date()) {
      throw new BadRequestException('Verification token has expired. Please request a new one.');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationTokenExpiry = null;
    await this.userRepo.save(user);

    return { message: 'Email verified successfully. You can now sign in.' };
  }

  async resendVerification(dto: ResendVerificationDto): Promise<{ message: string }> {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const user = await this.userRepo.findOneBy({ email: normalizedEmail });

    if (!user) {
      // Don't reveal if email exists
      return { message: 'If that email is registered, a confirmation link has been sent.' };
    }

    if (user.isEmailVerified) {
      return { message: 'Your email is already verified.' };
    }

    // 5-minute cooldown
    if (user.lastVerificationSentAt) {
      const elapsed = Date.now() - user.lastVerificationSentAt.getTime();
      if (elapsed < 5 * 60 * 1000) {
        const waitSeconds = Math.ceil((5 * 60 * 1000 - elapsed) / 1000);
        throw new BadRequestException(`Please wait ${waitSeconds} seconds before resending.`);
      }
    }

    const token = uuidv4();
    user.emailVerificationToken = token;
    user.emailVerificationTokenExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000);
    user.lastVerificationSentAt = new Date();
    await this.userRepo.save(user);

    await this.emailService.sendVerificationEmail(normalizedEmail, token);

    return { message: 'Confirmation email sent.' };
  }

  private generateTokens(user: UserEntity): AuthTokens {
    const payload = { sub: user.id, username: user.username, isAdmin: user.isAdmin };
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env['JWT_SECRET'] ?? 'dev_secret',
      expiresIn: '15m',
    });
    const refreshToken = this.jwtService.sign(
      { ...payload, type: 'refresh' },
      {
        secret: process.env['JWT_REFRESH_SECRET'] ?? 'dev_refresh_secret',
        expiresIn: '7d',
      },
    );
    return { accessToken, refreshToken };
  }

  toUserDto(user: UserEntity): object {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      displayName: user.displayName,
      isAdmin: user.isAdmin,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt.toISOString(),
    };
  }

  private async generateUniqueUsername(base: string): Promise<string> {
    // Try base first, then base.01, base.02, etc.
    const sanitized = base || 'user';
    let candidate = sanitized;
    let attempt = 0;

    while (await this.userRepo.findOneBy({ username: candidate })) {
      attempt++;
      candidate = `${sanitized}.${String(attempt).padStart(2, '0')}`;
    }

    return candidate;
  }
}
