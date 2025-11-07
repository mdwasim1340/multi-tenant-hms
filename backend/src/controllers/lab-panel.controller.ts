import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

export const getLabPanels = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const client = await pool.connect();
  
  try {
    await client.query(`SET search_path TO "${tenantId}"`);
    
    const result = await client.query(
      'SELECT * FROM lab_panels WHERE is_active = true ORDER BY panel_name'
    );
    
    res.json({
      success: true,
      data: { panels: result.rows }
    });
    
  } finally {
    client.release();
  }
});

export const getLabPanelById = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const panelId = parseInt(req.params.id);
  const client = await pool.connect();
  
  try {
    await client.query(`SET search_path TO "${tenantId}"`);
    
    const result = await client.query(
      'SELECT * FROM lab_panels WHERE id = $1',
      [panelId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Lab panel not found'
      });
    }
    
    res.json({
      success: true,
      data: { panel: result.rows[0] }
    });
    
  } finally {
    client.release();
  }
});
