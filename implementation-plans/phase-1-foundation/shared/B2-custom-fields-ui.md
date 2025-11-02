# B2: Custom Fields UI Components

**Agent:** Shared Components Agent B2  
**Track:** Custom Fields System  
**Dependencies:** B1 (Custom Fields Engine) must be complete  
**Estimated Time:** 3-4 days  
**Complexity:** Medium

## Objective
Create reusable UI components for managing and displaying custom fields in both admin dashboard and hospital system, with support for all field types and conditional logic.

## Current State Analysis
- ✅ Custom fields engine implemented (B1)
- ✅ Backend API for custom fields ready
- ✅ Next.js applications operational
- ❌ No custom fields UI components
- ❌ No form builder interface
- ❌ No dynamic form rendering

## Implementation Steps

### Step 1: Shared Types (Day 1)
Create TypeScript types for frontend.

**File:** `hospital-management-system/lib/types/customFields.ts`
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

export interface CustomFieldValue {
  [fieldName: string]: any;
}
```

**Copy same file to:** `admin-dashboard/lib/types/customFields.ts`

### Step 2: Custom Fields Hook (Day 1)
Create React hook for managing custom fields.

**File:** `hospital-management-system/hooks/use-custom-fields.ts`
```typescript
import { useState, useEffect } from 'react';
import { CustomField, EntityType, CustomFieldValue } from '@/lib/types/customFields';
import { api } from '@/lib/api';

export function useCustomFields(entityType: EntityType) {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFields();
  }, [entityType]);

  const fetchFields = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/custom-fields/${entityType}`);
      setFields(response.data.fields || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch custom fields');
      console.error('Error fetching custom fields:', err);
    } finally {
      setLoading(false);
    }
  };

  const createField = async (fieldData: Partial<CustomField>) => {
    try {
      const response = await api.post('/api/custom-fields', fieldData);
      await fetchFields(); // Refresh list
      return response.data.field;
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Failed to create field');
    }
  };

  const saveFieldValue = async (
    entityId: number,
    fieldId: number,
    value: any
  ) => {
    try {
      await api.post(`/api/custom-fields/${entityType}/${entityId}/values`, {
        field_id: fieldId,
        value: value
      });
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Failed to save field value');
    }
  };

  const getFieldValues = async (entityId: number): Promise<CustomFieldValue> => {
    try {
      const response = await api.get(
        `/api/custom-fields/${entityType}/${entityId}/values`
      );
      return response.data.values || {};
    } catch (err: any) {
      console.error('Error fetching field values:', err);
      return {};
    }
  };

  return {
    fields,
    loading,
    error,
    createField,
    saveFieldValue,
    getFieldValues,
    refetch: fetchFields
  };
}
```

**Copy same file to:** `admin-dashboard/hooks/use-custom-fields.ts`

### Step 3: Dynamic Field Renderer Component (Day 2)
Create component to render any custom field type.

**File:** `hospital-management-system/components/custom-fields/field-renderer.tsx`
```typescript
'use client';

import { CustomField } from '@/lib/types/customFields';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface FieldRendererProps {
  field: CustomField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}

export function FieldRenderer({ field, value, onChange, error }: FieldRendererProps) {
  const renderField = () => {
    switch (field.field_type) {
      case 'text':
        return (
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.help_text || ''}
            required={field.is_required}
            minLength={field.validation_rules.min_length}
            maxLength={field.validation_rules.max_length}
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.help_text || ''}
            required={field.is_required}
            minLength={field.validation_rules.min_length}
            maxLength={field.validation_rules.max_length}
            rows={4}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            placeholder={field.help_text || ''}
            required={field.is_required}
            min={field.validation_rules.min_value}
            max={field.validation_rules.max_value}
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            required={field.is_required}
          />
        );

      case 'datetime':
        return (
          <Input
            type="datetime-local"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            required={field.is_required}
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={value || false}
              onCheckedChange={onChange}
            />
            <span className="text-sm text-gray-600">{field.help_text}</span>
          </div>
        );

      case 'dropdown':
        return (
          <Select value={value || ''} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder={field.help_text || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.id} value={option.option_value}>
                  {option.option_label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'multi_select':
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <Checkbox
                  checked={(value || []).includes(option.option_value)}
                  onCheckedChange={(checked) => {
                    const currentValues = value || [];
                    if (checked) {
                      onChange([...currentValues, option.option_value]);
                    } else {
                      onChange(currentValues.filter((v: string) => v !== option.option_value));
                    }
                  }}
                />
                <Label>{option.option_label}</Label>
              </div>
            ))}
          </div>
        );

      case 'file_upload':
        return (
          <Input
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                // TODO: Implement file upload to S3
                onChange(file.name);
              }
            }}
            accept={field.validation_rules.allowed_extensions?.map(ext => `.${ext}`).join(',')}
          />
        );

      default:
        return <div>Unsupported field type: {field.field_type}</div>;
    }
  };

  return (
    <div className="space-y-2">
      <Label>
        {field.label}
        {field.is_required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {renderField()}
      {field.help_text && !['boolean'].includes(field.field_type) && (
        <p className="text-sm text-gray-500">{field.help_text}</p>
      )}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
```

