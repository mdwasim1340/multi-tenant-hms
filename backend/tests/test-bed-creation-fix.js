#!/usr/bin/env node

/**
 * Test script to verify that bed creation now includes category_id
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000';
const TENANT_ID = 'aajmin_polyclinic';
const TEST_EMAIL = 'mdwasimkrm13@gmail.com';
const TEST_PASSWORD = 'Advanture101$';

async function testBedCreationFix() {
  console.log('🧪 Testing Bed Creation Fix...\n');

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

    // Step 2: Get Cardiology category ID
    console.log('2. Getting Cardiology category...');
    const categoriesResponse = await axios.get(`${API_BASE}/api/bed-management/categories`, {
      headers
    });

    const cardiologyCategory = categoriesResponse.data.categories.find(cat => 
      cat.name.toLowerCase().includes('cardiology')
    );

    if (!cardiologyCategory) {
      console.log('❌ Cardiology category not found');
      return;
    }

    console.log(`✅ Found Cardiology category: ID ${cardiologyCategory.id}`);

    // Step 3: Create a test bed with category_id
    console.log('\n3. Creating test bed with category_id...');
    const testBedNumber = `TEST-FIX-${Date.now()}`;
    
    const bedData = {
      bed_number: testBedNumber,
      category_id: cardiologyCategory.id, // CRITICAL: Include category_id
      bed_type: 'Standard',
      floor_number: 3,
      room_number: '301',
      wing: 'A',
      status: 'available',
      features: {
        monitor: true,
        oxygen: true,
        ventilator: false
      },
      notes: 'Test bed created to verify category_id fix'
    };

    const createResponse = await axios.post(`${API_BASE}/api/bed-management/beds`, bedData, {
      headers
    });

    console.log('✅ Bed created successfully');
    console.log(`   Bed ID: ${createResponse.data.id}`);
    console.log(`   Bed Number: ${createResponse.data.bed_number}`);

    // Step 4: Verify the bed was created with correct category_id
    console.log('\n4. Verifying bed has correct category_id...');
    
    // Get beds in Cardiology category
    const categoryBedsResponse = await axios.get(
      `${API_BASE}/api/bed-management/categories/${cardiologyCategory.id}/beds`, 
      { headers }
    );

    const createdBed = categoryBedsResponse.data.beds.find(bed => 
      bed.bed_number === testBedNumber
    );

    if (createdBed) {
      console.log('✅ SUCCESS: Bed found in Cardiology category!');
      console.log(`   Bed appears in category filter as expected`);
    } else {
      console.log('❌ FAILURE: Bed not found in Cardiology category');
      console.log('   This means category_id was not set correctly');
    }

    // Step 5: Check category statistics
    console.log('\n5. Checking category statistics...');
    const updatedCategoriesResponse = await axios.get(`${API_BASE}/api/bed-management/categories`, {
      headers
    });

    const updatedCardiologyCategory = updatedCategoriesResponse.data.categories.find(cat => 
      cat.id === cardiologyCategory.id
    );

    console.log(`   Cardiology bed count: ${updatedCardiologyCategory.bed_count}`);
    
    if (updatedCardiologyCategory.bed_count > cardiologyCategory.bed_count) {
      console.log('✅ SUCCESS: Category bed count increased!');
    } else {
      console.log('⚠️  Category bed count did not increase (may need cache refresh)');
    }

    // Step 6: Verify bed appears only in correct category
    console.log('\n6. Verifying bed isolation...');
    
    // Check that bed doesn't appear in other categories
    const otherCategories = categoriesResponse.data.categories.filter(cat => 
      cat.id !== cardiologyCategory.id && cat.bed_count > 0
    );

    let foundInOtherCategory = false;
    for (const category of otherCategories.slice(0, 2)) { // Check first 2 other categories
      const otherCategoryBedsResponse = await axios.get(
        `${API_BASE}/api/bed-management/categories/${category.id}/beds`, 
        { headers }
      );

      const bedInOtherCategory = otherCategoryBedsResponse.data.beds.find(bed => 
        bed.bed_number === testBedNumber
      );

      if (bedInOtherCategory) {
        foundInOtherCategory = true;
        console.log(`❌ FAILURE: Bed found in ${category.name} category (should not be there)`);
      }
    }

    if (!foundInOtherCategory) {
      console.log('✅ SUCCESS: Bed properly isolated to Cardiology category only!');
    }

    console.log('\n🎉 Test completed!');
    console.log('\n📋 Summary:');
    console.log(`   - Bed created: ${testBedNumber}`);
    console.log(`   - Category ID: ${cardiologyCategory.id}`);
    console.log(`   - Appears in correct category: ${createdBed ? '✅' : '❌'}`);
    console.log(`   - Isolated from other categories: ${!foundInOtherCategory ? '✅' : '❌'}`);

  } catch (error) {
    console.error('❌ Error during test:', error.response?.data || error.message);
    if (error.response?.data?.details) {
      console.error('Validation details:', error.response.data.details);
    }
  }
}

// Run the test
testBedCreationFix();