import { NextRequest, NextResponse } from 'next/server'
import api from '@/lib/api'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const queryString = searchParams.toString()
    
    const response = await api.get(`/roles?${queryString}`)
    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error('Error fetching roles:', error.response?.data || error.message)
    
    // For development: return mock data if authentication fails
    if (error.response?.status === 401 && process.env.NODE_ENV === 'development') {
      return NextResponse.json([
        {
          id: 1,
          name: 'Admin',
          description: 'System administrator with full access',
          permissions: ['User Management', 'System Settings', 'Reports', 'All Access'],
          users: 1
        },
        {
          id: 2,
          name: 'Doctor',
          description: 'Medical professional',
          permissions: ['Patient Records', 'Medical Reports', 'Prescriptions', 'Appointments'],
          users: 1
        },
        {
          id: 3,
          name: 'Nurse',
          description: 'Nursing staff',
          permissions: ['Patient Care', 'Medical Records', 'Medication', 'Schedules'],
          users: 1
        },
        {
          id: 4,
          name: 'Receptionist',
          description: 'Front desk staff',
          permissions: ['Appointments', 'Patient Check-in', 'Basic Records', 'Phone Support'],
          users: 1
        }
      ])
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: error.response?.status || 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const response = await api.post('/roles', body)
    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error('Error creating role:', error.response?.data || error.message)
    return NextResponse.json(
      { error: 'Failed to create role' },
      { status: error.response?.status || 500 }
    )
  }
}