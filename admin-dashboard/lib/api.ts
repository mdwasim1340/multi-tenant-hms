import axios from "axios"
import Cookies from "js-cookie"
import { getTenantId } from "./tenant"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

const api = axios.create({
  baseURL: API_URL,
})

api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("token")
    const tenantId = getTenantId()
    
    console.log('API Request:', config.method?.toUpperCase(), config.url)
    console.log('Token available:', token ? 'Yes' : 'No')
    console.log('Tenant ID:', tenantId)
    
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`
    }
    config.headers["X-Tenant-ID"] = tenantId
    
    // Add app identification headers for backend security
    config.headers["X-App-ID"] = "admin-dashboard"
    config.headers["X-API-Key"] = process.env.NEXT_PUBLIC_API_KEY || "admin-dev-key-456"
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url)
    return response
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.statusText, error.config?.url)
    console.error('Error details:', error.response?.data)
    return Promise.reject(error)
  }
)

export const signIn = async (email: string, password: string) => {
  const response = await api.post("/auth/signin", { email, password })
  return response.data
}

export const signUp = async (email: string, password: string, name: string) => {
  const response = await api.post("/auth/signup", { email, password, name })
  return response.data
}

export const forgotPassword = async (email: string) => {
  const response = await api.post("/auth/forgot-password", { email })
  return response.data
}

export const resetPassword = async (email: string, code: string, newPassword: string) => {
  const response = await api.post("/auth/reset-password", { 
    email, 
    code, 
    newPassword 
  })
  return response.data
}

export default api
