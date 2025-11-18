import { Pool } from 'pg';

export interface CustomField {
  id: number;
  name: string;
  label: string;
  field_type: string;
  applies_to: string;
  validation_rules: any;
  conditional_logic: any;
  display_order: number;
  is_required: boolean;
  is_active: boolean;
  default_value: string | null;
  help_text: string | null;
  tenant_id: string;
  options?: CustomFieldOption[];
}

export interface CustomFieldOption {
  id: number;
  field_id: number;
  option_value: string;
  option_label: string;
  display_order: number;
  is_active: boolean;
}

export interface CustomFieldValue {
  id: number;
  field_id: number;
  entity_type: string;
  entity_id: number;
  field_value: any;
}

export class CustomFieldsService {
  constructor(private pool: Pool) {}

  // Get custom fields for a specific entity type and tenant
  async getFieldsByEntityType(tenantId: string, entityType: string): Promise<CustomField[]> {
    const query = `
      SELECT cf.*, 
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', cfo.id,
                   'field_id', cfo.field_id,
                   'option_value', cfo.option_value,
                   'option_label', cfo.option_label,
                   'display_order', cfo.display_order,
                   'is_active', cfo.is_active
                 ) ORDER BY cfo.display_order
               ) FILTER (WHERE cfo.id IS NOT NULL), 
               '[]'
             ) as options
      FROM custom_fields cf
      LEFT JOIN custom_field_options cfo ON cf.id = cfo.field_id AND cfo.is_active = true
      WHERE cf.tenant_id = $1 
        AND cf.applies_to = $2 
        AND cf.is_active = true
      GROUP BY cf.id
      ORDER BY cf.display_order, cf.created_at
    `;

    const result = await this.pool.query(query, [tenantId, entityType]);
    return result.rows;
  }

