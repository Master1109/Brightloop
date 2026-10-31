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
import { databaseOptions } from './database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', 'backend/.env'],
    }),
    TypeOrmModule.forRoot(databaseOptions()),
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
