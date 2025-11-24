#!/usr/bin/env node

/**
 * Debug script to investigate why newly added beds don't appear immediately
 * in the category view despite successful creation
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000';
const TENANT_ID = 'aajmin_polyclinic';

// Test credentials - replace with actual values
const TEST_EMAIL = 'admin@aajminpolyclinic.com';
const TEST_PASSWORD = 'Admin@123';

async function debugBedDisplayIssue() {
  console.log('🔍 Debugging Bed Display Issue...\n');

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
      'Content-Type': 'application/json'
    };

    // Step 2: Check all beds in tenant
    console.log('2. Fetching all beds in tenant...');
    const allBedsResponse = await axios.get(`${API_BASE}/api/bed-management/beds`, {
      headers
    });

    console.log(`Total beds in database: ${allBedsResponse.data.beds?.length || 0}`);
    if (allBedsResponse.data.beds?.length > 0) {
      console.log('Recent beds:');
      allBedsResponse.data.beds.slice(-3).forEach(bed => {
        console.log(`  - ${bed.bed_number} | ${bed.department_name} | ${bed.status} | Category ID: ${bed.category_id}`);
      });
    }
    console.log('');

    // Step 3: Check bed categories
    console.log('3. Fetching bed categories...');
    const categoriesResponse = await axios.get(`${API_BASE}/api/bed-categories`, {
      headers
    });

    console.log(`Total categories: ${categoriesResponse.data.categories?.length || 0}`);
    if (categoriesResponse.data.categories?.length > 0) {
      console.log('Categories:');
      categoriesResponse.data.categories.forEach(cat => {
        console.log(`  - ${cat.name} (ID: ${cat.id}) | Beds: ${cat.bed_count || 0}`);
      });
    }
    console.log('');

    // Step 4: Check specific Cardiology category
    console.log('4. Checking Cardiology category specifically...');
    const cardiologyCategory = categoriesResponse.data.categories?.find(cat => 
      cat.name.toLowerCase().includes('cardiology')
    );

    if (cardiologyCategory) {
      console.log(`Cardiology Category ID: ${cardiologyCategory.id}`);
      console.log(`Cardiology Bed Count: ${cardiologyCategory.bed_count || 0}`);

      // Get beds for this specific category
      const categoryBedsResponse = await axios.get(
        `${API_BASE}/api/bed-management/beds?category_id=${cardiologyCategory.id}`, 
        { headers }
      );

      console.log(`Beds in Cardiology category: ${categoryBedsResponse.data.beds?.length || 0}`);
      if (categoryBedsResponse.data.beds?.length > 0) {
        categoryBedsResponse.data.beds.forEach(bed => {
          console.log(`  - ${bed.bed_number} | ${bed.status} | Dept: ${bed.department_name}`);
        });
      }
    } else {
      console.log('❌ Cardiology category not found!');
    }
    console.log('');

    // Step 5: Check if there's a caching issue
    console.log('5. Testing cache refresh...');
    
    // Make the same request twice to see if results differ
    const firstRequest = await axios.get(`${API_BASE}/api/bed-categories`, { headers });
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    const secondRequest = await axios.get(`${API_BASE}/api/bed-categories`, { headers });

    const firstCardiology = firstRequest.data.categories?.find(cat => 
      cat.name.toLowerCase().includes('cardiology')
    );
    const secondCardiology = secondRequest.data.categories?.find(cat => 
      cat.name.toLowerCase().includes('cardiology')
    );

    if (firstCardiology && secondCardiology) {
      console.log(`First request bed count: ${firstCardiology.bed_count || 0}`);
      console.log(`Second request bed count: ${secondCardiology.bed_count || 0}`);
      
      if (firstCardiology.bed_count !== secondCardiology.bed_count) {
        console.log('⚠️  Inconsistent results - possible caching issue');
      } else {
        console.log('✅ Consistent results');
      }
    }

    // Step 6: Check frontend data structure
    console.log('\n6. Analyzing data structure for frontend...');
    if (cardiologyCategory) {
      console.log('Category data structure:');
      console.log(JSON.stringify(cardiologyCategory, null, 2));
    }

  } catch (error) {
    console.error('❌ Error during debugging:', error.response?.data || error.message);
  }
}

// Run the debug
debugBedDisplayIssue();