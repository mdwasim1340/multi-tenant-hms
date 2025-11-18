/**
 * Lab Orders Main Page
 * 
 * Manage laboratory orders and specimen collection
 */

'use client';

import { useState } from 'react';
import { useLabOrders, useLabOrderStatistics } from '@/hooks/useLabOrders';
import LabOrdersList from '@/components/lab-orders/LabOrdersList';
import LabOrderDetails from '@/components/lab-orders/LabOrderDetails';
import LabOrderForm from '@/components/lab-orders/LabOrderForm';
import { LabOrder } from '@/lib/api/lab-orders';
import { Plus, ClipboardList, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function LabOrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const { data: statistics } = useLabOrderStatistics();

  const handleSelectOrder = (order: LabOrder) => {
    setSelectedOrder(order);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedOrder(null);
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ClipboardList className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Lab Orders</h1>
                <p className="text-gray-600">Manage laboratory test orders and specimen collection</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              New Order
            </button>
          </div>

          {/* Statistics */}
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Total Orders</p>
                    <p className="text-2xl font-bold text-blue-900">{statistics.total_orders}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-600 font-medium">Pending</p>
                    <p className="text-2xl font-bold text-yellow-900">{statistics.pending_orders}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Completed</p>
                    <p className="text-2xl font-bold text-green-900">{statistics.completed_orders}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-600 font-medium">Urgent/STAT</p>
                    <p className="text-2xl font-bold text-red-900">
                      {statistics.urgent_orders + statistics.stat_orders}
                    </p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showCreateForm ? (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Create Lab Order</h2>
            <LabOrderForm
              patientId={1} // TODO: Get from patient selection
              patientName="John Doe" // TODO: Get from patient selection
              onSuccess={handleCreateSuccess}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        ) : showDetails && selectedOrder ? (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <LabOrderDetails
              orderId={selectedOrder.id}
              onClose={handleCloseDetails}
              onUpdate={() => {
                // Refresh list
              }}
            />
          </div>
        ) : (
          <LabOrdersList onSelectOrder={handleSelectOrder} />
        )}
      </div>
    </div>
  );
}
