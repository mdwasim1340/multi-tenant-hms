"use client"

import React, { createContext, useContext, ReactNode, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"

interface User {
  signInUserSession?: {
    accessToken?: {
      payload: {
        'cognito:groups'?: string[]
        email?: string
        username?: string
        sub?: string
      }
    }
  }
}

interface AuthContextType {
  user: User | null
  login: (token: string) => void
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

// Helper function to decode JWT token
const decodeJWT = (token: string) => {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    
    // Use Buffer in Node.js environment, atob in browser
    let jsonPayload: string
    if (typeof window === 'undefined') {
      // Server-side (Node.js)
      jsonPayload = Buffer.from(base64, 'base64').toString('utf-8')
    } else {
      // Client-side (Browser)
      jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
    }
    
    const payload = JSON.parse(jsonPayload)
    console.log('Decoded JWT payload:', payload) // Debug log
    return payload
  } catch (error) {
    console.error('Error decoding JWT:', error)
    return null
  }
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing token on mount
  useEffect(() => {
    const token = Cookies.get("token")
    console.log('useAuth - Token from cookie:', token ? 'Present' : 'Missing')
    
    if (token) {
      const payload = decodeJWT(token)
      console.log('useAuth - Decoded payload:', payload)
      
      if (payload) {
        const userObj = {
          signInUserSession: {
            accessToken: {
              payload: payload
            }
          }
        }
        console.log('useAuth - Setting user object:', userObj)
        setUser(userObj)
      } else {
        console.log('useAuth - Failed to decode token, clearing user')
        setUser(null)
      }
    } else {
      console.log('useAuth - No token found, user remains null')
      setUser(null)
    }
    setIsLoading(false)
  }, [])

  const login = (token: string) => {
    console.log('Login - Received token:', token ? 'Present' : 'Missing')
    Cookies.set("token", token, { expires: 7 }) // Set cookie for 7 days
    
    // Decode token and set user
    const payload = decodeJWT(token)
    console.log('Login - Decoded payload:', payload)
    
    if (payload) {
      const userObj = {
        signInUserSession: {
          accessToken: {
            payload: payload
          }
        }
      }
      console.log('Login - Setting user object:', userObj)
      setUser(userObj)
    }
    
    router.push("/")
  }

  const logout = () => {
    Cookies.remove("token")
    setUser(null)
    router.push("/auth/signin")
  }

  const contextValue: AuthContextType = {
    user,
    login,
    logout,
    isLoading
  }

  return React.createElement(
    AuthContext.Provider,
    { value: contextValue },
    children
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}