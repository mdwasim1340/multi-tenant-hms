/**
 * Lab Tests List Component
 * 
 * Browse and select available lab tests
 */

'use client';

import { useState } from 'react';
import { useLabTests, useLabTestCategories } from '@/hooks/useLabTests';
import { LabTest } from '@/lib/api/lab-tests';
import { Search, Filter, DollarSign, Clock, TestTube } from 'lucide-react';

interface LabTestsListProps {
  onSelectTest?: (test: LabTest) => void;
  selectedTests?: number[];
  selectionMode?: boolean;
}

export default function LabTestsList({
  onSelectTest,
  selectedTests = [],
  selectionMode = false
}: LabTestsListProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | undefined>();
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | undefined>();

  const { data: categories } = useLabTestCategories();
  const { data, loading, error } = useLabTests({
    search,
    category_id: categoryFilter,
    status: statusFilter,
    limit: 50
  });

  const handleTestClick = (test: LabTest) => {
    if (selectionMode && onSelectTest) {
      onSelectTest(test);
    }
  };

  const isSelected = (testId: number) => selectedTests.includes(testId);

  if (loading) {
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search tests..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter || ''}
            onChange={(e) => setCategoryFilter(e.target.value ? Number(e.target.value) : undefined)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter || ''}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Tests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.tests.map((test) => (
          <div
            key={test.id}
            onClick={() => handleTestClick(test)}
            className={`bg-white rounded-lg border-2 p-4 transition-all ${
              selectionMode ? 'cursor-pointer hover:shadow-md' : ''
            } ${
              isSelected(test.id)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <TestTube className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-medium text-gray-500">
                    {test.test_code}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900">{test.test_name}</h3>
              </div>
              {isSelected(test.id) && (
                <div className="flex-shrink-0 ml-2">
                  <div className="bg-blue-600 text-white rounded-full p-1">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
            </div>

            {/* Category */}
            <div className="mb-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {test.category_name}
              </span>
            </div>

            {/* Details */}
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <TestTube className="h-4 w-4 text-gray-400" />
                <span>{test.specimen_type}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span>{test.turnaround_time} hours</span>
              </div>
              {test.price && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span className="font-medium text-gray-900">
                    ${test.price.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            {test.description && (
              <p className="mt-3 text-sm text-gray-500 line-clamp-2">
                {test.description}
              </p>
            )}

            {/* Status Badge */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  test.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {test.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {data?.tests.length === 0 && (
        <div className="text-center py-12">
          <TestTube className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No tests found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or filters
          </p>
        </div>
      )}

      {/* Results Count */}
      {data && data.tests.length > 0 && (
        <div className="text-center text-sm text-gray-500">
          Showing {data.tests.length} of {data.pagination.total} tests
          {selectionMode && selectedTests.length > 0 && (
            <span className="ml-2 font-medium text-blue-600">
              ({selectedTests.length} selected)
            </span>
          )}
        </div>
      )}
    </div>
  );
}
