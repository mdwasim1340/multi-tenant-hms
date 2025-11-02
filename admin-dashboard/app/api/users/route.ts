import { NextRequest, NextResponse } from 'next/server'
import api from '@/lib/api'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const queryString = searchParams.toString()
    
    const response = await api.get(`/users?${queryString}`)
    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error('Error fetching users:', error.response?.data || error.message)
    
    // For development: return mock data if authentication fails
    if (error.response?.status === 401 && process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        users: [
          {
            id: 1,
            name: 'John Admin',
            email: 'admin@testhospital.com',
            tenant: 'Test Hospital',
            role: 'Admin',
            status: 'active',
            joinDate: '2025-01-01'
          },
          {
            id: 2,
            name: 'Dr. Sarah Smith',
            email: 'sarah.smith@testhospital.com',
            tenant: 'Test Hospital',
            role: 'Doctor',
            status: 'active',
            joinDate: '2025-01-02'
          }
        ],
        total: 4,
        active: 4,
        admins: 1
      })
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: error.response?.status || 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const response = await api.post('/users', body)
    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error('Error creating user:', error.response?.data || error.message)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: error.response?.status || 500 }
    )
  }
}