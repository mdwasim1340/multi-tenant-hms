/**
 * Lab Tests API Client
 * 
 * Frontend API client for laboratory tests management
 */

import api from './client';

// ============================================================================
// Types
// ============================================================================

export interface LabTestCategory {
  id: number;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LabTest {
  id: number;
  category_id: number | null;
  test_code: string;
  test_name: string;
  description: string | null;
  normal_range_min: string | null;
  normal_range_max: string | null;
  normal_range_text: string | null;
  unit: string | null;
  specimen_type: string | null;
  price: number | null;
  turnaround_time: number | null;
  preparation_instructions: string | null;
  status: 'active' | 'inactive' | 'discontinued';
  created_at: string;
  updated_at: string;
  category_name?: string;
}

export interface LabTestsResponse {
  tests: LabTest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface LabTestFilters {
  category_id?: number;
  specimen_type?: string;
  status?: 'active' | 'inactive' | 'discontinued';
  search?: string;
  page?: number;
  limit?: number;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get all lab tests with optional filtering
 */
export async function getLabTests(filters?: LabTestFilters): Promise<LabTestsResponse> {
  const params = new URLSearchParams();
  
  if (filters?.category_id) params.append('category_id', filters.category_id.toString());
  if (filters?.specimen_type) params.append('specimen_type', filters.specimen_type);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const response = await api.get(`/api/lab-tests?${params.toString()}`);
  return response.data;
}

/**
 * Get lab test by ID
 */
export async function getLabTestById(testId: number): Promise<LabTest> {
  const response = await api.get(`/api/lab-tests/${testId}`);
  return response.data;
}

/**
 * Get all test categories
 */
export async function getLabTestCategories(): Promise<LabTestCategory[]> {
  const response = await api.get('/api/lab-tests/categories');
  return response.data.categories;
}

/**
 * Get all specimen types
 */
export async function getSpecimenTypes(): Promise<string[]> {
  const response = await api.get('/api/lab-tests/specimen-types');
  return response.data.specimen_types;
}

/**
 * Create new lab test (admin only)
 */
export async function createLabTest(testData: {
  category_id?: number;
  test_code: string;
  test_name: string;
  description?: string;
  normal_range_min?: string;
  normal_range_max?: string;
  normal_range_text?: string;
  unit?: string;
  specimen_type?: string;
  price?: number;
  turnaround_time?: number;
  preparation_instructions?: string;
  status?: 'active' | 'inactive' | 'discontinued';
}): Promise<{ message: string; test: LabTest }> {
  const response = await api.post('/api/lab-tests', testData);
  return response.data;
}

/**
 * Update lab test (admin only)
 */
export async function updateLabTest(
  testId: number,
  testData: Partial<LabTest>
): Promise<{ message: string; test: LabTest }> {
  const response = await api.put(`/api/lab-tests/${testId}`, testData);
  return response.data;
}

/**
 * Deactivate lab test (admin only)
 */
export async function deactivateLabTest(testId: number): Promise<{ message: string }> {
  const response = await api.delete(`/api/lab-tests/${testId}`);
  return response.data;
}
