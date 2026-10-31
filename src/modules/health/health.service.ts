import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  check() {
    return {
      status: 'ok',
      demo: process.env.NODE_ENV === 'development',
      timestamp: new Date().toISOString(),
    };
  }
}
