import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getStatus() {
    return {
      name: 'Brightloop API',
      version: '1.0.0',
      description: 'Subscription Management System API',
      docs: '/v1/api',
    };
  }
}
