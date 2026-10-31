import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { BootstrapModule } from './modules/bootstrap/bootstrap.module';
import { RecordsModule } from './modules/records/records.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import {
  Account,
  StaffProfile,
  CustomerProfile,
  Product,
  ProductVariant,
  Plan,
  Subscription,
  SubscriptionLine,
  QuotationTemplate,
  QuotationTemplateLine,
  TaxRule,
  Discount,
  Invoice,
  InvoiceLine,
  Payment,
  AuditLog,
} from './entities/index';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'brightloop',
      entities: [
        Account,
        StaffProfile,
        CustomerProfile,
        Product,
        ProductVariant,
        Plan,
        Subscription,
        SubscriptionLine,
        QuotationTemplate,
        QuotationTemplateLine,
        TaxRule,
        Discount,
        Invoice,
        InvoiceLine,
        Payment,
        AuditLog,
      ],
      synchronize: process.env.NODE_ENV === 'development',
      logging: process.env.LOG_LEVEL === 'debug',
      ssl: process.env.NODE_ENV === 'production',
    }),
    HealthModule,
    AuthModule,
    BootstrapModule,
    RecordsModule,
    InvoicesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
