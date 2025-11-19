/**
 * Team Alpha - Medical Record Template Service
 * Business logic for medical record templates
 */

import pool from '../database';
import {
  MedicalRecordTemplate,
  CreateTemplateDTO,
  UpdateTemplateDTO,
  TemplateFilters,
  TemplateUsage,
  CreateTemplateUsageDTO,
  TemplateStatistics,
  RecommendedTemplate,
  TemplateData,
  TemplateValidationResult,
  TemplateType,
  TemplateFields
} from '../types/template';

/**
 * Create a new medical record template
 */
export async function createTemplate(
  tenantId: string,
  userId: number,
  templateData: CreateTemplateDTO
): Promise<MedicalRecordTemplate> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // If this is set as default, unset other defaults of the same type/specialty
    if (templateData.is_default) {
      await client.query(`
        UPDATE medical_record_templates 
        SET is_default = false, updated_by = $1, updated_at = CURRENT_TIMESTAMP
        WHERE tenant_id = $2 
          AND template_type = $3 
          AND (specialty = $4 OR (specialty IS NULL AND $4 IS NULL))
          AND is_default = true
      `, [userId, tenantId, templateData.template_type, templateData.specialty || null]);
    }
    
    // Create the template
    const result = await client.query(`
      INSERT INTO medical_record_templates (
        tenant_id, name, description, template_type, specialty,
        fields, default_values, validation_rules, is_default, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      tenantId,
      templateData.name,
      templateData.description || null,
      templateData.template_type,
      templateData.specialty || null,
      JSON.stringify(templateData.fields),
      JSON.stringify(templateData.default_values || {}),
      JSON.stringify(templateData.validation_rules || {}),
      templateData.is_default || false,
      userId
    ]);
    
    await client.query('COMMIT');
    
    const template = result.rows[0];
    return {
      ...template,
      fields: JSON.parse(template.fields),
      default_values: JSON.parse(template.default_values || '{}'),
      validation_rules: JSON.parse(template.validation_rules || '{}')
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get templates with filtering
 */
export async function getTemplates(
  tenantId: string,
  filters: TemplateFilters = {}
): Promise<{ templates: MedicalRecordTemplate[]; total: number }> {
  let query = `
    SELECT t.*, u.name as created_by_name
    FROM medical_record_templates t
    LEFT JOIN public.users u ON t.created_by = u.id
    WHERE t.tenant_id = $1
  `;
  
  const params: any[] = [tenantId];
  let paramIndex = 2;
  
  // Apply filters
  if (filters.template_type) {
    query += ` AND t.template_type = $${paramIndex}`;
    params.push(filters.template_type);
    paramIndex++;
  }
  
  if (filters.specialty) {
    query += ` AND t.specialty = $${paramIndex}`;
    params.push(filters.specialty);
    paramIndex++;
  }
  
  if (filters.is_active !== undefined) {
    query += ` AND t.is_active = $${paramIndex}`;
    params.push(filters.is_active);
    paramIndex++;
  }
  
  if (filters.is_default !== undefined) {
    query += ` AND t.is_default = $${paramIndex}`;
    params.push(filters.is_default);
    paramIndex++;
  }
  
  if (filters.created_by) {
    query += ` AND t.created_by = $${paramIndex}`;
    params.push(filters.created_by);
    paramIndex++;
  }
  
  if (filters.search) {
    query += ` AND (t.name ILIKE $${paramIndex} OR t.description ILIKE $${paramIndex})`;
    params.push(`%${filters.search}%`);
    paramIndex++;
  }
  
  // Get total count
  const countQuery = query.replace(
    'SELECT t.*, u.name as created_by_name',
    'SELECT COUNT(*)'
  );
  const countResult = await pool.query(countQuery, params);
  const total = parseInt(countResult.rows[0].count);
  
  // Add ordering and pagination
  query += ` ORDER BY t.is_default DESC, t.name ASC`;
  
  if (filters.limit) {
    query += ` LIMIT $${paramIndex}`;
    params.push(filters.limit);
    paramIndex++;
  }
  
  if (filters.offset) {
    query += ` OFFSET $${paramIndex}`;
    params.push(filters.offset);
    paramIndex++;
  }
  
  const result = await pool.query(query, params);
  
  const templates = result.rows.map((row: any) => ({
    ...row,
    fields: JSON.parse(row.fields),
    default_values: JSON.parse(row.default_values || '{}'),
    validation_rules: JSON.parse(row.validation_rules || '{}')
  }));
  
  return { templates, total };
}

/**
 * Get a single template by ID
 */
export async function getTemplateById(
  tenantId: string,
  templateId: number
): Promise<MedicalRecordTemplate | null> {
  const result = await pool.query(`
    SELECT t.*, u.name as created_by_name
    FROM medical_record_templates t
    LEFT JOIN public.users u ON t.created_by = u.id
    WHERE t.id = $1 AND t.tenant_id = $2
  `, [templateId, tenantId]);
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const template = result.rows[0];
  return {
    ...template,
    fields: JSON.parse(template.fields),
    default_values: JSON.parse(template.default_values || '{}'),
    validation_rules: JSON.parse(template.validation_rules || '{}')
  };
}

/**
 * Update a template
 */
export async function updateTemplate(
  tenantId: string,
  templateId: number,
  userId: number,
  updateData: UpdateTemplateDTO
): Promise<MedicalRecordTemplate | null> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Check if template exists and belongs to tenant
    const existingResult = await client.query(`
      SELECT * FROM medical_record_templates 
      WHERE id = $1 AND tenant_id = $2
    `, [templateId, tenantId]);
    
    if (existingResult.rows.length === 0) {
      return null;
    }
    
    const existing = existingResult.rows[0];
    
    // If setting as default, unset other defaults
    if (updateData.is_default) {
      const templateType = updateData.template_type || existing.template_type;
      const specialty = updateData.specialty !== undefined ? updateData.specialty : existing.specialty;
      
      await client.query(`
        UPDATE medical_record_templates 
        SET is_default = false, updated_by = $1, updated_at = CURRENT_TIMESTAMP
        WHERE tenant_id = $2 
          AND template_type = $3 
          AND (specialty = $4 OR (specialty IS NULL AND $4 IS NULL))
          AND is_default = true
          AND id != $5
      `, [userId, tenantId, templateType, specialty, templateId]);
    }
    
    // Build update query dynamically
    const updateFields: string[] = [];
    const updateParams: any[] = [];
    let paramIndex = 1;
    
    if (updateData.name !== undefined) {
      updateFields.push(`name = $${paramIndex}`);
      updateParams.push(updateData.name);
      paramIndex++;
    }
    
    if (updateData.description !== undefined) {
      updateFields.push(`description = $${paramIndex}`);
      updateParams.push(updateData.description);
      paramIndex++;
    }
    
    if (updateData.template_type !== undefined) {
      updateFields.push(`template_type = $${paramIndex}`);
      updateParams.push(updateData.template_type);
      paramIndex++;
    }
    
    if (updateData.specialty !== undefined) {
      updateFields.push(`specialty = $${paramIndex}`);
      updateParams.push(updateData.specialty);
      paramIndex++;
    }
    
    if (updateData.fields !== undefined) {
      updateFields.push(`fields = $${paramIndex}`);
      updateParams.push(JSON.stringify(updateData.fields));
      paramIndex++;
    }
    
    if (updateData.default_values !== undefined) {
      updateFields.push(`default_values = $${paramIndex}`);
      updateParams.push(JSON.stringify(updateData.default_values));
      paramIndex++;
    }
    
    if (updateData.validation_rules !== undefined) {
      updateFields.push(`validation_rules = $${paramIndex}`);
      updateParams.push(JSON.stringify(updateData.validation_rules));
      paramIndex++;
    }
    
    if (updateData.is_default !== undefined) {
      updateFields.push(`is_default = $${paramIndex}`);
      updateParams.push(updateData.is_default);
      paramIndex++;
    }
    
    if (updateData.is_active !== undefined) {
      updateFields.push(`is_active = $${paramIndex}`);
      updateParams.push(updateData.is_active);
      paramIndex++;
    }
    
    // Always update these fields
    updateFields.push(`updated_by = $${paramIndex}`);
    updateParams.push(userId);
    paramIndex++;
    
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    
    // Add WHERE clause parameters
    updateParams.push(templateId, tenantId);
    
    const updateQuery = `
      UPDATE medical_record_templates 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1}
      RETURNING *
    `;
    
    const result = await client.query(updateQuery, updateParams);
    
    await client.query('COMMIT');
    
    const template = result.rows[0];
    return {
      ...template,
      fields: JSON.parse(template.fields),
      default_values: JSON.parse(template.default_values || '{}'),
      validation_rules: JSON.parse(template.validation_rules || '{}')
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Delete a template (soft delete by setting is_active = false)
 */
export async function deleteTemplate(
  tenantId: string,
  templateId: number,
  userId: number
): Promise<boolean> {
  const result = await pool.query(`
    UPDATE medical_record_templates 
    SET is_active = false, updated_by = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2 AND tenant_id = $3
  `, [userId, templateId, tenantId]);
  
  return (result.rowCount || 0) > 0;
}

/**
 * Apply a template to create template data for a medical record
 */
export async function applyTemplate(
  tenantId: string,
  templateId: number,
  customValues: Record<string, any> = {}
): Promise<TemplateData> {
  const template = await getTemplateById(tenantId, templateId);
  
  if (!template) {
    throw new Error('Template not found');
  }
  
  if (!template.is_active) {
    throw new Error('Template is not active');
  }
  
  // Merge default values with custom values
  const populatedFields = {
    ...template.default_values,
    ...customValues
  };
  
  // Validate the populated fields
  const validationResult = validateTemplateData(template, populatedFields);
  
  return {
    template,
    populated_fields: populatedFields,
    validation_errors: validationResult.is_valid ? undefined : validationResult.errors
  };
}

/**
 * Validate template data against template rules
 */
export function validateTemplateData(
  template: MedicalRecordTemplate,
  data: Record<string, any>
): TemplateValidationResult {
  const errors: Record<string, string[]> = {};
  const warnings: Record<string, string[]> = {};
  
  // Validate each field
  Object.entries(template.fields).forEach(([fieldName, fieldConfig]) => {
    const value = data[fieldName];
    const fieldErrors: string[] = [];
    
    // Check required fields
    if (fieldConfig.required && (value === undefined || value === null || value === '')) {
      fieldErrors.push(`${fieldConfig.label} is required`);
    }
    
    // Skip further validation if field is empty and not required
    if (!fieldConfig.required && (value === undefined || value === null || value === '')) {
      return;
    }
    
    // Type-specific validation
    if (fieldConfig.type === 'text' || fieldConfig.type === 'textarea') {
      if (typeof value === 'string') {
        const validation = fieldConfig.validation;
        if (validation?.minLength && value.length < validation.minLength) {
          fieldErrors.push(`${fieldConfig.label} must be at least ${validation.minLength} characters`);
        }
        if (validation?.maxLength && value.length > validation.maxLength) {
          fieldErrors.push(`${fieldConfig.label} must be no more than ${validation.maxLength} characters`);
        }
        if (validation?.pattern && !new RegExp(validation.pattern).test(value)) {
          fieldErrors.push(`${fieldConfig.label} format is invalid`);
        }
      }
    } else if (fieldConfig.type === 'number') {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        fieldErrors.push(`${fieldConfig.label} must be a valid number`);
      } else {
        const validation = fieldConfig.validation;
        if (validation?.min !== undefined && numValue < validation.min) {
          fieldErrors.push(`${fieldConfig.label} must be at least ${validation.min}`);
        }
        if (validation?.max !== undefined && numValue > validation.max) {
          fieldErrors.push(`${fieldConfig.label} must be no more than ${validation.max}`);
        }
      }
    } else if (fieldConfig.type === 'select') {
      if (fieldConfig.options && !fieldConfig.options.includes(value)) {
        fieldErrors.push(`${fieldConfig.label} must be one of the allowed options`);
      }
    }
    
    // Conditional validation
    if (fieldConfig.conditional?.required_if) {
      const condition = fieldConfig.conditional.required_if;
      const conditionValue = data[condition.field];
      
      if (evaluateCondition(conditionValue, condition.operator, condition.value)) {
        if (value === undefined || value === null || value === '') {
          fieldErrors.push(`${fieldConfig.label} is required when ${condition.field} is ${condition.value}`);
        }
      }
    }
    
    if (fieldErrors.length > 0) {
      errors[fieldName] = fieldErrors;
    }
  });
  
  return {
    is_valid: Object.keys(errors).length === 0,
    errors,
    warnings
  };
}

/**
 * Evaluate conditional logic
 */
function evaluateCondition(value: any, operator: string, expectedValue: any): boolean {
  switch (operator) {
    case 'equals':
      return value === expectedValue;
    case 'not_equals':
      return value !== expectedValue;
    case 'contains':
      return typeof value === 'string' && value.includes(expectedValue);
    case 'greater_than':
      return Number(value) > Number(expectedValue);
    case 'less_than':
      return Number(value) < Number(expectedValue);
    default:
      return false;
  }
}

/**
 * Record template usage
 */
export async function recordTemplateUsage(
  tenantId: string,
  userId: number,
  usageData: CreateTemplateUsageDTO
): Promise<TemplateUsage> {
  const result = await pool.query(`
    INSERT INTO medical_record_template_usage (
      tenant_id, template_id, medical_record_id, user_id,
      customizations, completion_time_seconds
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [
    tenantId,
    usageData.template_id,
    usageData.medical_record_id,
    userId,
    JSON.stringify(usageData.customizations || {}),
    usageData.completion_time_seconds || null
  ]);
  
  const usage = result.rows[0];
  return {
    ...usage,
    customizations: JSON.parse(usage.customizations || '{}')
  };
}

