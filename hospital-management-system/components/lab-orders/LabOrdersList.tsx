/**
 * Lab Orders List Component
 * 
 * Display and manage lab orders
 */

'use client';

import { useState } from 'react';
import { useLabOrders } from '@/hooks/useLabOrders';
import { LabOrder } from '@/lib/api/lab-orders';
import { Search, Filter, Calendar, User, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

interface LabOrdersListProps {
  patientId?: number;
  onSelectOrder?: (order: LabOrder) => void;
}

export default function LabOrdersList({ patientId, onSelectOrder }: LabOrdersListProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [page, setPage] = useState(1);

  const { data, loading, error, refetch } = useLabOrders({
    patient_id: patientId,
    search,
    status: statusFilter as any,
    priority: priorityFilter as any,
    page,
    limit: 20
  });

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by order number or patient..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="collected">Collected</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Priority</option>
            <option value="routine">Routine</option>
            <option value="urgent">Urgent</option>
            <option value="stat">STAT</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {data?.orders.map((order) => (
          <div
            key={order.id}
            onClick={() => onSelectOrder?.(order)}
            className={`bg-white rounded-lg border border-gray-200 p-4 transition-all ${
              onSelectOrder ? 'cursor-pointer hover:shadow-md hover:border-blue-300' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              {/* Left Side - Order Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-gray-900">
                    {order.order_number}
                  </h3>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    {order.status}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(order.priority)}`}>
                    {order.priority.toUpperCase()}
                  </span>
                </div>

                {/* Patient Info */}
                {!patientId && order.patient_name && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <User className="h-4 w-4" />
                    <span>{order.patient_name}</span>
                    {order.patient_number && (
                      <span className="text-gray-400">({order.patient_number})</span>
                    )}
                  </div>
                )}

                {/* Order Details */}
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(order.order_date), 'MMM dd, yyyy')}</span>
                  </div>
                  {order.ordered_by_name && (
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>Dr. {order.ordered_by_name}</span>
                    </div>
                  )}
                  {order.items_count !== undefined && (
                    <span className="font-medium">
                      {order.items_count} test{order.items_count !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Clinical Notes Preview */}
                {order.clinical_notes && (
                  <p className="mt-2 text-sm text-gray-500 line-clamp-1">
                    {order.clinical_notes}
                  </p>
                )}
              </div>

              {/* Right Side - Progress & Price */}
              <div className="flex flex-col items-end gap-2 ml-4">
                {/* Progress */}
                {order.items_count !== undefined && order.completed_items_count !== undefined && (
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {order.completed_items_count}/{order.items_count} Complete
                    </div>
                    <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{
                          width: `${(order.completed_items_count / order.items_count) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Price */}
                {order.total_price && (
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Total</div>
                    <div className="text-lg font-bold text-gray-900">
                      ${order.total_price.toFixed(2)}
                    </div>
                  </div>
                )}

                {/* Collection Date */}
                {order.collection_date && (
                  <div className="text-xs text-gray-500">
                    Collected: {format(new Date(order.collection_date), 'MMM dd')}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {data?.orders.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or filters
          </p>
        </div>
      )}

      {/* Pagination */}
      {data && data.pagination.pages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-700">
            Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.pagination.total)} of{' '}
            {data.pagination.total} orders
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === data.pagination.pages}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
