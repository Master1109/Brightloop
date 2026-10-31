import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('root')
@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      name: 'Brightloop API',
      version: '1.0.0',
      description: 'Subscription Management System API',
      docs: '/v1/api',
    };
  }
}
