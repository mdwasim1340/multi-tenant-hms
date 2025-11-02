# B1: Custom Fields Engine

**Agent:** Shared Components Agent B1  
**Track:** Custom Fields System  
**Dependencies:** A1 (Subscription Tier System) must be complete  
**Estimated Time:** 4-5 days  
**Complexity:** High

## Objective
Implement a flexible custom fields engine that allows tenants to create custom fields for patients, appointments, and medical records with Level 2 complexity (file uploads, multi-select, conditional logic).

## Current State Analysis
- ✅ Subscription tier system exists (from A1)
- ✅ Multi-tenant architecture operational
- ❌ No custom fields system
- ❌ No dynamic form generation
- ❌ No conditional logic engine

## Implementation Steps

### Step 1: Database Schema (Day 1)
Create custom fields tables in tenant schemas.

**Tables to Create (in each tenant schema):**
```sql
-- Custom field definitions
CREATE TABLE custom_fields (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  label VARCHAR(255) NOT NULL,
  field_type VARCHAR(50) NOT NULL,
  applies_to VARCHAR(50) NOT NULL,
  validation_rules JSONB DEFAULT '{}',
  conditional_logic JSONB DEFAULT '{}',
  display_order INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  default_value TEXT,
  help_text TEXT,
  created_by INTEGER REFERENCES public.users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, applies_to)
);

-- Options for dropdown/multi-select fields
CREATE TABLE custom_field_options (
  id SERIAL PRIMARY KEY,
  field_id INTEGER NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
  option_value VARCHAR(255) NOT NULL,
  option_label VARCHAR(255) NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Custom field values storage
CREATE TABLE custom_field_values (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INTEGER NOT NULL,
  field_id INTEGER NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
  value_text TEXT,
  value_number DECIMAL(15,2),
  value_date DATE,
  value_boolean BOOLEAN,
  value_json JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(entity_type, entity_id, field_id)
);

-- Indexes
CREATE INDEX idx_custom_fields_applies_to ON custom_fields(applies_to);
CREATE INDEX idx_custom_fields_active ON custom_fields(is_active);
CREATE INDEX idx_custom_field_options_field ON custom_field_options(field_id);
CREATE INDEX idx_custom_field_values_entity ON custom_field_values(entity_type, entity_id);
CREATE INDEX idx_custom_field_values_field ON custom_field_values(field_id);
```

**Migration Script:**
```bash
# Apply to all tenant schemas
TENANT_SCHEMAS=$(docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -t -c "
SELECT schema_name FROM information_schema.schemata 
WHERE schema_name LIKE 'tenant_%' OR schema_name LIKE 'demo_%';
")

for schema in $TENANT_SCHEMAS; do
  echo "Creating custom fields tables in schema: $schema"
  docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "
    SET search_path TO \"$schema\";
    -- Execute CREATE TABLE statements here
  "
done
```

### Step 2: TypeScript Types (Day 1)
Create comprehensive type definitions.

**File:** `backend/src/types/customFields.ts`
```typescript
export type FieldType = 
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'datetime'
  | 'boolean'
  | 'dropdown'
  | 'multi_select'
  | 'file_upload'
  | 'rich_text';

export type EntityType = 'patients' | 'appointments' | 'medical_records';

export interface CustomField {
  id: number;
  name: string;
  label: string;
  field_type: FieldType;
  applies_to: EntityType;
  validation_rules: ValidationRules;
  conditional_logic: ConditionalLogic;
  display_order: number;
  is_required: boolean;
  is_active: boolean;
  default_value: string | null;
  help_text: string | null;
  created_by: number;
  created_at: Date;
  updated_at: Date;
  options?: CustomFieldOption[];
}

export interface CustomFieldOption {
  id: number;
  field_id: number;
  option_value: string;
  option_label: string;
  display_order: number;
  is_active: boolean;
  created_at: Date;
}

export interface CustomFieldValue {
  id: number;
  entity_type: EntityType;
  entity_id: number;
  field_id: number;
  value_text: string | null;
  value_number: number | null;
  value_date: Date | null;
  value_boolean: boolean | null;
  value_json: any | null;
  created_at: Date;
  updated_at: Date;
}

export interface ValidationRules {
  min_length?: number;
  max_length?: number;
  min_value?: number;
  max_value?: number;
  pattern?: string;
  allowed_extensions?: string[];
  max_file_size_mb?: number;
}

export interface ConditionalLogic {
  show_if?: ConditionalRule[];
  hide_if?: ConditionalRule[];
}

export interface ConditionalRule {
  field_name: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
}

export interface CustomFieldDefinition {
  field: CustomField;
  value?: any;
  visible: boolean;
  error?: string;
}
```

