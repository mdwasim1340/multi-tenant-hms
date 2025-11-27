#!/usr/bin/env node

/**
 * Test bed creation with the fixed API endpoints
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000';
const TENANT_ID = 'aajmin_polyclinic';
const TEST_EMAIL = 'mdwasimkrm13@gmail.com';
const TEST_PASSWORD = 'Advanture101$';

async function testBedCreationAPIFix() {
  console.log('🧪 Testing Bed Creation API Fix...\n');

  try {
    // Step 1: Authenticate
    console.log('1. Authenticating...');
    const authResponse = await axios.post(`${API_BASE}/auth/signin`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    const token = authResponse.data.token;
    console.log('✅ Authentication successful\n');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'X-Tenant-ID': TENANT_ID,
      'X-App-ID': 'hospital_system',
      'X-API-Key': 'hospital-dev-key-123',
      'Content-Type': 'application/json'
    };

    // Step 2: Test bed creation with correct endpoint
    console.log('2. Testing bed creation with /api/bed-management/beds...');
    
    const testBedNumber = `API-FIX-TEST-${Date.now()}`;
    const bedData = {
      bed_number: testBedNumber,
      category_id: 8, // Cardiology category
      bed_type: 'Standard',
      floor_number: 3,
      room_number: '301',
      wing: 'A',
      status: 'available',
      features: {
        monitor: true,
        oxygen: true
      },
      notes: 'Test bed for API endpoint fix verification'
    };

    const createResponse = await axios.post(`${API_BASE}/api/bed-management/beds`, bedData, {
      headers
    });

    console.log('✅ Bed creation successful!');
    console.log(`   Bed ID: ${createResponse.data.id}`);
    console.log(`   Bed Number: ${createResponse.data.bed_number}`);

    // Step 3: Verify bed appears in both screens
    console.log('\n3. Verifying bed appears in both screens...');
    
    // Check Department Overview
    const departmentResponse = await axios.get(`${API_BASE}/api/bed-management/departments/cardiology/beds`, {
      headers
    });
    
    const departmentHasBed = departmentResponse.data.beds?.some(b => b.bed_number === testBedNumber);
    console.log(`   Department Overview has new bed: ${departmentHasBed ? '✅' : '❌'}`);

    // Check Bed Categories
    const categoryResponse = await axios.get(`${API_BASE}/api/bed-management/categories/8/beds`, {
      headers
    });
    
    const categoryHasBed = categoryResponse.data.beds?.some(b => b.bed_number === testBedNumber);
    console.log(`   Bed Categories has new bed: ${categoryHasBed ? '✅' : '❌'}`);

    // Step 4: Test other API endpoints
    console.log('\n4. Testing other API endpoints...');
    
    // Test occupancy endpoint
    try {
      const occupancyResponse = await axios.get(`${API_BASE}/api/bed-management/beds/occupancy`, {
        headers
      });
      console.log('   ✅ Occupancy endpoint working');
    } catch (error) {
      console.log('   ❌ Occupancy endpoint failed:', error.response?.status);
    }

    // Test bed update
    try {
      const updateData = {
        status: 'maintenance',
        notes: 'Updated for testing'
      };
      
      await axios.put(`${API_BASE}/api/bed-management/beds/${createResponse.data.id}`, updateData, {
        headers
      });
      console.log('   ✅ Bed update endpoint working');
    } catch (error) {
      console.log('   ❌ Bed update endpoint failed:', error.response?.status);
    }

    console.log('\n🎉 API Fix Test Results:');
    console.log(`   Bed creation: ✅`);
    console.log(`   Department consistency: ${departmentHasBed ? '✅' : '❌'}`);
    console.log(`   Category consistency: ${categoryHasBed ? '✅' : '❌'}`);
    console.log(`   Overall result: ${departmentHasBed && categoryHasBed ? '✅ SUCCESS' : '❌ NEEDS WORK'}`);

  } catch (error) {
    console.error('❌ Error during test:', error.response?.data || error.message);
    if (error.response?.status === 400) {
      console.error('   This might be a validation error. Check the request data format.');
    }
  }
}

// Run the test
testBedCreationAPIFix();