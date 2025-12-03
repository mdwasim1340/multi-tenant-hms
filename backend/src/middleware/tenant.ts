import { Request, Response, NextFunction } from 'express';
import pool from '../database';

export const tenantMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const tenantId = req.headers['x-tenant-id'] as string;

  if (!tenantId) {
    return res.status(400).json({ message: 'X-Tenant-ID header is required' });
  }

  const client = await pool.connect();

  try {
    // Ensure schema name has tenant_ prefix
    const schemaName = tenantId.startsWith('tenant_') ? tenantId : `tenant_${tenantId}`;
    await client.query(`SET search_path TO "${schemaName}", public`);
    req.dbClient = client;

    res.on('finish', () => {
      client.release();
    });

    next();
  } catch (error) {
    console.error('Tenant middleware error:', error);
    client.release();
    res.status(500).json({ message: 'Failed to set tenant context' });
  }
};
