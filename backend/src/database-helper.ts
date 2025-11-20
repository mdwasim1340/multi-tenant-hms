/**
 * Database Helper
 * Provides tenant-aware database query functions
 */

import pool from './database';
import { PoolClient } from 'pg';

/**
 * Execute a query with tenant schema context
 * This ensures the query runs in the correct tenant schema
 */
export async function queryWithTenant<T = any>(
  tenantId: string,
  queryText: string,
  values?: any[]
): Promise<{ rows: T[]; rowCount: number }> {
  const client = await pool.connect();
  
  try {
    // Set the schema context for this connection
    await client.query(`SET search_path TO "${tenantId}", public`);
    
    // Execute the actual query
    const result = await client.query(queryText, values);
    
    return result;
  } finally {
    // Always release the client back to the pool
    client.release();
  }
}

/**
 * Execute multiple queries in a transaction with tenant schema context
 */
export async function transactionWithTenant<T>(
  tenantId: string,
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    await client.query(`SET search_path TO "${tenantId}", public`);
    
    const result = await callback(client);
    
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
