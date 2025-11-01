"use client"

import React, { createContext, useContext, ReactNode } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"

interface AuthContextType {
  login: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const router = useRouter()

  const login = (token: string) => {
    Cookies.set("token", token, { expires: 7 }) // Set cookie for 7 days
    router.push("/")
  }

  const logout = () => {
    Cookies.remove("token")
    router.push("/auth/signin")
  }

  const contextValue: AuthContextType = {
    login,
    logout
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