**Copy same file to:** `admin-dashboard/components/custom-fields/field-renderer.tsx`

### Step 4: Custom Fields Form Component (Day 2)
Create component to render all custom fields for an entity.

**File:** `hospital-management-system/components/custom-fields/custom-fields-form.tsx`
```typescript
'use client';

import { useState, useEffect } from 'react';
import { CustomField, EntityType, CustomFieldValue } from '@/lib/types/customFields';
import { FieldRenderer } from './field-renderer';
import { useCustomFields } from '@/hooks/use-custom-fields';

interface CustomFieldsFormProps {
  entityType: EntityType;
  entityId?: number;
  onValuesChange?: (values: CustomFieldValue) => void;
  initialValues?: CustomFieldValue;
}

export function CustomFieldsForm({
  entityType,
  entityId,
  onValuesChange,
  initialValues = {}
}: CustomFieldsFormProps) {
  const { fields, loading } = useCustomFields(entityType);
  const [values, setValues] = useState<CustomFieldValue>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [visibleFields, setVisibleFields] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Evaluate conditional logic for all fields
    const visible = new Set<number>();
    fields.forEach(field => {
      if (shouldShowField(field, values)) {
        visible.add(field.id);
      }
    });
    setVisibleFields(visible);
  }, [fields, values]);

  const shouldShowField = (field: CustomField, currentValues: CustomFieldValue): boolean => {
    if (!field.conditional_logic?.show_if) return true;

    const rules = field.conditional_logic.show_if;
    for (const rule of rules) {
      const fieldValue = currentValues[rule.field_name];
      
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
  };

  const handleValueChange = (field: CustomField, value: any) => {
    const newValues = { ...values, [field.name]: value };
    setValues(newValues);
    
    // Clear error for this field
    if (errors[field.name]) {
      const newErrors = { ...errors };
      delete newErrors[field.name];
      setErrors(newErrors);
    }

    // Notify parent component
    if (onValuesChange) {
      onValuesChange(newValues);
    }
  };

  const validateField = (field: CustomField, value: any): string | null => {
    if (field.is_required && (value === null || value === undefined || value === '')) {
      return 'This field is required';
    }

    const rules = field.validation_rules;

    if (field.field_type === 'text' || field.field_type === 'textarea') {
      if (rules.min_length && value.length < rules.min_length) {
        return `Minimum length is ${rules.min_length}`;
      }
      if (rules.max_length && value.length > rules.max_length) {
        return `Maximum length is ${rules.max_length}`;
      }
      if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
        return 'Invalid format';
      }
    }

    if (field.field_type === 'number') {
      if (rules.min_value !== undefined && value < rules.min_value) {
        return `Minimum value is ${rules.min_value}`;
      }
      if (rules.max_value !== undefined && value > rules.max_value) {
        return `Maximum value is ${rules.max_value}`;
      }
    }

    return null;
  };

  const validateAll = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    fields.forEach(field => {
      if (visibleFields.has(field.id)) {
        const error = validateField(field, values[field.name]);
        if (error) {
          newErrors[field.name] = error;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  if (loading) {
    return <div className="text-center py-4">Loading custom fields...</div>;
  }

  if (fields.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Additional Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields
          .filter(field => visibleFields.has(field.id))
          .sort((a, b) => a.display_order - b.display_order)
          .map(field => (
            <div key={field.id} className="col-span-1">
              <FieldRenderer
                field={field}
                value={values[field.name]}
                onChange={(value) => handleValueChange(field, value)}
                error={errors[field.name]}
              />
            </div>
          ))}
      </div>
    </div>
  );
}
```

**Copy same file to:** `admin-dashboard/components/custom-fields/custom-fields-form.tsx`

### Step 5: Field Builder Component (Day 3)
Create component for admins to create custom fields.

