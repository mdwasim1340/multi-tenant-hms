'use client';

import { CustomField } from '@/lib/types/customFields';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { uploadFile } from '@/lib/s3-upload';

interface FieldRendererProps {
  field: CustomField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}

export function FieldRenderer({ field, value, onChange, error }: FieldRendererProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const fileUrl = await uploadFile(file);
      onChange(fileUrl);
    } catch (err) {
      console.error('Failed to upload file', err);
      // Optionally, set an error state to display to the user
    } finally {
      setIsUploading(false);
    }
  };

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
          <div>
            <Input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFileUpload(file);
                }
              }}
              accept={field.validation_rules.allowed_extensions?.map(ext => `.${ext}`).join(',')}
              disabled={isUploading}
            />
            {isUploading && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
          </div>
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
