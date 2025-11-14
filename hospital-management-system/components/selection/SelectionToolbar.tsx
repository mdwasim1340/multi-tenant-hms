'use client';

import { Check, X } from 'lucide-react';

interface SelectionToolbarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  children?: React.ReactNode;
}

export function SelectionToolbar({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  children,
}: SelectionToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-900">
            {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
          </span>
        </div>

        <div className="flex items-center gap-2">
          {selectedCount < totalCount && (
            <button
              onClick={onSelectAll}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Select all {totalCount}
            </button>
          )}
          
          <button
            onClick={onClearSelection}
            className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-700"
          >
            <X className="h-3 w-3" />
            Clear selection
          </button>
        </div>
      </div>

      {children && (
        <div className="flex items-center gap-2">
          {children}
        </div>
      )}
    </div>
  );
}
