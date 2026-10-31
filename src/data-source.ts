import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { databaseOptions } from './database.config';

dotenv.config({ path: ['.env', 'backend/.env'] });

export default new DataSource(databaseOptions());
