import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BootstrapController } from './bootstrap.controller';
import { BootstrapService } from './bootstrap.service';
import { Account, Subscription, Invoice, Payment, Plan, Product } from '../../entities/index';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Account,
      Subscription,
      Invoice,
      Payment,
      Plan,
      Product,
    ]),
  ],
  controllers: [BootstrapController],
  providers: [BootstrapService],
})
export class BootstrapModule {}
