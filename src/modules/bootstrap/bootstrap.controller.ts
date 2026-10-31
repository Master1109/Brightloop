import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { BootstrapService } from './bootstrap.service';

@ApiTags('bootstrap')
@UseGuards(JwtAuthGuard)
@Controller('api')
export class BootstrapController {
  constructor(private readonly bootstrapService: BootstrapService) {}

  @Get('bootstrap')
  @ApiOperation({ summary: 'Get workspace bootstrap data (user, records, team)' })
  @ApiResponse({
    schema: {
      example: {
        user: { id: 'uuid', email: 'admin@brightloop.local', role: 'ADMIN' },
        records: [],
        team: [],
        demo: false,
      },
    },
  })
  async bootstrap(@Req() req: Request) {
    const user = req.user as any;
    return this.bootstrapService.getBootstrap(user.userId);
  }
}