  // Create a new custom field
  async createField(tenantId: string, fieldData: Partial<CustomField>): Promise<CustomField> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Insert the custom field
      const fieldQuery = `
        INSERT INTO custom_fields (
          name, label, field_type, applies_to, validation_rules, 
          conditional_logic, display_order, is_required, is_active, 
          default_value, help_text, tenant_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;

      const fieldValues = [
        fieldData.name,
        fieldData.label,
        fieldData.field_type,
        fieldData.applies_to,
        JSON.stringify(fieldData.validation_rules || {}),
        JSON.stringify(fieldData.conditional_logic || {}),
        fieldData.display_order || 0,
        fieldData.is_required || false,
        fieldData.is_active !== false, // Default to true
        fieldData.default_value,
        fieldData.help_text,
        tenantId
      ];

      const fieldResult = await client.query(fieldQuery, fieldValues);
      const field = fieldResult.rows[0];

      // Insert options if provided
      if (fieldData.options && fieldData.options.length > 0) {
        const optionsQuery = `
          INSERT INTO custom_field_options (
            field_id, option_value, option_label, display_order, is_active
          ) VALUES ($1, $2, $3, $4, $5)
        `;

        for (const option of fieldData.options) {
          await client.query(optionsQuery, [
            field.id,
            option.option_value,
            option.option_label,
            option.display_order || 0,
            option.is_active !== false
          ]);
        }
      }

      await client.query('COMMIT');

      // Return the complete field with options
      return await this.getFieldById(tenantId, field.id);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get a specific field by ID
  async getFieldById(tenantId: string, fieldId: number): Promise<CustomField> {
    const query = `
      SELECT cf.*, 
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', cfo.id,
                   'field_id', cfo.field_id,
                   'option_value', cfo.option_value,
                   'option_label', cfo.option_label,
                   'display_order', cfo.display_order,
                   'is_active', cfo.is_active
                 ) ORDER BY cfo.display_order
               ) FILTER (WHERE cfo.id IS NOT NULL), 
               '[]'
             ) as options
      FROM custom_fields cf
      LEFT JOIN custom_field_options cfo ON cf.id = cfo.field_id AND cfo.is_active = true
      WHERE cf.id = $1 AND cf.tenant_id = $2
      GROUP BY cf.id
    `;

    const result = await this.pool.query(query, [fieldId, tenantId]);
    if (result.rows.length === 0) {
      throw new Error('Custom field not found');
    }
    return result.rows[0];
  }

  // Save field value for an entity (in tenant schema)
  async saveFieldValue(
    tenantId: string, 
    fieldId: number, 
    entityType: string, 
    entityId: number, 
    value: any
  ): Promise<void> {
    // Set search path to tenant schema
    await this.pool.query(`SET search_path TO "${tenantId}"`);

    try {
      const query = `
        INSERT INTO custom_field_values (field_id, entity_type, entity_id, field_value, updated_at)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
        ON CONFLICT (field_id, entity_type, entity_id)
        DO UPDATE SET 
          field_value = EXCLUDED.field_value,
          updated_at = CURRENT_TIMESTAMP
      `;

      await this.pool.query(query, [fieldId, entityType, entityId, JSON.stringify(value)]);
    } finally {
      // Reset search path
      await this.pool.query('SET search_path TO public');
    }
  }

  // Get field values for an entity (from tenant schema)
  async getFieldValues(
    tenantId: string, 
    entityType: string, 
    entityId: number
  ): Promise<Record<string, any>> {
    // Set search path to tenant schema
    await this.pool.query(`SET search_path TO "${tenantId}"`);

    try {
      const query = `
        SELECT cf.name, cfv.value as field_value
        FROM custom_field_values cfv
        JOIN public.custom_fields cf ON cfv.field_id = cf.id
        WHERE cfv.entity_type = $1 AND cfv.entity_id = $2
      `;

      const result = await this.pool.query(query, [entityType, entityId]);
      
      const values: Record<string, any> = {};
      for (const row of result.rows) {
        try {
          // Try to parse as JSON first
          values[row.name] = JSON.parse(row.field_value);
        } catch {
          // If parsing fails, use the raw value
          values[row.name] = row.field_value;
        }
      }
      
      return values;
    } finally {
      // Reset search path
      await this.pool.query('SET search_path TO public');
    }
  }

  // Update a custom field
  async updateField(tenantId: string, fieldId: number, fieldData: Partial<CustomField>): Promise<CustomField> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Update the custom field
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;

      if (fieldData.label !== undefined) {
        updateFields.push(`label = $${paramIndex++}`);
        updateValues.push(fieldData.label);
      }
      if (fieldData.validation_rules !== undefined) {
        updateFields.push(`validation_rules = $${paramIndex++}`);
        updateValues.push(JSON.stringify(fieldData.validation_rules));
      }
      if (fieldData.conditional_logic !== undefined) {
        updateFields.push(`conditional_logic = $${paramIndex++}`);
        updateValues.push(JSON.stringify(fieldData.conditional_logic));
      }
      if (fieldData.display_order !== undefined) {
        updateFields.push(`display_order = $${paramIndex++}`);
        updateValues.push(fieldData.display_order);
      }
      if (fieldData.is_required !== undefined) {
        updateFields.push(`is_required = $${paramIndex++}`);
        updateValues.push(fieldData.is_required);
      }
      if (fieldData.is_active !== undefined) {
        updateFields.push(`is_active = $${paramIndex++}`);
        updateValues.push(fieldData.is_active);
      }
      if (fieldData.help_text !== undefined) {
        updateFields.push(`help_text = $${paramIndex++}`);
        updateValues.push(fieldData.help_text);
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      updateValues.push(fieldId, tenantId);

      const fieldQuery = `
        UPDATE custom_fields 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex++}
        RETURNING *
      `;

      const fieldResult = await client.query(fieldQuery, updateValues);
      if (fieldResult.rows.length === 0) {
        throw new Error('Custom field not found');
      }

      await client.query('COMMIT');

      // Return the updated field with options
      return await this.getFieldById(tenantId, fieldId);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Delete a custom field
  async deleteField(tenantId: string, fieldId: number): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Delete field values from all tenant schemas
      const tenantSchemas = await client.query(`
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name LIKE 'tenant_%' OR schema_name LIKE 'demo_%'
      `);

      for (const { schema_name } of tenantSchemas.rows) {
        await client.query(`SET search_path TO "${schema_name}"`);
        await client.query('DELETE FROM custom_field_values WHERE field_id = $1', [fieldId]);
      }

      // Reset search path
      await client.query('SET search_path TO public');

      // Delete the custom field (options will be deleted by CASCADE)
      const result = await client.query(
        'DELETE FROM custom_fields WHERE id = $1 AND tenant_id = $2',
        [fieldId, tenantId]
      );

      if (result.rowCount === 0) {
        throw new Error('Custom field not found');
      }

      await client.query('COMMIT');

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}