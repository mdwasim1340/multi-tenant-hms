'use client';

import { useState } from 'react';
import { FieldBuilder } from '@/components/custom-fields/field-builder';
import { CustomFieldsForm } from '@/components/custom-fields/custom-fields-form';
import { EntityType } from '@/lib/types/customFields';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { FormInput, Eye, EyeOff } from 'lucide-react';

export default function CustomFieldsPage() {
  const [entityType, setEntityType] = useState<EntityType>('patients');
  const [showBuilder, setShowBuilder] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleFieldCreated = () => {
    setShowBuilder(false);
    setRefreshKey(prev => prev + 1); // Force refresh of the form
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <FormInput className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Custom Fields Management</h1>
          <p className="text-muted-foreground">
            Create and manage custom fields for patients, appointments, and medical records
          </p>
        </div>
      </div>

      {/* Entity Type Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Entity Type</CardTitle>
          <CardDescription>
            Select the type of entity you want to manage custom fields for
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Label htmlFor="entity-type">Entity Type:</Label>
            <Select value={entityType} onValueChange={(value) => setEntityType(value as EntityType)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="patients">Patients</SelectItem>
                <SelectItem value="appointments">Appointments</SelectItem>
                <SelectItem value="medical_records">Medical Records</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Field Builder */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Create Custom Field</CardTitle>
              <CardDescription>
                Add new custom fields for {entityType.replace('_', ' ')}
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowBuilder(!showBuilder)}
              variant={showBuilder ? "outline" : "default"}
              className="flex items-center gap-2"
            >
              {showBuilder ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  Hide Builder
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  Show Builder
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        {showBuilder && (
          <CardContent>
            <FieldBuilder
              entityType={entityType}
              onSuccess={handleFieldCreated}
            />
          </CardContent>
        )}
      </Card>

      {/* Custom Fields Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Fields Preview</CardTitle>
          <CardDescription>
            Preview how custom fields will appear in forms for {entityType.replace('_', ' ')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CustomFieldsForm
            key={`${entityType}-${refreshKey}`}
            entityType={entityType}
            onValuesChange={(values) => {
              console.log('Custom field values:', values);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
