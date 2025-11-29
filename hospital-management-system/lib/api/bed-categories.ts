import { api } from './client'

export interface BedCategory {
  id: number
  name: string
  description?: string
  color: string
  icon: string
  is_active: boolean
  bed_count?: number
  created_at: string
  updated_at: string
}

export interface CreateBedCategoryData {
  name: string
  description?: string
  color?: string
  icon?: string
}

export interface UpdateBedCategoryData {
  name?: string
  description?: string
  color?: string
  icon?: string
  is_active?: boolean
}

export interface BedCategoriesResponse {
  categories: BedCategory[]
  total: number
}

export interface BedCategoryResponse {
  category: BedCategory
}

export interface CreateBedCategoryResponse {
  message: string
  category: BedCategory
}

export interface UpdateBedCategoryResponse {
  message: string
  category: BedCategory
}

export interface DeleteBedCategoryResponse {
  message: string
}

export const BedCategoriesAPI = {
  // Get all bed categories
  async getCategories(): Promise<BedCategoriesResponse> {
    const response = await api.get('/api/beds/categories')
    return response.data
  },

  // Get category by ID
  async getCategoryById(id: number): Promise<BedCategoryResponse> {
    const response = await api.get(`/api/beds/categories/${id}`)
    return response.data
  },

  // Create new bed category
  async createCategory(data: CreateBedCategoryData): Promise<CreateBedCategoryResponse> {
    const response = await api.post('/api/beds/categories', data)
    return response.data
  },

  // Update bed category
  async updateCategory(id: number, data: UpdateBedCategoryData): Promise<UpdateBedCategoryResponse> {
    const response = await api.put(`/api/beds/categories/${id}`, data)
    return response.data
  },

  // Delete bed category
  async deleteCategory(id: number): Promise<DeleteBedCategoryResponse> {
    const response = await api.delete(`/api/beds/categories/${id}`)
    return response.data
  },

  // Get beds by category
  async getBedsByCategory(id: number, page = 1, limit = 10) {
    const response = await api.get(`/api/beds/categories/${id}/beds`, {
      params: { page, limit }
    })
    return response.data
  }
}