import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.withExtractors([
        (request) => {
          if (!request) return null;
          const authHeader = request.headers.authorization || '';
          const token = authHeader.replace('Bearer ', '');
          if (token) return token;

          // Also check for apiToken pattern used by frontend
          const authToken = request.headers['authorization']?.toString();
          if (authToken?.startsWith('Bearer ')) {
            return authToken.substring(7);
          }

          return request?.headers?.['x-api-token'] || null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'brightloop-jwt-secret-default-change-me',
    });
  }

  async validate(payload: any) {
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