### Step 3: Custom Fields Service (Day 2-3)
Create comprehensive service layer.

**File:** `backend/src/services/customFields.ts`
```typescript
import { pool } from '../database';
import { CustomField, CustomFieldValue, CustomFieldOption, EntityType, FieldType } from '../types/customFields';

export class CustomFieldsService {
  // Create custom field
  async createField(tenantId: string, fieldData: Partial<CustomField>): Promise<CustomField> {
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      const result = await client.query(`
        INSERT INTO custom_fields (
          name, label, field_type, applies_to, validation_rules,
          conditional_logic, display_order, is_required, default_value,
          help_text, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [
        fieldData.name,
        fieldData.label,
        fieldData.field_type,
        fieldData.applies_to,
        JSON.stringify(fieldData.validation_rules || {}),
        JSON.stringify(fieldData.conditional_logic || {}),
        fieldData.display_order || 0,
        fieldData.is_required || false,
        fieldData.default_value,
        fieldData.help_text,
        fieldData.created_by
      ]);

      const field = result.rows[0];

      // Create options if dropdown or multi_select
      if (fieldData.field_type === 'dropdown' || fieldData.field_type === 'multi_select') {
        if (fieldData.options && fieldData.options.length > 0) {
          await this.createFieldOptions(tenantId, field.id, fieldData.options);
        }
      }

      return field;
    } finally {
      client.release();
    }
  }

  // Get all fields for entity type
  async getFieldsForEntity(tenantId: string, entityType: EntityType): Promise<CustomField[]> {
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      const result = await client.query(`
        SELECT * FROM custom_fields 
        WHERE applies_to = $1 AND is_active = true
        ORDER BY display_order
      `, [entityType]);

      const fields = result.rows;

      // Load options for dropdown/multi_select fields
      for (const field of fields) {
        if (field.field_type === 'dropdown' || field.field_type === 'multi_select') {
          field.options = await this.getFieldOptions(tenantId, field.id);
        }
      }

      return fields;
    } finally {
      client.release();
    }
  }

  // Save custom field value
  async saveFieldValue(
    tenantId: string,
    entityType: EntityType,
    entityId: number,
    fieldId: number,
    value: any
  ): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      // Get field definition to determine storage column
      const fieldResult = await client.query(
        'SELECT field_type FROM custom_fields WHERE id = $1',
        [fieldId]
      );
      
      if (!fieldResult.rows.length) {
        throw new Error('Custom field not found');
      }

      const fieldType = fieldResult.rows[0].field_type;
      const storageColumn = this.getStorageColumn(fieldType);
      
      await client.query(`
        INSERT INTO custom_field_values (
          entity_type, entity_id, field_id, ${storageColumn}
        ) VALUES ($1, $2, $3, $4)
        ON CONFLICT (entity_type, entity_id, field_id)
        DO UPDATE SET ${storageColumn} = $4, updated_at = CURRENT_TIMESTAMP
      `, [entityType, entityId, fieldId, value]);
    } finally {
      client.release();
    }
  }

  // Get custom field values for entity
  async getFieldValues(
    tenantId: string,
    entityType: EntityType,
    entityId: number
  ): Promise<Record<string, any>> {
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      const result = await client.query(`
        SELECT 
          cf.name,
          cf.field_type,
          cfv.value_text,
          cfv.value_number,
          cfv.value_date,
          cfv.value_boolean,
          cfv.value_json
        FROM custom_field_values cfv
        JOIN custom_fields cf ON cfv.field_id = cf.id
        WHERE cfv.entity_type = $1 AND cfv.entity_id = $2
      `, [entityType, entityId]);

      const values: Record<string, any> = {};
      
      for (const row of result.rows) {
        const storageColumn = this.getStorageColumn(row.field_type);
        values[row.name] = row[storageColumn];
      }

      return values;
    } finally {
      client.release();
    }
  }

  // Validate field value
  async validateFieldValue(
    tenantId: string,
    fieldId: number,
    value: any
  ): Promise<{ valid: boolean; error?: string }> {
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      const result = await client.query(
        'SELECT field_type, validation_rules, is_required FROM custom_fields WHERE id = $1',
        [fieldId]
      );

      if (!result.rows.length) {
        return { valid: false, error: 'Field not found' };
      }

      const field = result.rows[0];
      const rules = field.validation_rules;

      // Check required
      if (field.is_required && (value === null || value === undefined || value === '')) {
        return { valid: false, error: 'This field is required' };
      }

      // Type-specific validation
      switch (field.field_type) {
        case 'text':
        case 'textarea':
          if (rules.min_length && value.length < rules.min_length) {
            return { valid: false, error: `Minimum length is ${rules.min_length}` };
          }
          if (rules.max_length && value.length > rules.max_length) {
            return { valid: false, error: `Maximum length is ${rules.max_length}` };
          }
          if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
            return { valid: false, error: 'Invalid format' };
          }
          break;

        case 'number':
          if (rules.min_value !== undefined && value < rules.min_value) {
            return { valid: false, error: `Minimum value is ${rules.min_value}` };
          }
          if (rules.max_value !== undefined && value > rules.max_value) {
            return { valid: false, error: `Maximum value is ${rules.max_value}` };
          }
          break;

        case 'file_upload':
          if (rules.max_file_size_mb && value.size > rules.max_file_size_mb * 1024 * 1024) {
            return { valid: false, error: `File size exceeds ${rules.max_file_size_mb}MB` };
          }
          if (rules.allowed_extensions) {
            const ext = value.name.split('.').pop().toLowerCase();
            if (!rules.allowed_extensions.includes(ext)) {
              return { valid: false, error: `Allowed extensions: ${rules.allowed_extensions.join(', ')}` };
            }
          }
          break;
      }

      return { valid: true };
    } finally {
      client.release();
    }
  }

  // Evaluate conditional logic
  evaluateConditionalLogic(
    field: CustomField,
    allFieldValues: Record<string, any>
  ): boolean {
    if (!field.conditional_logic || !field.conditional_logic.show_if) {
      return true; // No conditions, always show
    }

    const rules = field.conditional_logic.show_if;
    
    for (const rule of rules) {
      const fieldValue = allFieldValues[rule.field_name];
      
      switch (rule.operator) {
        case 'equals':
          if (fieldValue !== rule.value) return false;
          break;
        case 'not_equals':
          if (fieldValue === rule.value) return false;
          break;
        case 'contains':
          if (!String(fieldValue).includes(rule.value)) return false;
          break;
        case 'greater_than':
          if (fieldValue <= rule.value) return false;
          break;
        case 'less_than':
          if (fieldValue >= rule.value) return false;
          break;
      }
    }

    return true;
  }

  // Helper methods
  private getStorageColumn(fieldType: FieldType): string {
    switch (fieldType) {
      case 'text':
      case 'textarea':
      case 'rich_text':
      case 'dropdown':
        return 'value_text';
      case 'number':
        return 'value_number';
      case 'date':
      case 'datetime':
        return 'value_date';
      case 'boolean':
        return 'value_boolean';
      case 'multi_select':
      case 'file_upload':
        return 'value_json';
      default:
        return 'value_text';
    }
  }

  private async createFieldOptions(
    tenantId: string,
    fieldId: number,
    options: Partial<CustomFieldOption>[]
  ): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      for (const option of options) {
        await client.query(`
          INSERT INTO custom_field_options (field_id, option_value, option_label, display_order)
          VALUES ($1, $2, $3, $4)
        `, [fieldId, option.option_value, option.option_label, option.display_order || 0]);
      }
    } finally {
      client.release();
    }
  }

  private async getFieldOptions(tenantId: string, fieldId: number): Promise<CustomFieldOption[]> {
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      const result = await client.query(`
        SELECT * FROM custom_field_options 
        WHERE field_id = $1 AND is_active = true
        ORDER BY display_order
      `, [fieldId]);

      return result.rows;
    } finally {
      client.release();
    }
  }
}

