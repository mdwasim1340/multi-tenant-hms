import { Request, Response } from 'express';
import pool from '../database';
import { subscriptionService } from './subscription';
import { validateSubdomain, suggestAlternatives } from '../utils/subdomain-validator';
import { subdomainCache } from './subdomain-cache';
// Migration runner will be handled separately
// const runner = require('node-pg-migrate');

export const getAllTenants = async (req: Request, res: Response) => {
  try {
    // Query the main database (public schema) for tenants table
    const result = await pool.query('SELECT * FROM public.tenants ORDER BY name');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching tenants:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createTenant = async (req: Request, res: Response) => {
  let { id, name, email, plan, status, subdomain } = req.body;

  // Auto-generate ID if not provided
  if (!id) {
    id = `tenant_${Date.now()}`;
  }

  // Validate required fields (id is now guaranteed to exist)
  if (!name || !email || !plan || !status) {
    return res.status(400).json({ message: 'Missing required fields: name, email, plan, and status are required' });
  }

  // Validate subdomain if provided
  if (subdomain) {
    const validation = validateSubdomain(subdomain);
    if (!validation.valid) {
      return res.status(400).json({ 
        message: validation.error,
        code: validation.code 
      });
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Check if subdomain already exists
    if (subdomain) {
      const existingSubdomain = await client.query(
        'SELECT id FROM public.tenants WHERE subdomain = $1',
        [subdomain.toLowerCase().trim()]
      );
      
      if (existingSubdomain.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ 
          message: `The subdomain "${subdomain}" is already taken. Please choose another.`,
          code: 'SUBDOMAIN_TAKEN'
        });
      }
    }
    
    // First, insert the tenant record with subdomain
    const insertQuery = subdomain
      ? 'INSERT INTO public.tenants (id, name, email, plan, status, subdomain) VALUES ($1, $2, $3, $4, $5, $6)'
      : 'INSERT INTO public.tenants (id, name, email, plan, status) VALUES ($1, $2, $3, $4, $5)';
    
    const insertValues = subdomain
      ? [id, name, email, plan, status, subdomain.toLowerCase().trim()]
      : [id, name, email, plan, status];
    
    await client.query(insertQuery, insertValues);
    
    // Then create the schema
    await client.query(`CREATE SCHEMA "${id}"`);
    
    // Finally, assign default subscription (Basic tier) - now that tenant exists
    // Create subscription directly in the same transaction
    await client.query(`
      INSERT INTO tenant_subscriptions (
        tenant_id, tier_id, usage_limits, billing_cycle, status
      )
      VALUES ($1, $2, $3, $4, $5)
    `, [
      id, 
      'basic', 
      JSON.stringify({ max_patients: 500, max_users: 5, storage_gb: 10, api_calls_per_day: 1000 }),
      'monthly',
      'active'
    ]);
    
    // Create default branding record for the tenant
    await client.query(`
      INSERT INTO tenant_branding (
        tenant_id, primary_color, secondary_color, accent_color
      )
      VALUES ($1, $2, $3, $4)
    `, [id, '#1e40af', '#3b82f6', '#60a5fa']);
    
    await client.query('COMMIT');
    
    console.log(`✅ Tenant created successfully: ${name} (${id})${subdomain ? ` with subdomain: ${subdomain}` : ''}`);
    
    res.status(201).json({ 
      message: `Tenant ${name} created successfully`,
      tenant_id: id,
      subscription: 'basic',
      subdomain: subdomain || null
    });
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
  const { name, email, plan, status, subdomain } = req.body;

  // Build dynamic update query based on provided fields
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (name) {
    updates.push(`name = $${paramCount}`);
    values.push(name);
    paramCount++;
  }

  if (email) {
    updates.push(`email = $${paramCount}`);
    values.push(email);
    paramCount++;
  }

  if (plan) {
    updates.push(`plan = $${paramCount}`);
    values.push(plan);
    paramCount++;
  }

  if (status) {
    updates.push(`status = $${paramCount}`);
    values.push(status);
    paramCount++;
  }

  if (subdomain !== undefined) {
    // Validate subdomain if provided
    if (subdomain) {
      const validation = validateSubdomain(subdomain);
      if (!validation.valid) {
        return res.status(400).json({ 
          message: validation.error,
          code: validation.code 
        });
      }

      // Check if subdomain is already taken by another tenant
      const existingSubdomain = await pool.query(
        'SELECT id FROM public.tenants WHERE subdomain = $1 AND id != $2',
        [subdomain.toLowerCase().trim(), id]
      );

      if (existingSubdomain.rows.length > 0) {
        return res.status(409).json({ 
          message: `The subdomain "${subdomain}" is already taken. Please choose another.`,
          code: 'SUBDOMAIN_TAKEN'
        });
      }
    }

    updates.push(`subdomain = $${paramCount}`);
    values.push(subdomain ? subdomain.toLowerCase().trim() : null);
    paramCount++;
  }

  if (updates.length === 0) {
    return res.status(400).json({ message: 'No fields to update' });
  }

  // Add tenant ID as the last parameter
  values.push(id);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Update tenant
    const query = `UPDATE public.tenants SET ${updates.join(', ')} WHERE id = $${paramCount}`;
    const result = await client.query(query, values);

    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // If subdomain was updated, invalidate cache
    if (subdomain !== undefined) {
      const { subdomainCache } = await import('./subdomain-cache');
      if (subdomain) {
        // Cache will be populated on next lookup
        console.log(`🔄 Subdomain updated for tenant ${id}: ${subdomain}`);
      } else {
        console.log(`🔄 Subdomain removed for tenant ${id}`);
      }
    }

    await client.query('COMMIT');
    
    res.status(200).json({ 
      message: `Tenant ${name || id} updated successfully`,
      subdomain: subdomain || null
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating tenant:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
};

export const deleteTenant = async (req: Request, res: Response) => {
  const { id } = req.params;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`DROP SCHEMA "${id}" CASCADE`);
    await client.query('DELETE FROM public.tenants WHERE id = $1', [id]);
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

/**
 * Resolve subdomain to tenant information
 * Requirements: 4.1, 4.2, 4.3
 * 
 * GET /api/tenants/by-subdomain/:subdomain
 */
export const getTenantBySubdomain = async (req: Request, res: Response) => {
  const { subdomain } = req.params;

  try {
    // Validate subdomain format
    const validation = validateSubdomain(subdomain);
    if (!validation.valid) {
      console.log(`❌ Invalid subdomain format: ${subdomain} - ${validation.error}`);
      return res.status(400).json({
        error: validation.error,
        code: validation.code,
        suggestions: suggestAlternatives(subdomain),
      });
    }

    // Normalize subdomain
    const normalizedSubdomain = subdomain.toLowerCase().trim();

    // Check cache first
    const cachedTenantId = await subdomainCache.get(normalizedSubdomain);
    if (cachedTenantId) {
      // Get full tenant info from database
      const result = await pool.query(
        `SELECT 
          t.id as tenant_id,
          t.name,
          t.status,
          CASE WHEN tb.tenant_id IS NOT NULL THEN true ELSE false END as branding_enabled
        FROM tenants t
        LEFT JOIN tenant_branding tb ON t.id = tb.tenant_id
        WHERE t.id = $1 AND t.status = 'active'`,
        [cachedTenantId]
      );

      if (result.rows.length > 0) {
        console.log(`✅ Subdomain resolved (from cache): ${normalizedSubdomain} → ${cachedTenantId}`);
        return res.status(200).json(result.rows[0]);
      }
    }

    // Cache miss or invalid cached data - query database
    const result = await pool.query(
      `SELECT 
        t.id as tenant_id,
        t.name,
        t.status,
        CASE WHEN tb.tenant_id IS NOT NULL THEN true ELSE false END as branding_enabled
      FROM tenants t
      LEFT JOIN tenant_branding tb ON t.id = tb.tenant_id
      WHERE t.subdomain = $1 AND t.status = 'active'`,
      [normalizedSubdomain]
    );

    if (result.rows.length === 0) {
      // Subdomain not found
      console.log(`❌ Subdomain not found: ${normalizedSubdomain}`);
      
      // Log for monitoring
      console.log(`[SUBDOMAIN_LOOKUP_FAILED] subdomain=${normalizedSubdomain} timestamp=${new Date().toISOString()}`);
      
      return res.status(404).json({
        error: 'Hospital not found',
        message: `No hospital found with subdomain '${normalizedSubdomain}'. Please check your URL.`,
        code: 'SUBDOMAIN_NOT_FOUND',
        suggestions: [
          'Verify the subdomain spelling',
          'Contact your hospital administrator',
          'Visit the main website to find your hospital',
        ],
      });
    }

    const tenant = result.rows[0];

    // Cache the result
    await subdomainCache.set(normalizedSubdomain, tenant.tenant_id);

    console.log(`✅ Subdomain resolved (from database): ${normalizedSubdomain} → ${tenant.tenant_id}`);
    
    return res.status(200).json(tenant);
  } catch (error) {
    console.error('Error resolving subdomain:', error);
    
    // Log error for monitoring
    console.log(`[SUBDOMAIN_RESOLUTION_ERROR] subdomain=${subdomain} error=${error} timestamp=${new Date().toISOString()}`);
    
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to resolve subdomain. Please try again later.',
      code: 'SUBDOMAIN_RESOLUTION_ERROR',
    });
  }
};
