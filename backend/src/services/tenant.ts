import { Request, Response } from 'express';
import pool from '../database';
// Migration runner will be handled separately
// const runner = require('node-pg-migrate');

export const getAllTenants = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM tenants');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching tenants:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createTenant = async (req: Request, res: Response) => {
  let { id, name, email, plan, status } = req.body;

  // Auto-generate ID if not provided
  if (!id) {
    id = `tenant_${Date.now()}`;
  }

  // Validate required fields (id is now guaranteed to exist)
  if (!name || !email || !plan || !status) {
    return res.status(400).json({ message: 'Missing required fields: name, email, plan, and status are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`CREATE SCHEMA "${id}"`);
    await client.query(
      'INSERT INTO tenants (id, name, email, plan, status) VALUES ($1, $2, $3, $4, $5)',
      [id, name, email, plan, status]
    );
    await client.query('COMMIT');
    res.status(201).json({ message: `Tenant ${name} created successfully` });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating tenant:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
};

export const updateTenant = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, plan, status } = req.body;

  if (!name || !email || !plan || !status) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    await pool.query(
      'UPDATE tenants SET name = $1, email = $2, plan = $3, status = $4 WHERE id = $5',
      [name, email, plan, status, id]
    );
    res.status(200).json({ message: `Tenant ${name} updated successfully` });
  } catch (error) {
    console.error('Error updating tenant:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteTenant = async (req: Request, res: Response) => {
  const { id } = req.params;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`DROP SCHEMA "${id}" CASCADE`);
    await client.query('DELETE FROM tenants WHERE id = $1', [id]);
    await client.query('COMMIT');
    res.status(200).json({ message: `Tenant ${id} deleted successfully` });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting tenant:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
};