export const customFieldsService = new CustomFieldsService();
```

### Step 4: API Routes (Day 3-4)
Create API endpoints for custom fields management.

**File:** `backend/src/routes/customFields.ts`
```typescript
import express from 'express';
import { customFieldsService } from '../services/customFields';
import { authMiddleware } from '../middleware/auth';
import { requireFeature } from '../middleware/featureAccess';

const router = express.Router();

// Get all custom fields for entity type
router.get('/:entityType', authMiddleware, requireFeature('custom_fields'), async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { entityType } = req.params;
    
    const fields = await customFieldsService.getFieldsForEntity(tenantId, entityType as any);
    res.json({ fields });
  } catch (error) {
    console.error('Error fetching custom fields:', error);
    res.status(500).json({ error: 'Failed to fetch custom fields' });
  }
});

// Create custom field
router.post('/', authMiddleware, requireFeature('custom_fields'), async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const field = await customFieldsService.createField(tenantId, req.body);
    res.status(201).json({ message: 'Custom field created', field });
  } catch (error) {
    console.error('Error creating custom field:', error);
    res.status(500).json({ error: 'Failed to create custom field' });
  }
});

// Get custom field values for entity
router.get('/:entityType/:entityId/values', authMiddleware, async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { entityType, entityId } = req.params;
    
    const values = await customFieldsService.getFieldValues(
      tenantId,
      entityType as any,
      parseInt(entityId)
    );
    
    res.json({ values });
  } catch (error) {
    console.error('Error fetching field values:', error);
    res.status(500).json({ error: 'Failed to fetch field values' });
  }
});

