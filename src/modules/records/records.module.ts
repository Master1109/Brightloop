import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecordsController } from './records.controller';
import { RecordsService } from './records.service';
import {
  Account,
  Subscription,
  Invoice,
  Payment,
  Plan,
  Product,
  SubscriptionLine,
  InvoiceLine,
  TaxRule,
  Discount,
  QuotationTemplate,
  QuotationTemplateLine,
  CustomerProfile,
  AuditLog,
} from '../../entities/index';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      Account,
      Subscription,
      Invoice,
      Payment,
      Plan,
      Product,
      SubscriptionLine,
      InvoiceLine,
      TaxRule,
      Discount,
      QuotationTemplate,
      QuotationTemplateLine,
      CustomerProfile,
      AuditLog,
    ]),
  ],
  controllers: [RecordsController],
  providers: [
    RecordsService,
    JwtAuthGuard,
    {
      provide: APP_GUARD,
      useExisting: RolesGuard,
    },
    RolesGuard,
  ],
})
export class RecordsModule {}
