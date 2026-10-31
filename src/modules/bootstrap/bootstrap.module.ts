import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BootstrapController } from './bootstrap.controller';
import { BootstrapService } from './bootstrap.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthModule } from '../auth/auth.module';
import {
  Account,
  Invoice,
  InvoiceLine,
  Payment,
  Plan,
  Product,
  Subscription,
  SubscriptionLine,
} from '../../entities/index';

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
    ]),
  ],
  controllers: [BootstrapController],
  providers: [BootstrapService, JwtAuthGuard],
})
export class BootstrapModule {}
