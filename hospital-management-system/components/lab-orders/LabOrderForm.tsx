/**
 * Lab Order Form Component
 * 
 * Create new lab orders with test selection
 */

'use client';

import { useState } from 'react';
import { useLabOrderMutations } from '@/hooks/useLabOrders';
import { CreateLabOrderData } from '@/lib/api/lab-orders';
import { LabTest } from '@/lib/api/lab-tests';
import LabTestsList from './LabTestsList';
import { X, AlertCircle, CheckCircle } from 'lucide-react';

interface LabOrderFormProps {
  patientId: number;
  patientName: string;
  medicalRecordId?: number;
  appointmentId?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function LabOrderForm({
  patientId,
  patientName,
  medicalRecordId,
  appointmentId,
  onSuccess,
  onCancel
}: LabOrderFormProps) {
  const [selectedTests, setSelectedTests] = useState<number[]>([]);
  const [selectedTestsDetails, setSelectedTestsDetails] = useState<LabTest[]>([]);
  const [priority, setPriority] = useState<'routine' | 'urgent' | 'stat'>('routine');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const { createLabOrder, loading, error } = useLabOrderMutations();

  const handleTestSelect = (test: LabTest) => {
    if (selectedTests.includes(test.id)) {
      // Deselect
      setSelectedTests(selectedTests.filter(id => id !== test.id));
      setSelectedTestsDetails(selectedTestsDetails.filter(t => t.id !== test.id));
    } else {
      // Select
      setSelectedTests([...selectedTests, test.id]);
      setSelectedTestsDetails([...selectedTestsDetails, test]);
    }
  };

  const handleRemoveTest = (testId: number) => {
    setSelectedTests(selectedTests.filter(id => id !== testId));
    setSelectedTestsDetails(selectedTestsDetails.filter(t => t.id !== testId));
  };

  const calculateTotalPrice = () => {
    return selectedTestsDetails.reduce((sum, test) => sum + (test.price || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedTests.length === 0) {
      return;
    }

    try {
      const orderData: CreateLabOrderData = {
        patient_id: patientId,
        medical_record_id: medicalRecordId,
        appointment_id: appointmentId,
        ordered_by: 1, // TODO: Get from auth context
        priority,
        clinical_notes: clinicalNotes || undefined,
        special_instructions: specialInstructions || undefined,
        test_ids: selectedTests
      };

      await createLabOrder(orderData);
      setShowSuccess(true);
      
      // Reset form
      setTimeout(() => {
        setShowSuccess(false);
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (err) {
      console.error('Failed to create lab order:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p className="text-green-800 font-medium">Lab order created successfully!</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Patient Information</h3>
          <p className="text-blue-800">{patientName}</p>
          <p className="text-sm text-blue-600">Patient ID: {patientId}</p>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900 mb-4">Order Details</h3>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['routine', 'urgent', 'stat'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                    priority === p
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Clinical Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Clinical Notes
            </label>
            <textarea
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              rows={3}
              placeholder="Enter clinical notes or reason for test..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Special Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Special Instructions
            </label>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              rows={2}
              placeholder="Enter any special instructions..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Selected Tests */}
        {selectedTests.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Selected Tests ({selectedTests.length})
            </h3>
            <div className="space-y-2">
              {selectedTestsDetails.map((test) => (
                <div
                  key={test.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{test.test_name}</p>
                    <p className="text-sm text-gray-500">
                      {test.test_code} • {test.specimen_type}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {test.price && (
                      <span className="font-medium text-gray-900">
                        ${test.price.toFixed(2)}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveTest(test.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Price */}
            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
              <span className="font-semibold text-gray-900">Total Price:</span>
              <span className="text-xl font-bold text-blue-600">
                ${calculateTotalPrice().toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Test Selection */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Select Tests <span className="text-red-500">*</span>
          </h3>
          <LabTestsList
            onSelectTest={handleTestSelect}
            selectedTests={selectedTests}
            selectionMode={true}
          />
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading || selectedTests.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            {loading ? 'Creating Order...' : 'Create Lab Order'}
          </button>
        </div>
      </form>
    </div>
  );
}