// Save custom field value
router.post('/:entityType/:entityId/values', authMiddleware, async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { entityType, entityId } = req.params;
    const { field_id, value } = req.body;
    
    // Validate value
    const validation = await customFieldsService.validateFieldValue(tenantId, field_id, value);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }
    
    await customFieldsService.saveFieldValue(
      tenantId,
      entityType as any,
      parseInt(entityId),
      field_id,
      value
    );
    
    res.json({ message: 'Field value saved successfully' });
  } catch (error) {
    console.error('Error saving field value:', error);
    res.status(500).json({ error: 'Failed to save field value' });
  }
});

export default router;
```

### Step 5: Integration (Day 4)
Integrate custom fields into main application.

**File:** `backend/src/index.ts`
```typescript
import customFieldsRoutes from './routes/customFields';

app.use('/api/custom-fields', customFieldsRoutes);
```

### Step 6: Testing (Day 5)
Create comprehensive tests.

**File:** `backend/tests/test-custom-fields.js`
```javascript
const axios = require('axios');

const API_URL = 'http://localhost:3000';
const TENANT_ID = 'tenant_1762083064503';

async function testCustomFields() {
  console.log('🧪 Testing Custom Fields Engine\n');

  try {
    // Test 1: Create custom field
    console.log('Test 1: Creating custom field...');
    const createResponse = await axios.post(
      `${API_URL}/api/custom-fields`,
      {
        name: 'blood_type',
        label: 'Blood Type',
        field_type: 'dropdown',
        applies_to: 'patients',
        is_required: true,
        options: [
          { option_value: 'A+', option_label: 'A Positive' },
          { option_value: 'B+', option_label: 'B Positive' },
          { option_value: 'O+', option_label: 'O Positive' }
        ]
      },
      {
        headers: {
          'Authorization': 'Bearer test_token',
          'X-Tenant-ID': TENANT_ID
        }
      }
    );
    console.log('✅ Custom field created:', createResponse.data.field.id);

    // Test 2: Get fields for entity
    console.log('\nTest 2: Fetching custom fields for patients...');
    const fieldsResponse = await axios.get(
      `${API_URL}/api/custom-fields/patients`,
      {
        headers: {
          'Authorization': 'Bearer test_token',
          'X-Tenant-ID': TENANT_ID
        }
      }
    );
    console.log('✅ Fields fetched:', fieldsResponse.data.fields.length);

    // Test 3: Save field value
    console.log('\nTest 3: Saving field value...');
    await axios.post(
      `${API_URL}/api/custom-fields/patients/1/values`,
      {
        field_id: createResponse.data.field.id,
        value: 'A+'
      },
      {
        headers: {
          'Authorization': 'Bearer test_token',
          'X-Tenant-ID': TENANT_ID
        }
      }
    );
    console.log('✅ Field value saved');

    // Test 4: Get field values
    console.log('\nTest 4: Fetching field values...');
    const valuesResponse = await axios.get(
      `${API_URL}/api/custom-fields/patients/1/values`,
      {
        headers: {
          'Authorization': 'Bearer test_token',
          'X-Tenant-ID': TENANT_ID
        }
      }
    );
    console.log('✅ Values fetched:', valuesResponse.data.values);

    console.log('\n✅ All custom fields tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testCustomFields();
```

## Validation Checklist

### Database
- [ ] Custom fields tables created in all tenant schemas
- [ ] Indexes created for performance
- [ ] Foreign key constraints working

### Backend
- [ ] TypeScript types comprehensive
- [ ] Custom fields service fully functional
- [ ] Validation engine working
- [ ] Conditional logic evaluator working
- [ ] API routes functional

### Integration
- [ ] Routes added to main app
- [ ] Feature flag enforcement working
- [ ] Multi-tenant isolation verified

### Testing
- [ ] Can create custom fields
- [ ] Can get fields for entity type
- [ ] Can save field values
- [ ] Can retrieve field values
- [ ] Validation rules enforced
- [ ] Conditional logic works

## Success Criteria
- All database tables created in tenant schemas
- Custom fields service fully functional
- All field types supported
- Validation and conditional logic working
- API endpoints tested and functional
- Multi-tenant isolation verified

## Next Steps
After completion, this enables:
- Agent B2 to build custom fields UI
- Agent HM1 to integrate custom fields in patient management
- Agent HM2 to integrate custom fields in appointments

## Notes for AI Agent
- This is a complex feature - take time to understand requirements
- Test each field type thoroughly
- Ensure conditional logic is performant
- Consider caching field definitions
- Document field types and validation rules clearly
- Test with multiple tenants to verify isolation