/**
 * Get template statistics
 */
export async function getTemplateStatistics(
  tenantId: string
): Promise<TemplateStatistics[]> {
  const result = await pool.query(`
    SELECT * FROM get_template_statistics($1)
  `, [tenantId]);
  
  return result.rows.map((row: any) => ({
    ...row,
    usage_count: parseInt(row.usage_count),
    unique_users: parseInt(row.unique_users),
    avg_completion_time: row.avg_completion_time ? parseFloat(row.avg_completion_time) : undefined
  }));
}

/**
 * Get recommended templates for a user
 */
export async function getRecommendedTemplates(
  tenantId: string,
  userId: number,
  specialty?: string,
  templateType?: TemplateType
): Promise<RecommendedTemplate[]> {
  const result = await pool.query(`
    SELECT * FROM get_recommended_templates($1, $2, $3, $4)
  `, [tenantId, userId, specialty || null, templateType || null]);
  
  return result.rows.map((row: any) => ({
    ...row,
    usage_count: parseInt(row.usage_count),
    user_usage_count: parseInt(row.user_usage_count),
    avg_completion_time: row.avg_completion_time ? parseFloat(row.avg_completion_time) : undefined,
    recommendation_score: parseFloat(row.recommendation_score)
  }));
}

/**
 * Copy default templates to a new tenant
 */
export async function copyDefaultTemplatesToTenant(
  tenantId: string,
  userId: number
): Promise<number> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get default templates
    const defaultTemplates = await client.query(`
      SELECT * FROM medical_record_templates 
      WHERE tenant_id = 'default' AND is_active = true
    `);
    
    let copiedCount = 0;
    
    for (const template of defaultTemplates.rows) {
      await client.query(`
        INSERT INTO medical_record_templates (
          tenant_id, name, description, template_type, specialty,
          fields, default_values, validation_rules, is_default, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        tenantId,
        template.name,
        template.description,
        template.template_type,
        template.specialty,
        template.fields,
        template.default_values,
        template.validation_rules,
        template.is_default,
        userId
      ]);
      
      copiedCount++;
    }
    
    await client.query('COMMIT');
    return copiedCount;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export default {
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  applyTemplate,
  validateTemplateData,
  recordTemplateUsage,
  getTemplateStatistics,
  getRecommendedTemplates,
  copyDefaultTemplatesToTenant
};