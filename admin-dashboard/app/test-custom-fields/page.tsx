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
