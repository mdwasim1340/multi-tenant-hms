/**
 * Lab Result Entry Form Component
 * 
 * Enter and update lab test results
 */

'use client';

import { useState, useEffect } from 'react';
import { useLabResultMutations } from '@/hooks/useLabResults';
import { CreateLabResultData } from '@/lib/api/lab-results';
import { LabOrderItem } from '@/lib/api/lab-orders';
import { AlertCircle, CheckCircle, Save, X } from 'lucide-react';

interface LabResultFormProps {
  orderItem: LabOrderItem;
  existingResult?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function LabResultForm({
  orderItem,
  existingResult,
  onSuccess,
  onCancel
}: LabResultFormProps) {
  const [resultType, setResultType] = useState<'numeric' | 'text' | 'value'>('numeric');
  const [resultNumeric, setResultNumeric] = useState('');
  const [resultValue, setResultValue] = useState('');
  const [resultText, setResultText] = useState('');
  const [resultUnit, setResultUnit] = useState('');
  const [referenceRange, setReferenceRange] = useState('');
  const [interpretation, setInterpretation] = useState('');
  const [notes, setNotes] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const { addLabResult, updateLabResult, loading, error } = useLabResultMutations();

  // Initialize form with existing result
  useEffect(() => {
    if (existingResult) {
      if (existingResult.result_numeric !== null) {
        setResultType('numeric');
        setResultNumeric(existingResult.result_numeric.toString());
      } else if (existingResult.result_text) {
        setResultType('text');
        setResultText(existingResult.result_text);
      } else if (existingResult.result_value) {
        setResultType('value');
        setResultValue(existingResult.result_value);
      }
      
      setResultUnit(existingResult.result_unit || '');
      setReferenceRange(existingResult.reference_range || '');
      setInterpretation(existingResult.interpretation || '');
      setNotes(existingResult.notes || '');
    } else {
      // Set default unit from test
      setResultUnit(orderItem.test_unit || '');
    }
  }, [existingResult, orderItem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const resultData: CreateLabResultData = {
        order_item_id: orderItem.id,
        result_unit: resultUnit || undefined,
        reference_range: referenceRange || undefined,
        performed_by: 1, // TODO: Get from auth context
        interpretation: interpretation || undefined,
        notes: notes || undefined
      };

      // Add result based on type
      if (resultType === 'numeric') {
        resultData.result_numeric = parseFloat(resultNumeric);
      } else if (resultType === 'text') {
        resultData.result_text = resultText;
      } else {
        resultData.result_value = resultValue;
      }

      if (existingResult) {
        await updateLabResult(existingResult.id, resultData);
      } else {
        await addLabResult(resultData);
      }

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (err) {
      console.error('Failed to save result:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p className="text-green-800 font-medium">
            Result {existingResult ? 'updated' : 'saved'} successfully!
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Test Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Test Information</h3>
        <div className="space-y-1">
          <p className="text-blue-800 font-medium">{orderItem.test_name}</p>
          <p className="text-sm text-blue-600">Code: {orderItem.test_code}</p>
          <p className="text-sm text-blue-600">Specimen: {orderItem.specimen_type}</p>
          {orderItem.test_unit && (
            <p className="text-sm text-blue-600">Unit: {orderItem.test_unit}</p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Result Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Result Type <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setResultType('numeric')}
              className={`px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                resultType === 'numeric'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              Numeric
            </button>
            <button
              type="button"
              onClick={() => setResultType('value')}
              className={`px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                resultType === 'value'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              Value
            </button>
            <button
              type="button"
              onClick={() => setResultType('text')}
              className={`px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                resultType === 'text'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              Text
            </button>
          </div>
        </div>

        {/* Result Input */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Result Value</h3>

          {resultType === 'numeric' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numeric Value <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={resultNumeric}
                  onChange={(e) => setResultNumeric(e.target.value)}
                  required
                  placeholder="Enter numeric result"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit
                </label>
                <input
                  type="text"
                  value={resultUnit}
                  onChange={(e) => setResultUnit(e.target.value)}
                  placeholder="e.g., mg/dL, mmol/L"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {resultType === 'value' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Result Value <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={resultValue}
                onChange={(e) => setResultValue(e.target.value)}
                required
                placeholder="e.g., Positive, Negative, Normal"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {resultType === 'text' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Text Result <span className="text-red-500">*</span>
              </label>
              <textarea
                value={resultText}
                onChange={(e) => setResultText(e.target.value)}
                required
                rows={4}
                placeholder="Enter detailed text result..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Reference Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reference Range
            </label>
            <input
              type="text"
              value={referenceRange}
              onChange={(e) => setReferenceRange(e.target.value)}
              placeholder="e.g., 70-100 mg/dL"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-sm text-gray-500">
              Normal range for this test
            </p>
          </div>
        </div>

        {/* Interpretation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Interpretation
          </label>
          <textarea
            value={interpretation}
            onChange={(e) => setInterpretation(e.target.value)}
            rows={3}
            placeholder="Enter clinical interpretation of the result..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Additional notes or observations..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
            >
              <X className="h-5 w-5" />
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="h-5 w-5" />
            )}
            {loading ? 'Saving...' : existingResult ? 'Update Result' : 'Save Result'}
          </button>
        </div>
      </form>
    </div>
  );
}
