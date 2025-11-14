"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { getTenantContext } from '@/lib/subdomain'
import { isAuthenticated, getCurrentUser } from '@/lib/auth'

export default function DebugAuthPage() {
  const router = useRouter()
  const [authState, setAuthState] = useState<any>({})

  useEffect(() => {
    // Get all auth-related data
    const state = {
      isAuthenticated: isAuthenticated(),
      token: Cookies.get('token'),
      tenantId: getTenantContext(),
      tenantIdCookie: Cookies.get('tenant_id'),
      tenantIdLocalStorage: typeof window !== 'undefined' ? localStorage.getItem('tenant_id') : null,
      currentUser: getCurrentUser(),
      userEmail: Cookies.get('user_email'),
      userName: Cookies.get('user_name'),
      allCookies: document.cookie.split(';').map(c => c.trim()),
      localStorage: typeof window !== 'undefined' ? {
        tenant_id: localStorage.getItem('tenant_id'),
        tenant_name: localStorage.getItem('tenant_name'),
      } : null,
    }
    
    setAuthState(state)
    console.log('🔍 Auth Debug State:', state)
  }, [])

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Authentication Debug</h1>
          <Button onClick={() => router.push('/auth/login')}>
            Go to Login
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Authentication Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Is Authenticated</p>
                <p className="text-lg font-semibold">
                  {authState.isAuthenticated ? '✅ Yes' : '❌ No'}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Has Token</p>
                <p className="text-lg font-semibold">
                  {authState.token ? '✅ Yes' : '❌ No'}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tenant ID (getTenantContext)</p>
                <p className="text-lg font-semibold">
                  {authState.tenantId || '❌ Not Set'}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tenant ID (Cookie)</p>
                <p className="text-lg font-semibold">
                  {authState.tenantIdCookie || '❌ Not Set'}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tenant ID (localStorage)</p>
                <p className="text-lg font-semibold">
                  {authState.tenantIdLocalStorage || '❌ Not Set'}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">User Email</p>
                <p className="text-lg font-semibold">
                  {authState.userEmail || '❌ Not Set'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Token Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg overflow-x-auto">
              <pre className="text-xs">
                {authState.token ? authState.token.substring(0, 100) + '...' : 'No token found'}
              </pre>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Cookies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {authState.allCookies?.map((cookie: string, index: number) => (
                <div key={index} className="bg-muted p-2 rounded text-sm font-mono">
                  {cookie}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>localStorage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-xs">
                {JSON.stringify(authState.localStorage, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current User</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-xs">
                {JSON.stringify(authState.currentUser, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button onClick={() => router.push('/patient-registration')}>
            Go to Patient Registration
          </Button>
          <Button onClick={() => router.push('/dashboard')}>
            Go to Dashboard
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => {
              // Clear all auth data
              Cookies.remove('token')
              Cookies.remove('tenant_id')
              Cookies.remove('user_email')
              Cookies.remove('user_name')
              localStorage.clear()
              window.location.reload()
            }}
          >
            Clear All Auth Data
          </Button>
        </div>
      </div>
    </div>
  )
}
