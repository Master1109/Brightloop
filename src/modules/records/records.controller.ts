import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RecordsService } from './records.service';

@ApiTags('records')
@UseGuards(JwtAuthGuard)
@Controller('api/records')
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  @Get()
  @ApiOperation({ summary: 'List all records (or filter by kind)' })
  async list(@Query('kind') kind?: string) {
    if (kind) {
      return this.recordsService.listByKind(kind);
    }
    return this.recordsService.listAll();
  }

  @Post(':kind')
  @ApiOperation({ summary: 'Create a new record of a given kind' })
  async create(
    @Param('kind') kind: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.recordsService.create(kind, body, user.userId);
  }

  @Get(':kind/:id/history')
  @ApiOperation({ summary: 'Get history for a record' })
  async history(@Param('kind') kind: string, @Param('id') id: string) {
    return this.recordsService.getHistory(kind, id);
  }

  @Patch(':kind/:id')
  @ApiOperation({ summary: 'Update a record' })
  async update(
    @Param('kind') kind: string,
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.recordsService.update(kind, id, body, user.userId);
  }

  @Post(':kind/:id/action')
  @ApiOperation({ summary: 'Perform an action on a record' })
  async action(
    @Param('kind') kind: string,
    @Param('id') id: string,
    @Body() body: { action: string },
    @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.recordsService.performAction(kind, id, body.action, user.userId);
  }

  @Delete(':kind/:id')
  @ApiOperation({ summary: 'Delete a record' })
  async delete(
    @Param('kind') kind: string,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.recordsService.delete(kind, id, user.userId);
  }
}
