import { DataSourceOptions } from 'typeorm';
import {
  Account,
  AuditLog,
  CustomerProfile,
  Discount,
  Invoice,
  InvoiceLine,
  Payment,
  Plan,
  Product,
  ProductVariant,
  QuotationTemplate,
  QuotationTemplateLine,
  StaffProfile,
  Subscription,
  SubscriptionLine,
  TaxRule,
} from './entities';

export function databaseOptions(): DataSourceOptions {
  const databaseUrl = process.env.DATABASE_URL;
  const useSsl =
    process.env.NODE_ENV === 'production' ||
    (databaseUrl !== undefined && /\.neon\.tech\b/i.test(databaseUrl));

  return {
    type: 'postgres',
    ...(databaseUrl
      ? { url: databaseUrl }
      : {
          host: process.env.DB_HOST || 'localhost',
          port: Number.parseInt(process.env.DB_PORT || '5432', 10),
          username: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME || 'brightloop',
        }),
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
    migrations: [`${__dirname}/migrations/*{.ts,.js}`],
    migrationsTableName: 'migrations',
    migrationsRun: true,
    synchronize: false,
    logging: process.env.LOG_LEVEL === 'debug',
    ssl: useSsl ? { rejectUnauthorized: true } : false,
  };
}
