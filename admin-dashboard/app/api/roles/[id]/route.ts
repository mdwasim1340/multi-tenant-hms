import { NextRequest, NextResponse } from 'next/server'
import api from '@/lib/api'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const response = await api.get(`/roles/${params.id}`)
    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error('Error fetching role:', error.response?.data || error.message)
    return NextResponse.json(
      { error: 'Failed to fetch role' },
      { status: error.response?.status || 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const response = await api.put(`/roles/${params.id}`, body)
    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error('Error updating role:', error.response?.data || error.message)
    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: error.response?.status || 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await api.delete(`/roles/${params.id}`)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting role:', error.response?.data || error.message)
    return NextResponse.json(
      { error: 'Failed to delete role' },
      { status: error.response?.status || 500 }
    )
  }
}