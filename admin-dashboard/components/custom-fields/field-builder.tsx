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
    { value: 'file_upload', label: 'File Upload' },
    { value: 'rich_text', label: 'Rich Text' }
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
