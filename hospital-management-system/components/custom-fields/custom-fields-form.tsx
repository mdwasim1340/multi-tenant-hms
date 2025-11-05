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
