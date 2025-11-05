import { Router, Request, Response } from 'express';
import { CustomFieldsService } from '../services/customFields';
import pool from '../database';

const router = Router();
const customFieldsService = new CustomFieldsService(pool);

// Get custom fields for a specific entity type
router.get('/:entityType', async (req: Request, res: Response) => {
  try {
    const { entityType } = req.params;
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      return res.status(400).json({ 
        error: 'X-Tenant-ID header is required',
        code: 'MISSING_TENANT_ID'
      });
    }

    // Validate entity type
    const validEntityTypes = ['patients', 'appointments', 'medical_records'];
    if (!validEntityTypes.includes(entityType)) {
      return res.status(400).json({ 
        error: 'Invalid entity type',
        code: 'INVALID_ENTITY_TYPE',
        validTypes: validEntityTypes
      });
    }

    const fields = await customFieldsService.getFieldsByEntityType(tenantId, entityType);

    res.json({
      success: true,
      fields,
      count: fields.length
    });

  } catch (error: any) {
    console.error('Error fetching custom fields:', error);
    res.status(500).json({ 
      error: 'Failed to fetch custom fields',
      code: 'FETCH_FIELDS_ERROR',
      message: error.message
    });
  }
});

// Create a new custom field
router.post('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      return res.status(400).json({ 
        error: 'X-Tenant-ID header is required',
        code: 'MISSING_TENANT_ID'
      });
    }

    const {
      name,
      label,
      field_type,
      applies_to,
      validation_rules,
      conditional_logic,
      display_order,
      is_required,
      is_active,
      default_value,
      help_text,
      options
    } = req.body;

    // Validate required fields
    if (!name || !label || !field_type || !applies_to) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        code: 'VALIDATION_ERROR',
        required: ['name', 'label', 'field_type', 'applies_to']
      });
    }

    // Validate field type
    const validFieldTypes = ['text', 'textarea', 'number', 'date', 'datetime', 'boolean', 'dropdown', 'multi_select', 'file_upload', 'rich_text'];
    if (!validFieldTypes.includes(field_type)) {
      return res.status(400).json({ 
        error: 'Invalid field type',
        code: 'INVALID_FIELD_TYPE',
        validTypes: validFieldTypes
      });
    }

    // Validate entity type
    const validEntityTypes = ['patients', 'appointments', 'medical_records'];
    if (!validEntityTypes.includes(applies_to)) {
      return res.status(400).json({ 
        error: 'Invalid entity type',
        code: 'INVALID_ENTITY_TYPE',
        validTypes: validEntityTypes
      });
    }

    // Validate options for dropdown/multi_select fields
    if (['dropdown', 'multi_select'].includes(field_type)) {
      if (!options || !Array.isArray(options) || options.length === 0) {
        return res.status(400).json({ 
          error: 'Options are required for dropdown and multi-select fields',
          code: 'MISSING_OPTIONS'
        });
      }
    }

    const fieldData = {
      name,
      label,
      field_type,
      applies_to,
      validation_rules: validation_rules || {},
      conditional_logic: conditional_logic || {},
      display_order: display_order || 0,
      is_required: is_required || false,
      is_active: is_active !== false,
      default_value,
      help_text,
      options
    };

    const field = await customFieldsService.createField(tenantId, fieldData);

    res.status(201).json({
      success: true,
      message: 'Custom field created successfully',
      field
    });

  } catch (error: any) {
    console.error('Error creating custom field:', error);
    
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({ 
        error: 'A field with this name already exists for this entity type',
        code: 'DUPLICATE_FIELD_NAME'
      });
    }

    res.status(500).json({ 
      error: 'Failed to create custom field',
      code: 'CREATE_FIELD_ERROR',
      message: error.message
    });
  }
});

// Get a specific custom field
router.get('/field/:fieldId', async (req: Request, res: Response) => {
  try {
    const { fieldId } = req.params;
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      return res.status(400).json({ 
        error: 'X-Tenant-ID header is required',
        code: 'MISSING_TENANT_ID'
      });
    }

    const field = await customFieldsService.getFieldById(tenantId, parseInt(fieldId));

    res.json({
      success: true,
      field
    });

  } catch (error: any) {
    console.error('Error fetching custom field:', error);
    
    if (error.message === 'Custom field not found') {
      return res.status(404).json({ 
        error: 'Custom field not found',
        code: 'FIELD_NOT_FOUND'
      });
    }

    res.status(500).json({ 
      error: 'Failed to fetch custom field',
      code: 'FETCH_FIELD_ERROR',
      message: error.message
    });
  }
});

