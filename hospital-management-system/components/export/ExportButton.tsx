'use client';

import { useState } from 'react';
import { Download, Check, X } from 'lucide-react';
import { useExport } from '@/hooks/useExport';

interface ExportButtonProps {
  endpoint: string;
  filename?: string;
  filters?: Record<string, any>;
  selectedIds?: number[];
  selectedCount?: number;
  totalCount?: number;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ExportButton({
  endpoint,
  filename,
  filters = {},
  selectedIds = [],
  selectedCount = 0,
  totalCount = 0,
  variant = 'outline',
  size = 'md',
  className = '',
}: ExportButtonProps) {
  const { exportToCSV, isExporting, error } = useExport();
  const [showSuccess, setShowSuccess] = useState(false);

  const handleExport = async () => {
    const result = await exportToCSV({
      endpoint,
      filename,
      filters,
      selectedIds: selectedIds.length > 0 ? selectedIds : undefined,
    });

    if (result.success) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const getButtonText = () => {
    if (isExporting) return 'Exporting...';
    if (showSuccess) return 'Exported!';
    
    if (selectedIds.length > 0) {
      return `Export Selected (${selectedIds.length})`;
    }
    
    if (totalCount > 0) {
      return `Export All (${totalCount})`;
    }
    
    return 'Export to CSV';
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variantClasses = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    ghost: 'text-gray-700 hover:bg-gray-100',
  };

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleExport}
        disabled={isExporting || totalCount === 0}
        className={`
          inline-flex items-center gap-2 rounded-lg font-medium
          transition-colors duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${className}
        `}
      >
        {isExporting ? (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
        ) : showSuccess ? (
          <Check className="h-4 w-4" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        <span>{getButtonText()}</span>
      </button>
      
      {error && (
        <div className="flex items-center gap-1 text-xs text-red-600">
          <X className="h-3 w-3" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
