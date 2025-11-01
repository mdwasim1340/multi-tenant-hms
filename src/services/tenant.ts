import pool from '../database';
import runner from 'node-pg-migrate';
import { PoolClient } from 'pg';
import { Client } from 'pg';

export const createTenant = async (tenantId: string) => {
  const client: PoolClient = await pool.connect();
  try {
    await client.query('CREATE SCHEMA $1', [tenantId]);

    await runner({
      dbClient: client as unknown as Client,
      dir: 'migrations',
      direction: 'up',
      migrationsTable: 'pgmigrations',
      schema: tenantId,
    });

  } finally {
    client.release();
  }
};
