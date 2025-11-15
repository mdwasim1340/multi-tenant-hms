/**
 * Team Alpha - Waitlist List Component
 * Display and manage appointment waitlist entries
 */

'use client';

import { useState, useEffect } from 'react';
import { waitlistApi } from '@/lib/api/appointments';

// Types
interface WaitlistEntry {
  id: number;
  patient_id: number;
  patient_name?: string;
  patient_email?: string;
  patient_phone?: string;
  preferred_date?: string;
  preferred_time?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'waiting' | 'notified' | 'converted' | 'cancelled';
  reason?: string;
  notes?: string;
  created_at: string;
  notified_at?: string;
  converted_at?: string;
}

interface WaitlistListProps {
  onConvert?: (entry: WaitlistEntry) => void;
  onNotify?: (entry: WaitlistEntry) => void;
  onRemove?: (entry: WaitlistEntry) => void;
}

// Priority Badge Component
const PriorityBadge = ({ priority }: { priority: string }) => {
  const colors = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200',
  };
  
  const icons = {
    high: '🔴',
    medium: '🟡',
    low: '🟢',
  };
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${colors[priority as keyof typeof colors]}`}>
      <span>{icons[priority as keyof typeof icons]}</span>
      <span>{priority.toUpperCase()}</span>
    </span>
  );
};

// Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
  const colors = {
    waiting: 'bg-blue-100 text-blue-800',
    notified: 'bg-purple-100 text-purple-800',
    converted: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800',
  };
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// Waitlist Entry Card Component
const WaitlistEntryCard = ({ 
  entry, 
  onConvert, 
  onNotify, 
  onRemove 
}: { 
  entry: WaitlistEntry;
  onConvert?: (entry: WaitlistEntry) => void;
  onNotify?: (entry: WaitlistEntry) => void;
  onRemove?: (entry: WaitlistEntry) => void;
}) => {
  const [showActions, setShowActions] = useState(false);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    return timeString;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Header Row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <PriorityBadge priority={entry.priority} />
          <div>
            <h3 className="font-semibold text-gray-900">
              {entry.patient_name || `Patient #${entry.patient_id}`}
            </h3>
            {entry.patient_email && (
              <p className="text-sm text-gray-600">{entry.patient_email}</p>
            )}
          </div>
        </div>
        
        {/* Actions Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="px-3 py-1 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Actions ▼
          </button>
          
          {showActions && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
              <button
                onClick={() => {
                  onConvert?.(entry);
                  setShowActions(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                Convert to Appointment
              </button>
              <button
                onClick={() => {
                  onNotify?.(entry);
                  setShowActions(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                Send Notification
              </button>
              <button
                onClick={() => {
                  onRemove?.(entry);
                  setShowActions(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                Remove from Waitlist
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-xs text-gray-500">Preferred Date/Time</p>
          <p className="text-sm font-medium text-gray-900">
            {formatDate(entry.preferred_date)} {formatTime(entry.preferred_time)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Status</p>
          <StatusBadge status={entry.status} />
        </div>
      </div>

      {/* Reason */}
      {entry.reason && (
        <div className="mb-3">
          <p className="text-xs text-gray-500">Reason</p>
          <p className="text-sm text-gray-700">{entry.reason}</p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
        <span>Added: {formatDate(entry.created_at)}</span>
        {entry.notified_at && (
          <span>Notified: {formatDate(entry.notified_at)}</span>
        )}
      </div>
    </div>
  );
};

// Main Waitlist List Component
export default function WaitlistList({
  onConvert,
  onNotify,
  onRemove,
}: WaitlistListProps) {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Load waitlist entries
  useEffect(() => {
    loadEntries();
  }, [filterPriority, filterStatus]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {};
      if (filterPriority !== 'all') params.priority = filterPriority;
      if (filterStatus !== 'all') params.status = filterStatus;

      const data = await waitlistApi.getWaitlist(params);
      setEntries(data.entries || []);
    } catch (err: any) {
      console.error('Error loading waitlist:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load waitlist');
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = (entry: WaitlistEntry) => {
    if (onConvert) {
      onConvert(entry);
    }
  };

  const handleNotify = async (entry: WaitlistEntry) => {
    try {
      await waitlistApi.notifyWaitlistEntry(entry.id);
      // Reload entries to show updated status
      await loadEntries();
      if (onNotify) {
        onNotify(entry);
      }
    } catch (err: any) {
      console.error('Error notifying entry:', err);
      alert(err.response?.data?.error || 'Failed to send notification');
    }
  };

  const handleRemove = async (entry: WaitlistEntry) => {
    if (!confirm(`Remove ${entry.patient_name || 'this patient'} from waitlist?`)) {
      return;
    }

    try {
      await waitlistApi.removeFromWaitlist(entry.id, 'Removed by staff');
      // Reload entries
      await loadEntries();
      if (onRemove) {
        onRemove(entry);
      }
    } catch (err: any) {
      console.error('Error removing entry:', err);
      alert(err.response?.data?.error || 'Failed to remove from waitlist');
    }
  };

  // Filter entries
  const filteredEntries = entries.filter(entry => {
    if (filterPriority !== 'all' && entry.priority !== filterPriority) return false;
    if (filterStatus !== 'all' && entry.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Appointment Waitlist</h2>
        <button
          onClick={loadEntries}
          disabled={loading}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label htmlFor="priority-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <select
            id="priority-filter"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div>
          <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status-filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="waiting">Waiting</option>
            <option value="notified">Notified</option>
            <option value="converted">Converted</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredEntries.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No waitlist entries</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filterPriority !== 'all' || filterStatus !== 'all' 
              ? 'No entries match the selected filters.'
              : 'The waitlist is currently empty.'}
          </p>
        </div>
      )}

      {/* Entries List */}
      {!loading && filteredEntries.length > 0 && (
        <>
          <div className="space-y-4">
            {filteredEntries.map((entry) => (
              <WaitlistEntryCard
                key={entry.id}
                entry={entry}
                onConvert={handleConvert}
                onNotify={handleNotify}
                onRemove={handleRemove}
              />
            ))}
          </div>

          {/* Footer */}
          <div className="text-sm text-gray-600 text-center pt-4 border-t border-gray-200">
            Showing {filteredEntries.length} of {entries.length} entries
          </div>
        </>
      )}
    </div>
  );
}
