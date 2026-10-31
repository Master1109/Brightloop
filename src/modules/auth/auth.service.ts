import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from '../../entities/index';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as crypto from 'crypto';

interface ResetTokenRecord {
  token: string;
  expires: Date;
}

@Injectable()
export class AuthService {
  private resetTokens: Map<string, ResetTokenRecord> = new Map();

  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string) {
    const account = await this.accountRepository.findOne({
      where: { email: email.toLowerCase() },
    });
    if (!account || !account.is_active) {
      return null;
    }
    const isPasswordValid = await bcrypt.compare(
      pass,
      account.password_hash,
    );
    if (!isPasswordValid) {
      return null;
    }
    const { password_hash, ...result } = account;
    return result;
  }

  async login(user: any) {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
    };
    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
      token: accessToken,
      expiresIn: 3600,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const existing = await this.accountRepository.findOne({
      where: { email: registerDto.email.toLowerCase() },
    });
    if (existing) {
      throw new UnauthorizedException('Email already registered');
    }

    // Validate password strength
    if (!registerDto.password || registerDto.password.length <= 8) {
      throw new BadRequestException('Password must be more than 8 characters');
    }
    const hasUpper = /[A-Z]/.test(registerDto.password);
    const hasLower = /[a-z]/.test(registerDto.password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
      registerDto.password,
    );
    if (!hasUpper || !hasLower || !hasSpecial) {
      throw new BadRequestException(
        'Password must contain uppercase, lowercase, and a special character',
      );
    }

    const hashedPassword = await bcrypt.hash(
      registerDto.password,
      parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    );

    const account = this.accountRepository.create({
      email: registerDto.email.toLowerCase(),
      password_hash: hashedPassword,
      role: 'customer' as const,
      is_active: true,
    });

    const saved = await this.accountRepository.save(account);
    const { password_hash, ...result } = saved;

    return {
      message: 'Account created successfully',
      user: result,
    };
  }

  async forgotPassword(email: string) {
    const account = await this.accountRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (account) {
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      this.resetTokens.set(account.id, { token, expires });

      // Send email (placeholder - in production use actual SMTP)
      console.log(
        `Password reset link for ${account.email}: http://localhost:3000/reset-password?token=${token}`,
      );
    }

    return {
      message: 'Password reset instructions sent to your email',
    };
  }

  async resetPassword(resetDto: ResetPasswordDto) {
    const tokenEntry = Array.from(this.resetTokens.entries()).find(
      ([, record]) => record.token === resetDto.token,
    );

    if (!tokenEntry) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const [accountId, record] = tokenEntry;
    if (new Date() > record.expires) {
      this.resetTokens.delete(accountId);
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Validate new password
    if (!resetDto.password || resetDto.password.length <= 8) {
      throw new BadRequestException('Password must be more than 8 characters');
    }

    const hashedPassword = await bcrypt.hash(
      resetDto.password,
      parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    );

    await this.accountRepository.update(accountId, {
      password_hash: hashedPassword,
    });

    this.resetTokens.delete(accountId);
    return { message: 'Password reset successfully' };
  }
}
