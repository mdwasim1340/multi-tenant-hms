/**
 * Branding Service
 * Purpose: Manage tenant branding configuration (colors, logos, custom CSS)
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */

import { Request, Response } from 'express';
import pool from '../database';
import { subdomainCache } from './subdomain-cache';

/**
 * Get branding configuration for a tenant
 * GET /api/tenants/:id/branding
 * Requirements: 9.1, 9.5
 */
export const getBranding = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Query branding configuration
    const result = await pool.query(
      `SELECT 
        tenant_id,
        logo_url,
        logo_small_url,
        logo_medium_url,
        logo_large_url,
        primary_color,
        secondary_color,
        accent_color,
        custom_css,
        created_at,
        updated_at
      FROM tenant_branding
      WHERE tenant_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      // Return default branding if no custom branding exists
      return res.status(200).json({
        tenant_id: id,
        logo_url: null,
        logo_small_url: null,
        logo_medium_url: null,
        logo_large_url: null,
        primary_color: '#1e40af',
        secondary_color: '#3b82f6',
        accent_color: '#60a5fa',
        custom_css: null,
        created_at: null,
        updated_at: null,
      });
    }

    console.log(`✅ Branding retrieved for tenant: ${id}`);
    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching branding:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch branding configuration',
      code: 'BRANDING_FETCH_ERROR',
    });
  }
};

/**
 * Update branding configuration for a tenant
 * PUT /api/tenants/:id/branding
 * Requirements: 9.2, 6.2, 9.6
 */
export const updateBranding = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { primary_color, secondary_color, accent_color, custom_css } = req.body;

  try {
    // Validate hex color format
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

    if (primary_color && !hexColorRegex.test(primary_color)) {
      return res.status(400).json({
        error: 'Invalid primary color format',
        message: 'Color must be in hex format (#RRGGBB)',
        code: 'INVALID_COLOR_FORMAT',
      });
    }

    if (secondary_color && !hexColorRegex.test(secondary_color)) {
      return res.status(400).json({
        error: 'Invalid secondary color format',
        message: 'Color must be in hex format (#RRGGBB)',
        code: 'INVALID_COLOR_FORMAT',
      });
    }

    if (accent_color && !hexColorRegex.test(accent_color)) {
      return res.status(400).json({
        error: 'Invalid accent color format',
        message: 'Color must be in hex format (#RRGGBB)',
        code: 'INVALID_COLOR_FORMAT',
      });
    }

    // Build update query dynamically based on provided fields
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (primary_color !== undefined) {
      updates.push(`primary_color = $${paramIndex++}`);
      values.push(primary_color);
    }

    if (secondary_color !== undefined) {
      updates.push(`secondary_color = $${paramIndex++}`);
      values.push(secondary_color);
    }

    if (accent_color !== undefined) {
      updates.push(`accent_color = $${paramIndex++}`);
      values.push(accent_color);
    }

    if (custom_css !== undefined) {
      updates.push(`custom_css = $${paramIndex++}`);
      values.push(custom_css);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No fields to update',
        message: 'At least one field must be provided',
        code: 'NO_FIELDS_PROVIDED',
      });
    }

    // Add updated_at timestamp
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    // Add tenant_id to values
    values.push(id);

    // Update branding
    const query = `
      UPDATE tenant_branding
      SET ${updates.join(', ')}
      WHERE tenant_id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Tenant not found',
        message: 'No branding configuration found for this tenant',
        code: 'TENANT_NOT_FOUND',
      });
    }

    // Invalidate subdomain cache (if tenant has subdomain)
    const tenantResult = await pool.query(
      'SELECT subdomain FROM tenants WHERE id = $1',
      [id]
    );

    if (tenantResult.rows.length > 0 && tenantResult.rows[0].subdomain) {
      await subdomainCache.invalidate(tenantResult.rows[0].subdomain);
      console.log(`✅ Cache invalidated for tenant: ${id}`);
    }

    console.log(`✅ Branding updated for tenant: ${id}`);
    return res.status(200).json({
      message: 'Branding updated successfully',
      branding: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating branding:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update branding configuration',
      code: 'BRANDING_UPDATE_ERROR',
    });
  }
};

/**
 * Delete logo from branding configuration
 * DELETE /api/tenants/:id/branding/logo
 */
export const deleteLogo = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Clear logo URLs
    const result = await pool.query(
      `UPDATE tenant_branding
       SET logo_url = NULL,
           logo_small_url = NULL,
           logo_medium_url = NULL,
           logo_large_url = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE tenant_id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Tenant not found',
        message: 'No branding configuration found for this tenant',
        code: 'TENANT_NOT_FOUND',
      });
    }

    // Invalidate cache
    const tenantResult = await pool.query(
      'SELECT subdomain FROM tenants WHERE id = $1',
      [id]
    );

    if (tenantResult.rows.length > 0 && tenantResult.rows[0].subdomain) {
      await subdomainCache.invalidate(tenantResult.rows[0].subdomain);
    }

    console.log(`✅ Logo deleted for tenant: ${id}`);
    return res.status(200).json({
      message: 'Logo deleted successfully',
      branding: result.rows[0],
    });
  } catch (error) {
    console.error('Error deleting logo:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete logo',
      code: 'LOGO_DELETE_ERROR',
    });
  }
};
