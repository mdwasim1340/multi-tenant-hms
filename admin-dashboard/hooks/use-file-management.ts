"use client"

import React, { useState, useCallback } from 'react'
import { useAuth } from './useAuth'
import axios from 'axios'
import Cookies from 'js-cookie'

export interface FileItem {
  id: number
  tenant_id: string
  s3_key: string
  filename: string
  original_filename: string
  file_size: number
  content_type?: string
  uploaded_by?: number
  uploaded_by_name?: string
  upload_date: string
  last_accessed?: string
  is_shared: boolean
  share_expires_at?: string
  tags?: string[]
  description?: string
}

export interface FileUploadProgress {
  filename: string
  progress: number
  status: 'uploading' | 'completed' | 'error'
  error?: string
}

export interface StorageStats {
  totalFiles: number
  totalSize: number
  averageFileSize: number
  fileTypes: {
    images: number
    videos: number
    pdfs: number
    documents: number
  }
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}

export function useFileManagement() {
  const { user } = useAuth()
  
  // Create axios instance with authentication (memoized)
  const api = React.useMemo(() => {
    const instance = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
      headers: {
        'X-App-ID': 'admin-dashboard',
        'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || 'admin-dev-key-456'
      }
    })

    // Add request interceptor to include auth token and tenant ID
    instance.interceptors.request.use((config) => {
      let token = Cookies.get('token')
      
      // For development, create a test token if none exists or if it's expired
      if (!token) {
        // Create a simple test token for development
        const testPayload = {
          email: 'admin@test.com',
          sub: 'test-user-id',
          id: 3,
          'cognito:groups': ['admin'],
          exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours from now
        }
        
        // Simple base64 encoding for development (not secure, just for testing)
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
        const payload = btoa(JSON.stringify(testPayload))
        token = `${header}.${payload}.dev-signature`
        
        // Store it in cookies for consistency (expires in 1 day)
        Cookies.set('token', token, { expires: 1 })
      }
      
      config.headers.Authorization = `Bearer ${token}`
      
      // For admin dashboard, we'll use the first available tenant or a default
      // In a real app, this would come from user selection or context
      const tenantId = 'tenant_1762083064503' // Using an existing tenant for now
      config.headers['X-Tenant-ID'] = tenantId
      
      return config
    })

    // Add response interceptor to handle 401 errors
    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Clear the token and retry
          Cookies.remove('token')
          console.log('Token expired, will regenerate on next request')
        }
        return Promise.reject(error)
      }
    )

    return instance
  }, [])
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress[]>([])
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })

  // Fetch files with pagination and search
  const fetchFiles = useCallback(async (
    page: number = 1,
    limit: number = 10,
    search: string = '',
    sortBy: string = 'upload_date',
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        sortBy,
        sortOrder
      })

      const response = await api.get(`/files?${params}`)
      
      if (response.data) {
        setFiles(response.data.files || [])
        setPagination(response.data.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0
        })
      }
    } catch (error) {
      console.error('Error fetching files:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [api])

  // Upload file
  const uploadFile = useCallback(async (
    file: File,
    description?: string,
    tags?: string[]
  ): Promise<FileItem> => {
    try {
      // Add to upload progress
      const progressItem: FileUploadProgress = {
        filename: file.name,
        progress: 0,
        status: 'uploading'
      }
      setUploadProgress(prev => [...prev, progressItem])

      // Get upload URL
      const uploadUrlResponse = await api.post('/files/upload-url', {
        filename: file.name,
        contentType: file.type
      })

      const { uploadUrl, key } = uploadUrlResponse.data

      // Try direct S3 upload first, fallback to backend upload if CORS issues
      try {
        // Upload to S3 with progress tracking
        const xhr = new XMLHttpRequest()
        
        const s3UploadResult = await new Promise<void>((resolve, reject) => {
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100)
              setUploadProgress(prev => 
                prev.map(item => 
                  item.filename === file.name 
                    ? { ...item, progress }
                    : item
                )
              )
            }
          })

          xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
              resolve()
            } else {
              const errorMessage = `S3 upload failed (Status: ${xhr.status})`
              console.error('S3 upload failed:', errorMessage)
              reject(new Error(errorMessage))
            }
          })

          xhr.addEventListener('error', () => {
            reject(new Error('CORS_ERROR'))
          })

          xhr.open('PUT', uploadUrl)
          xhr.setRequestHeader('Content-Type', file.type)
          xhr.send(file)
        })

        // If S3 upload succeeded, confirm with backend
        const confirmResponse = await api.post('/files/confirm-upload', {
          key,
          originalFilename: file.name,
          fileSize: file.size,
          contentType: file.type,
          description,
          tags
        })

        // Update progress to completed
        setUploadProgress(prev => 
          prev.map(item => 
            item.filename === file.name 
              ? { ...item, progress: 100, status: 'completed' }
              : item
          )
        )

        // Remove from progress after delay
        setTimeout(() => {
          setUploadProgress(prev => 
            prev.filter(item => item.filename !== file.name)
          )
        }, 2000)

        return confirmResponse.data.file

      } catch (s3Error: any) {
        // S3 direct upload failed (likely CORS), try backend upload
        
        // Fallback: Upload through backend
        const formData = new FormData()
        formData.append('file', file)
        formData.append('description', description || '')
        formData.append('tags', JSON.stringify(tags || []))

        const backendUploadResponse = await api.post('/files/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100)
              setUploadProgress(prev => 
                prev.map(item => 
                  item.filename === file.name 
                    ? { ...item, progress }
                    : item
                )
              )
            }
          }
        })

        // Update progress to completed
        setUploadProgress(prev => 
          prev.map(item => 
            item.filename === file.name 
              ? { ...item, progress: 100, status: 'completed' }
              : item
          )
        )

        // Remove from progress after delay
        setTimeout(() => {
          setUploadProgress(prev => 
            prev.filter(item => item.filename !== file.name)
          )
        }, 2000)

        return backendUploadResponse.data.file
      }
    } catch (error) {
      setUploadProgress(prev => 
        prev.map(item => 
          item.filename === file.name 
            ? { ...item, status: 'error', error: 'Failed to get upload URL' }
            : item
        )
      )
      throw error
    }
  }, [api])

  // Download file
  const downloadFile = useCallback(async (fileId: number, filename: string) => {
    try {
      const response = await api.get(`/files/${fileId}/download`)
      const { downloadUrl } = response.data

      // Use a hidden iframe to trigger download without opening new tab
      // This works better with S3 presigned URLs and avoids CORS issues
      const iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      iframe.src = downloadUrl
      document.body.appendChild(iframe)
      
      // Clean up after download starts
      setTimeout(() => {
        document.body.removeChild(iframe)
      }, 5000)
    } catch (error) {
      console.error('Error downloading file:', error)
      throw error
    }
  }, [api])

  // Delete file
  const deleteFile = useCallback(async (fileId: number) => {
    try {
      await api.delete(`/files/${fileId}`)
      
      // Remove from local state
      setFiles(prev => prev.filter(file => file.id !== fileId))
      
      return true
    } catch (error) {
      console.error('Error deleting file:', error)
      throw error
    }
  }, [api])

  // Share file
  const shareFile = useCallback(async (
    fileId: number, 
    expiresIn: number = 86400
  ): Promise<{ shareUrl: string; expiresAt: string }> => {
    try {
      const response = await api.post(`/files/${fileId}/share`, { expiresIn })
      return response.data
    } catch (error) {
      console.error('Error sharing file:', error)
      throw error
    }
  }, [api])

  // Get file metadata
  const getFileMetadata = useCallback(async (fileId: number): Promise<FileItem> => {
    try {
      const response = await api.get(`/files/${fileId}`)
      return response.data.file
    } catch (error) {
      console.error('Error fetching file metadata:', error)
      throw error
    }
  }, [api])

  // Get storage statistics
  const fetchStorageStats = useCallback(async () => {
    try {
      const response = await api.get('/files/stats/storage')
      setStorageStats(response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching storage stats:', error)
      throw error
    }
  }, [api])

  // Format file size
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }, [])

  // Get file type icon
  const getFileTypeIcon = useCallback((contentType?: string): string => {
    if (!contentType) return '📄'
    
    if (contentType.startsWith('image/')) return '🖼️'
    if (contentType.startsWith('video/')) return '🎥'
    if (contentType.startsWith('audio/')) return '🎵'
    if (contentType === 'application/pdf') return '📕'
    if (contentType.includes('word') || contentType.includes('document')) return '📝'
    if (contentType.includes('sheet') || contentType.includes('excel')) return '📊'
    if (contentType.includes('presentation') || contentType.includes('powerpoint')) return '📈'
    if (contentType.includes('zip') || contentType.includes('archive')) return '🗜️'
    
    return '📄'
  }, [])

  return {
    files,
    loading,
    uploadProgress,
    storageStats,
    pagination,
    fetchFiles,
    uploadFile,
    downloadFile,
    deleteFile,
    shareFile,
    getFileMetadata,
    fetchStorageStats,
    formatFileSize,
    getFileTypeIcon
  }
}