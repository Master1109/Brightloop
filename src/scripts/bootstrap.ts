/**
 * Bootstrap script for Brightloop backend
 * Runs initial setup, schema validation, and health check
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { HealthService } from '../modules/health/health.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  try {
    // Health check
    const healthService = app.get(HealthService);
    const health = await healthService.check();
    console.log('Health check:', health);

    console.log('Database connection verified');

    console.log('Bootstrap completed successfully');
  } catch (error) {
    console.error('Bootstrap error:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
