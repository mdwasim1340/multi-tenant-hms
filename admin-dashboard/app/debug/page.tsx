"use client"

import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Cookies from "js-cookie"

export default function DebugPage() {
  const { user, login, logout, isLoading } = useAuth()

  const handleTestLogin = async () => {
    try {
      const response = await fetch('http://localhost:3000/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'auth-test@enterprise-corp.com',
          password: 'AuthTest123!'
        })
      })
      
      const data = await response.json()
      
      if (data.AccessToken) {
        login(data.AccessToken)
        alert('Login successful!')
      } else {
        alert('Login failed: No access token')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      alert('Login error: ' + error.message)
    }
  }

  const currentToken = Cookies.get("token")
  const isAdmin = user?.signInUserSession?.accessToken?.payload['cognito:groups']?.includes('admin')

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Authentication Debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}
          </div>
          
          <div>
            <strong>User Object:</strong>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
          
          <div>
            <strong>Current Token (first 50 chars):</strong>
            <div className="bg-gray-100 p-2 rounded text-sm">
              {currentToken ? currentToken.substring(0, 50) + '...' : 'No token found'}
            </div>
          </div>
          
          <div>
            <strong>Is Admin:</strong> {isAdmin ? 'Yes' : 'No'}
          </div>
          
          <div>
            <strong>Groups:</strong>
            <div className="bg-gray-100 p-2 rounded text-sm">
              {JSON.stringify(user?.signInUserSession?.accessToken?.payload['cognito:groups'] || 'No groups')}
            </div>
          </div>
          
          <div className="space-x-2">
            <Button onClick={handleTestLogin}>
              Test Login with Admin User
            </Button>
            <Button onClick={logout} variant="outline">
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}