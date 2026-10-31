import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Check API health and demo status' })
  @ApiResponse({
    schema: {
      example: {
        status: 'ok',
        demo: true,
        timestamp: '2024-01-01T00:00:00Z',
      },
    },
  })
  getHealth() {
    return this.healthService.check();
  }
}
