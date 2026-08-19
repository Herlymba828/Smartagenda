import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

/**
 * Source de données TypeORM pour la CLI (migrations, génération de schéma).
 *
 * Ce fichier est distinct de la configuration dans app.module.ts :
 * - app.module.ts utilise les chemins `dist/**` (runtime compilé)
 * - data-source.ts utilise les chemins `src/**` (TypeScript brut via ts-node)
 *
 * Utilisé par les commandes :
 *   npm run migration:generate -- --name NomMigration
 *   npm run migration:run
 *   npm run migration:revert
 *
 * Note : les deux configurations doivent rester synchronisées si de nouvelles
 * entités ou migrations sont ajoutées.
 */
dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'smartagenda',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  // Chemins relatifs aux sources TypeScript — utilisés uniquement par ts-node (CLI)
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  subscribers: ['src/**/*.subscriber.ts'],
});