// Update a custom field
router.put('/field/:fieldId', async (req: Request, res: Response) => {
  try {
    const { fieldId } = req.params;
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      return res.status(400).json({ 
        error: 'X-Tenant-ID header is required',
        code: 'MISSING_TENANT_ID'
      });
    }

    const field = await customFieldsService.updateField(tenantId, parseInt(fieldId), req.body);

    res.json({
      success: true,
      message: 'Custom field updated successfully',
      field
    });

  } catch (error: any) {
    console.error('Error updating custom field:', error);
    
    if (error.message === 'Custom field not found') {
      return res.status(404).json({ 
        error: 'Custom field not found',
        code: 'FIELD_NOT_FOUND'
      });
    }

    res.status(500).json({ 
      error: 'Failed to update custom field',
      code: 'UPDATE_FIELD_ERROR',
      message: error.message
    });
  }
});

// Delete a custom field
router.delete('/field/:fieldId', async (req: Request, res: Response) => {
  try {
    const { fieldId } = req.params;
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      return res.status(400).json({ 
        error: 'X-Tenant-ID header is required',
        code: 'MISSING_TENANT_ID'
      });
    }

    await customFieldsService.deleteField(tenantId, parseInt(fieldId));

    res.json({
      success: true,
      message: 'Custom field deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting custom field:', error);
    
    if (error.message === 'Custom field not found') {
      return res.status(404).json({ 
        error: 'Custom field not found',
        code: 'FIELD_NOT_FOUND'
      });
    }

    res.status(500).json({ 
      error: 'Failed to delete custom field',
      code: 'DELETE_FIELD_ERROR',
      message: error.message
    });
  }
});

// Save field value for an entity
router.post('/:entityType/:entityId/values', async (req: Request, res: Response) => {
  try {
    const { entityType, entityId } = req.params;
    const { field_id, value } = req.body;
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      return res.status(400).json({ 
        error: 'X-Tenant-ID header is required',
        code: 'MISSING_TENANT_ID'
      });
    }

    if (!field_id) {
      return res.status(400).json({ 
        error: 'field_id is required',
        code: 'MISSING_FIELD_ID'
      });
    }

    // Validate entity type
    const validEntityTypes = ['patients', 'appointments', 'medical_records'];
    if (!validEntityTypes.includes(entityType)) {
      return res.status(400).json({ 
        error: 'Invalid entity type',
        code: 'INVALID_ENTITY_TYPE',
        validTypes: validEntityTypes
      });
    }

    await customFieldsService.saveFieldValue(
      tenantId, 
      parseInt(field_id), 
      entityType, 
      parseInt(entityId), 
      value
    );

    res.json({
      success: true,
      message: 'Field value saved successfully'
    });

  } catch (error: any) {
    console.error('Error saving field value:', error);
    res.status(500).json({ 
      error: 'Failed to save field value',
      code: 'SAVE_VALUE_ERROR',
      message: error.message
    });
  }
});

// Get field values for an entity
router.get('/:entityType/:entityId/values', async (req: Request, res: Response) => {
  try {
    const { entityType, entityId } = req.params;
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      return res.status(400).json({ 
        error: 'X-Tenant-ID header is required',
        code: 'MISSING_TENANT_ID'
      });
    }

    // Validate entity type
    const validEntityTypes = ['patients', 'appointments', 'medical_records'];
    if (!validEntityTypes.includes(entityType)) {
      return res.status(400).json({ 
        error: 'Invalid entity type',
        code: 'INVALID_ENTITY_TYPE',
        validTypes: validEntityTypes
      });
    }

    const values = await customFieldsService.getFieldValues(
      tenantId, 
      entityType, 
      parseInt(entityId)
    );

    res.json({
      success: true,
      values
    });

  } catch (error: any) {
    console.error('Error fetching field values:', error);
    res.status(500).json({ 
      error: 'Failed to fetch field values',
      code: 'FETCH_VALUES_ERROR',
      message: error.message
    });
  }
});

export default router;