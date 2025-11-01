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
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`
    }
    config.headers["X-Tenant-ID"] = getTenantId()
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

export const signIn = async (email: string, password: string) => {
  const response = await api.post("/auth/signin", { email, password })
  return response.data
}

export default api