**File:** `admin-dashboard/components/custom-fields/field-builder.tsx`
```typescript
'use client';

import { useState } from 'react';
import { CustomField, FieldType, EntityType } from '@/lib/types/customFields';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useCustomFields } from '@/hooks/use-custom-fields';
import { toast } from 'sonner';

interface FieldBuilderProps {
  entityType: EntityType;
  onSuccess?: () => void;
}

export function FieldBuilder({ entityType, onSuccess }: FieldBuilderProps) {
  const { createField } = useCustomFields(entityType);
  const [loading, setLoading] = useState(false);
  const [fieldData, setFieldData] = useState<Partial<CustomField>>({
    applies_to: entityType,
    field_type: 'text',
    is_required: false,
    validation_rules: {},
    conditional_logic: {},
    display_order: 0
  });
  const [options, setOptions] = useState<Array<{ value: string; label: string }>>([]);

  const fieldTypes: Array<{ value: FieldType; label: string }> = [
    { value: 'text', label: 'Text' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'datetime', label: 'Date & Time' },
    { value: 'boolean', label: 'Yes/No' },
    { value: 'dropdown', label: 'Dropdown' },
    { value: 'multi_select', label: 'Multi-Select' },
    { value: 'file_upload', label: 'File Upload' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fieldData.name || !fieldData.label) {
      toast.error('Name and label are required');
      return;
    }

    try {
      setLoading(true);
      
      const dataToSubmit = {
        ...fieldData,
        options: (fieldData.field_type === 'dropdown' || fieldData.field_type === 'multi_select')
          ? options.map((opt, idx) => ({
              option_value: opt.value,
              option_label: opt.label,
              display_order: idx
            }))
          : undefined
      };

      await createField(dataToSubmit);
      toast.success('Custom field created successfully');
      
      // Reset form
      setFieldData({
        applies_to: entityType,
        field_type: 'text',
        is_required: false,
        validation_rules: {},
        conditional_logic: {},
        display_order: 0
      });
      setOptions([]);
      
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const addOption = () => {
    setOptions([...options, { value: '', label: '' }]);
  };

  const updateOption = (index: number, field: 'value' | 'label', value: string) => {
    const newOptions = [...options];
    newOptions[index][field] = value;
    setOptions(newOptions);
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const needsOptions = fieldData.field_type === 'dropdown' || fieldData.field_type === 'multi_select';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Field Name (Internal)</Label>
          <Input
            value={fieldData.name || ''}
            onChange={(e) => setFieldData({ ...fieldData, name: e.target.value })}
            placeholder="e.g., blood_type"
            required
          />
        </div>

        <div>
          <Label>Field Label (Display)</Label>
          <Input
            value={fieldData.label || ''}
            onChange={(e) => setFieldData({ ...fieldData, label: e.target.value })}
            placeholder="e.g., Blood Type"
            required
          />
        </div>
      </div>

      <div>
        <Label>Field Type</Label>
        <Select
          value={fieldData.field_type}
          onValueChange={(value) => setFieldData({ ...fieldData, field_type: value as FieldType })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {fieldTypes.map(type => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Help Text (Optional)</Label>
        <Textarea
          value={fieldData.help_text || ''}
          onChange={(e) => setFieldData({ ...fieldData, help_text: e.target.value })}
          placeholder="Helpful description for users"
          rows={2}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          checked={fieldData.is_required}
          onCheckedChange={(checked) => setFieldData({ ...fieldData, is_required: checked as boolean })}
        />
        <Label>Required Field</Label>
      </div>

      {needsOptions && (
        <div className="space-y-2">
          <Label>Options</Label>
          {options.map((option, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="Value"
                value={option.value}
                onChange={(e) => updateOption(index, 'value', e.target.value)}
              />
              <Input
                placeholder="Label"
                value={option.label}
                onChange={(e) => updateOption(index, 'label', e.target.value)}
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => removeOption(index)}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addOption}>
            Add Option
          </Button>
        </div>
      )}

      <Button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Field'}
      </Button>
    </form>
  );
}
```

### Step 6: Testing (Day 4)
Create test page to verify all components.

**File:** `admin-dashboard/app/test-custom-fields/page.tsx`
```typescript
'use client';

import { useState } from 'react';
import { FieldBuilder } from '@/components/custom-fields/field-builder';
import { CustomFieldsForm } from '@/components/custom-fields/custom-fields-form';
import { EntityType } from '@/lib/types/customFields';

export default function TestCustomFieldsPage() {
  const [entityType, setEntityType] = useState<EntityType>('patients');
  const [showBuilder, setShowBuilder] = useState(false);

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold">Custom Fields Test Page</h1>

      <div className="border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Field Builder</h2>
        <button
          onClick={() => setShowBuilder(!showBuilder)}
          className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          {showBuilder ? 'Hide' : 'Show'} Builder
        </button>
        
        {showBuilder && (
          <FieldBuilder
            entityType={entityType}
            onSuccess={() => setShowBuilder(false)}
          />
        )}
      </div>

      <div className="border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Custom Fields Form</h2>
        <CustomFieldsForm
          entityType={entityType}
          onValuesChange={(values) => console.log('Values:', values)}
        />
      </div>
    </div>
  );
}
```

## Validation Checklist

### Components
- [ ] FieldRenderer handles all field types
- [ ] CustomFieldsForm renders fields correctly
- [ ] FieldBuilder creates fields successfully
- [ ] Conditional logic working
- [ ] Validation working

### Integration
- [ ] Components work in hospital system
- [ ] Components work in admin dashboard
- [ ] API calls successful
- [ ] Error handling working

### Testing
- [ ] Can create custom fields
- [ ] Can render custom fields
- [ ] Can save field values
- [ ] Conditional logic shows/hides fields
- [ ] Validation prevents invalid data

## Success Criteria
- All field types render correctly
- Form validation working
- Conditional logic functional
- Field builder creates fields
- Components reusable across apps
- User-friendly interface

## Next Steps
After completion, this enables:
- Agent HM1 to integrate custom fields in patient management
- Agent HM2 to add custom fields to appointments
- Agent HM3 to use custom fields in medical records

## Notes for AI Agent
- Test all field types thoroughly
- Ensure responsive design
- Handle edge cases gracefully
- Make components truly reusable
- Follow existing UI patterns
- Test conditional logic extensively
