/**
 * Appointments API Route Handler
 * Proxies requests to the backend API server
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

async function proxyToBackend(request: NextRequest, endpoint: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const tenantId = cookieStore.get('tenant_id')?.value;

    // Build the backend URL
    const url = new URL(request.url);
    const backendUrl = `${BACKEND_URL}/api/appointments${endpoint}${url.search}`;

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-App-ID': 'hospital_system',
      'X-API-Key': process.env.API_KEY || 'hospital-dev-key-123',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    if (tenantId) {
      headers['X-Tenant-ID'] = tenantId;
    }

    // Get request body if it exists
    let body;
    if (request.method !== 'GET' && request.method !== 'DELETE') {
      body = await request.text();
    }

    // Make the request to backend
    const response = await fetch(backendUrl, {
      method: request.method,
      headers,
      body,
    });

    const data = await response.text();

    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Backend proxy error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return proxyToBackend(request, '');
}

export async function POST(request: NextRequest) {
  return proxyToBackend(request, '');
}

export async function PUT(request: NextRequest) {
  return proxyToBackend(request, '');
}

export async function DELETE(request: NextRequest) {
  return proxyToBackend(request, '');
}
