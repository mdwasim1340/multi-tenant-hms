import { useState, useEffect } from 'react'
import { BedCategoriesAPI, BedCategory, CreateBedCategoryData, UpdateBedCategoryData } from '@/lib/api/bed-categories'
import { toast } from 'sonner'

export function useBedCategories() {
  const [categories, setCategories] = useState<BedCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await BedCategoriesAPI.getCategories()
      setCategories(response.categories)
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch bed categories'
      setError(errorMessage)
      console.error('Error fetching bed categories:', err)
    } finally {
      setLoading(false)
    }
  }

  const createCategory = async (data: CreateBedCategoryData) => {
    try {
      const response = await BedCategoriesAPI.createCategory(data)
      setCategories(prev => [...prev, response.category])
      toast.success('Bed category created successfully')
      return response.category
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to create bed category'
      toast.error(errorMessage)
      throw err
    }
  }

  const updateCategory = async (id: number, data: UpdateBedCategoryData) => {
    try {
      const response = await BedCategoriesAPI.updateCategory(id, data)
      setCategories(prev => 
        prev.map(cat => cat.id === id ? response.category : cat)
      )
      toast.success('Bed category updated successfully')
      return response.category
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to update bed category'
      toast.error(errorMessage)
      throw err
    }
  }

  const deleteCategory = async (id: number) => {
    try {
      await BedCategoriesAPI.deleteCategory(id)
      setCategories(prev => prev.filter(cat => cat.id !== id))
      toast.success('Bed category deleted successfully')
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to delete bed category'
      toast.error(errorMessage)
      throw err
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory
  }
}

export function useBedCategory(id: number) {
  const [category, setCategory] = useState<BedCategory | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategory = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await BedCategoriesAPI.getCategoryById(id)
      setCategory(response.category)
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch bed category'
      setError(errorMessage)
      console.error('Error fetching bed category:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchCategory()
    }
  }, [id])

  return {
    category,
    loading,
    error,
    refetch: fetchCategory
  }
}

export function useBedsByCategory(categoryId: number, page = 1, limit = 10) {
  const [beds, setBeds] = useState<any[]>([])
  const [pagination, setPagination] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBeds = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await BedCategoriesAPI.getBedsByCategory(categoryId, page, limit)
      setBeds(response.beds)
      setPagination(response.pagination)
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch beds by category'
      setError(errorMessage)
      console.error('Error fetching beds by category:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (categoryId) {
      fetchBeds()
    }
  }, [categoryId, page, limit])

  return {
    beds,
    pagination,
    loading,
    error,
    refetch: fetchBeds
  }
}