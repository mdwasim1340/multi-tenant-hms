/**
 * Hook for bed categories with department statistics
 * Ensures both Bed Categories and Bed Management screens use the same data
 */

import { useState, useEffect, useCallback } from 'react';
import { BedCategoriesAPI, BedCategory } from '@/lib/api/bed-categories';
import { BedManagementAPI } from '@/lib/api/bed-management';
import { toast } from 'sonner';

export interface CategoryWithStats extends BedCategory {
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  occupancyRate: number;
  criticalPatients: number;
}

/**
 * Hook for bed categories with department statistics
 * This ensures both screens show the same categories with real data
 */
export function useBedCategoriesWithStats() {
  const [categories, setCategories] = useState<CategoryWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategoriesWithStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch categories from bed categories API
      const categoriesResponse = await BedCategoriesAPI.getCategories();
      const bedCategories = categoriesResponse.categories || [];
      
      // Fetch department stats for each category
      const categoriesWithStats: CategoryWithStats[] = [];
      
      for (const category of bedCategories) {
        try {
          // Get department name (now includes all categories)
          const departmentName = mapCategoryToDepartment(category.name);
          
          let stats = {
            totalBeds: category.bed_count || 0,
            occupiedBeds: 0,
            availableBeds: category.bed_count || 0,
            occupancyRate: 0,
            criticalPatients: 0
          };
          
          // Try to get real stats for this department/category
          try {
            const departmentStats = await BedManagementAPI.getDepartmentStats(departmentName);
            stats = {
              totalBeds: departmentStats.totalBeds || category.bed_count || 0,
              occupiedBeds: departmentStats.occupiedBeds || 0,
              availableBeds: departmentStats.availableBeds || category.bed_count || 0,
              occupancyRate: departmentStats.occupancyRate || 0,
              criticalPatients: departmentStats.criticalPatients || 0
            };
          } catch (deptError) {
            // If department stats fail, use category bed count (this is normal for new categories)
            console.log(`Using category bed count for ${departmentName} (no department stats yet)`);
          }
          
          categoriesWithStats.push({
            ...category,
            ...stats
          });
        } catch (categoryError) {
          console.warn(`Failed to process category ${category.name}:`, categoryError);
          // Add category with basic stats
          categoriesWithStats.push({
            ...category,
            totalBeds: category.bed_count || 0,
            occupiedBeds: 0,
            availableBeds: category.bed_count || 0,
            occupancyRate: 0,
            criticalPatients: 0
          });
        }
      }
      
      setCategories(categoriesWithStats);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch categories with stats');
      toast.error('Failed to load bed categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategoriesWithStats();
  }, [fetchCategoriesWithStats]);

  return {
    categories,
    loading,
    error,
    refetch: fetchCategoriesWithStats
  };
}

/**
 * Map category names to department names
 * This ensures consistency between categories and departments
 * Now includes ALL categories, not just predefined ones
 */
function mapCategoryToDepartment(categoryName: string): string | null {
  const mapping: { [key: string]: string } = {
    'Cardiology': 'Cardiology',
    'ICU': 'ICU', 
    'Emergency': 'Emergency Room',
    'Pediatric': 'Pediatrics',
    'Orthopedics': 'Orthopedics',
    'Neurology': 'Neurology',
    'Maternity': 'Maternity',
    'General': 'General'
  };
  
  // Return mapped name if exists, otherwise return the category name itself
  // This ensures ALL categories appear in Bed Management screen
  return mapping[categoryName] || categoryName;
}

/**
 * Hook for getting categories formatted for department display
 * This is used by the Bed Management screen
 */
export function useDepartmentCategories() {
  const { categories, loading, error, refetch } = useBedCategoriesWithStats();
  
  // Include ALL categories in department view, even those with 0 beds
  // This ensures new categories appear immediately in Bed Management screen
  const departmentCategories = categories.map(cat => ({
    ...cat,
    // Ensure we have proper department display name
    name: cat.name,
    displayName: cat.name
  }));
  
  return {
    departments: departmentCategories,
    loading,
    error,
    refetch
  };
}

/**
 * Hook for creating new categories that will appear in both screens
 */
export function useCreateCategory() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCategory = useCallback(async (categoryData: {
    name: string;
    description: string;
    color: string;
    icon: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      
      const newCategory = await BedCategoriesAPI.createCategory(categoryData);
      toast.success(`Category "${categoryData.name}" created successfully`);
      
      return newCategory;
    } catch (err: any) {
      setError(err.message || 'Failed to create category');
      toast.error('Failed to create category');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createCategory,
    loading,
    error
  };
}