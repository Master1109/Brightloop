/**
 * Seed script for Brightloop backend
 * Creates initial demo/admin account and sample data
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Account } from '../entities/index';
import * as bcrypt from 'bcrypt';

async function seed() {
  const app = await NestFactory.create(AppModule);

  try {
    const accountRepo = app.get(getRepositoryToken(Account));

    // Check if admin already exists
    const existing = await accountRepo.findOne({
      where: { email: 'admin@brightloop.local' },
    });

    if (!existing) {
      const passwordHash = await bcrypt.hash('Brightloop!2026', 12);
      const admin = accountRepo.create({
        email: 'admin@brightloop.local',
        password_hash: passwordHash,
        role: 'admin',
        is_active: true,
      });
      await accountRepo.save(admin);
      console.log('Created admin account: admin@brightloop.local');
    }

    // Create demo customer
    const existingCustomer = await accountRepo.findOne({
      where: { email: 'customer@brightloop.local' },
    });

    if (!existingCustomer) {
      const passwordHash = await bcrypt.hash('Brightloop!2026', 12);
      const customer = accountRepo.create({
        email: 'customer@brightloop.local',
        password_hash: passwordHash,
        role: 'customer',
        is_active: true,
      });
      await accountRepo.save(customer);
      console.log('Created customer account: customer@brightloop.local');
    }

    console.log('Seed completed successfully');
  } catch (error) {
    console.error('Seed error:', error);
  } finally {
    await app.close();
  }
}

seed();
