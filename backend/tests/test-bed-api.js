const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = 'http://localhost:3000';
const TENANT_ID = 'tenant_1762083064503';

async function testBedAPI() {
  try {
    console.log('🧪 Testing Bed Management API...');
    
    // Test bed occupancy endpoint
    console.log('\n1. Testing bed occupancy...');
    const occupancyResponse = await axios.get(`${API_BASE_URL}/api/beds/occupancy`, {
      headers: {
        'X-Tenant-ID': TENANT_ID,
        'Authorization': 'Bearer dev-token-123',
        'X-App-ID': 'hospital_system',
        'X-API-Key': 'hospital-dev-key-123',
        'Origin': 'http://localhost:3001'
      }
    });
    
    console.log('✅ Bed occupancy:', JSON.stringify(occupancyResponse.data, null, 2));
    
    // Test department beds endpoint
    console.log('\n2. Testing department beds (cardiology)...');
    const deptBedsResponse = await axios.get(`${API_BASE_URL}/api/bed-management/departments/cardiology/beds`, {
      headers: {
        'X-Tenant-ID': TENANT_ID,
        'Authorization': 'Bearer dev-token-123',
        'X-App-ID': 'hospital_system',
        'X-API-Key': 'hospital-dev-key-123',
        'Origin': 'http://localhost:3001'
      }
    });
    
    console.log('✅ Department beds:', JSON.stringify(deptBedsResponse.data, null, 2));
    
    // Test department stats endpoint
    console.log('\n3. Testing department stats (cardiology)...');
    const deptStatsResponse = await axios.get(`${API_BASE_URL}/api/bed-management/departments/cardiology/stats`, {
      headers: {
        'X-Tenant-ID': TENANT_ID,
        'Authorization': 'Bearer dev-token-123',
        'X-App-ID': 'hospital_system',
        'X-API-Key': 'hospital-dev-key-123',
        'Origin': 'http://localhost:3001'
      }
    });
    
    console.log('✅ Department stats:', JSON.stringify(deptStatsResponse.data, null, 2));
    
    console.log('\n🎉 All API tests passed!');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testBedAPI();