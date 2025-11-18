/**
 * Lab Order Details Component
 * 
 * View and manage lab order details
 */

'use client';

import { useState } from 'react';
import { useLabOrder } from '@/hooks/useLabOrders';
import { useLabOrderMutations } from '@/hooks/useLabOrders';
import { useOrderResults } from '@/hooks/useLabResults';
import { LabOrder } from '@/lib/api/lab-orders';
import {
  Calendar,
  User,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  TestTube,
  X,
  Play,
  Ban
} from 'lucide-react';
import { format } from 'date-fns';

interface LabOrderDetailsProps {
  orderId: number;
  onClose?: () => void;
  onUpdate?: () => void;
}

export default function LabOrderDetails({
  orderId,
  onClose,
  onUpdate
}: LabOrderDetailsProps) {
  const { data: order, loading, error, refetch } = useLabOrder(orderId);
  const { data: results } = useOrderResults(orderId);
  const {
    collectSpecimen,
    startProcessing,
    cancelLabOrder,
    loading: mutating
  } = useLabOrderMutations();

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const handleCollectSpecimen = async () => {
    try {
      await collectSpecimen(orderId, 1); // TODO: Get from auth context
      refetch();
      onUpdate?.();
    } catch (err) {
      console.error('Failed to collect specimen:', err);
    }
  };

  const handleStartProcessing = async () => {
    try {
      await startProcessing(orderId);
      refetch();
      onUpdate?.();
    } catch (err) {
      console.error('Failed to start processing:', err);
    }
  };

  const handleCancelOrder = async () => {
    try {
      await cancelLabOrder(orderId, cancelReason);
      setShowCancelModal(false);
      refetch();
      onUpdate?.();
    } catch (err) {
      console.error('Failed to cancel order:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'collected':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'routine':
        return 'bg-gray-100 text-gray-800';
      case 'urgent':
        return 'bg-orange-100 text-orange-800';
      case 'stat':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error || 'Order not found'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold text-gray-900">{order.order_number}</h2>
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
              {order.status}
            </span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(order.priority)}`}>
              {order.priority.toUpperCase()}
            </span>
          </div>
          <p className="text-gray-600">
            Ordered on {format(new Date(order.order_date), 'MMMM dd, yyyy')}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Patient Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Patient Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Patient Name</p>
            <p className="font-medium text-gray-900">{order.patient_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Patient Number</p>
            <p className="font-medium text-gray-900">{order.patient_number}</p>
          </div>
        </div>
      </div>

      {/* Order Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Order Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Ordered By</p>
            <p className="font-medium text-gray-900">Dr. {order.ordered_by_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Order Date</p>
            <p className="font-medium text-gray-900">
              {format(new Date(order.order_date), 'MMM dd, yyyy HH:mm')}
            </p>
          </div>
          {order.collection_date && (
            <>
              <div>
                <p className="text-sm text-gray-500">Collected By</p>
                <p className="font-medium text-gray-900">{order.collected_by_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Collection Date</p>
                <p className="font-medium text-gray-900">
                  {format(new Date(order.collection_date), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Clinical Notes */}
        {order.clinical_notes && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-2">Clinical Notes</p>
            <p className="text-gray-900">{order.clinical_notes}</p>
          </div>
        )}

        {/* Special Instructions */}
        {order.special_instructions && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-2">Special Instructions</p>
            <p className="text-gray-900">{order.special_instructions}</p>
          </div>
        )}
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">
          Tests Ordered ({order.items?.length || 0})
        </h3>
        <div className="space-y-3">
          {order.items?.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <TestTube className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-gray-900">{item.test_name}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{item.test_code}</span>
                  <span>•</span>
                  <span>{item.specimen_type}</span>
                  {item.turnaround_time && (
                    <>
                      <span>•</span>
                      <span>{item.turnaround_time}h turnaround</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                  {item.status}
                </span>
                {item.price && (
                  <span className="font-medium text-gray-900">
                    ${item.price.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Total Price */}
        {order.total_price && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
            <span className="font-semibold text-gray-900">Total Price:</span>
            <span className="text-xl font-bold text-blue-600">
              ${order.total_price.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Results Summary */}
      {results && results.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Results ({results.length})
          </h3>
          <div className="space-y-2">
            {results.map((result) => (
              <div
                key={result.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{result.test_name}</p>
                  <p className="text-sm text-gray-600">
                    {result.result_value} {result.result_unit}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {result.is_abnormal && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Abnormal
                    </span>
                  )}
                  {result.verified_at ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Clock className="h-5 w-5 text-yellow-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
        {order.status === 'pending' && (
          <>
            <button
              onClick={handleCollectSpecimen}
              disabled={mutating}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <CheckCircle className="h-5 w-5" />
              Collect Specimen
            </button>
            <button
              onClick={() => setShowCancelModal(true)}
              disabled={mutating}
              className="px-6 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50 flex items-center gap-2"
            >
              <Ban className="h-5 w-5" />
              Cancel Order
            </button>
          </>
        )}
        {order.status === 'collected' && (
          <button
            onClick={handleStartProcessing}
            disabled={mutating}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Play className="h-5 w-5" />
            Start Processing
          </button>
        )}
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Cancel Lab Order
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to cancel this order? This action cannot be undone.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cancellation Reason
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                placeholder="Enter reason for cancellation..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={mutating}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={mutating}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {mutating ? 'Cancelling...' : 'Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
