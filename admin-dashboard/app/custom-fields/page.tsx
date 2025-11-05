'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FieldBuilder } from '@/components/custom-fields/field-builder';
import { CustomFieldsForm } from '@/components/custom-fields/custom-fields-form';
import { useCustomFields } from '@/hooks/use-custom-fields';
import { EntityType, CustomField } from '@/lib/types/customFields';
import { Plus, Settings, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function CustomFieldsPage() {
  const [selectedEntity, setSelectedEntity] = useState<EntityType>('patients');
  const [showBuilder, setShowBuilder] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { fields, loading, error, refetch } = useCustomFields(selectedEntity);

  const entityLabels = {
    patients: 'Patients',
    appointments: 'Appointments',
    medical_records: 'Medical Records'
  };

  const fieldTypeLabels = {
    text: 'Text',
    textarea: 'Text Area',
    number: 'Number',
    date: 'Date',
    datetime: 'Date & Time',
    boolean: 'Yes/No',
    dropdown: 'Dropdown',
    multi_select: 'Multi-Select',
    file_upload: 'File Upload',
    rich_text: 'Rich Text'
  };

  const handleFieldCreated = () => {
    setShowBuilder(false);
    refetch();
    toast.success('Custom field created successfully');
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading custom fields...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Custom Fields Management</h1>
          <p className="text-gray-600 mt-2">
            Create and manage custom fields for different entity types
          </p>
        </div>
        <Button onClick={() => setShowBuilder(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Custom Field
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Entity Type Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Entity Type</CardTitle>
          <CardDescription>
            Choose which entity type you want to manage custom fields for
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedEntity} onValueChange={(value) => setSelectedEntity(value as EntityType)}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(entityLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Field Builder Modal */}
      {showBuilder && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Create Custom Field</CardTitle>
                <CardDescription>
                  Add a new custom field for {entityLabels[selectedEntity]}
                </CardDescription>
              </div>
              <Button variant="outline" onClick={() => setShowBuilder(false)}>
                Cancel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <FieldBuilder
              entityType={selectedEntity}
              onSuccess={handleFieldCreated}
            />
          </CardContent>
        </Card>
      )}

      {/* Existing Fields */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Existing Fields for {entityLabels[selectedEntity]}</CardTitle>
              <CardDescription>
                {fields.length} custom field{fields.length !== 1 ? 's' : ''} configured
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2"
            >
              {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {fields.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No custom fields configured for {entityLabels[selectedEntity]}</p>
              <p className="text-sm">Click "Add Custom Field" to create your first field</p>
            </div>
          ) : (
            <div className="space-y-4">
              {fields
                .sort((a, b) => a.display_order - b.display_order)
                .map((field) => (
                  <div key={field.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{field.label}</h3>
                          <Badge variant="secondary">
                            {fieldTypeLabels[field.field_type]}
                          </Badge>
                          {field.is_required && (
                            <Badge variant="destructive">Required</Badge>
                          )}
                          {!field.is_active && (
                            <Badge variant="outline">Inactive</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          Internal name: <code className="bg-gray-100 px-1 rounded">{field.name}</code>
                        </p>
                        {field.help_text && (
                          <p className="text-sm text-gray-500">{field.help_text}</p>
                        )}
                        {field.options && field.options.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm font-medium mb-1">Options:</p>
                            <div className="flex flex-wrap gap-1">
                              {field.options.map((option) => (
                                <Badge key={option.id} variant="outline" className="text-xs">
                                  {option.option_label}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Order: {field.display_order}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Form */}
      {showPreview && fields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Form Preview</CardTitle>
            <CardDescription>
              This is how the custom fields will appear in forms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CustomFieldsForm
              entityType={selectedEntity}
              onValuesChange={(values) => console.log('Preview values:', values)}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
