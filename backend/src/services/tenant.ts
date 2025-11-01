import pool from '../database';
import { PoolClient } from 'pg';

// Import node-pg-migrate with require to avoid TypeScript issues
const runner = require('node-pg-migrate');

export const createTenant = async (tenantId: string) => {
  const client: PoolClient = await pool.connect();
  try {
    // Create schema for tenant
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${tenantId}"`);
    
    // Set search path to the new schema
    await client.query(`SET search_path TO "${tenantId}"`);
    
    // Create users table in the tenant schema
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log(`✅ Tenant '${tenantId}' created successfully`);

  } finally {
    client.release();
  }
};
