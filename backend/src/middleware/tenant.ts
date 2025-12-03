import { Request, Response, NextFunction } from 'express';
import pool from '../database';

export const tenantMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const tenantId = req.headers['x-tenant-id'] as string;

  if (!tenantId) {
    return res.status(400).json({ message: 'X-Tenant-ID header is required' });
  }

  const client = await pool.connect();

  try {
    // Use tenant ID directly as schema name (schemas are named like 'sunrise_medical_center', 'aajmin_polyclinic')
    // Only add tenant_ prefix if the schema doesn't exist with the direct name
    const schemaName = tenantId;
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
