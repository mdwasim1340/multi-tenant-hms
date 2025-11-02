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
