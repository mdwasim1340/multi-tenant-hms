const axios = require('axios');

const API_URL = 'http://localhost:3000';

async function testMedChatSubscriptions() {
  console.log('🧪 Testing MedChat Subscription System\n');
  
  let passed = 0;
  let failed = 0;

  const headers = {
    'X-App-ID': 'medchat-mobile',
    'X-API-Key': 'medchat-dev-key-789',
    'Content-Type': 'application/json'
  };

  // Test 1: Get all MedChat tiers
  try {
    console.log('Test 1: Fetch MedChat subscription tiers');
    const response = await axios.get(
      `${API_URL}/api/subscriptions/tiers?application_id=medchat-mobile`,
      { headers }
    );
    
    if (response.data.success && response.data.tiers.length === 3) {
      console.log('✅ PASSED - Retrieved 3 MedChat tiers');
      console.log(`   - ${response.data.tiers[0].name}: ₹${response.data.tiers[0].price}`);
      console.log(`   - ${response.data.tiers[1].name}: ₹${response.data.tiers[1].price}`);
      console.log(`   - ${response.data.tiers[2].name}: ₹${response.data.tiers[2].price}`);
      passed++;
    } else {
      console.log('❌ FAILED - Expected 3 tiers');
      failed++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message);
    failed++;
  }

  // Test 2: Get specific MedChat tier
  try {
    console.log('\nTest 2: Fetch specific MedChat tier (medchat_advance)');
    const response = await axios.get(
      `${API_URL}/api/subscriptions/tiers/medchat_advance`,
      { headers }
    );
    
    if (response.data.success && response.data.tier.id === 'medchat_advance') {
      console.log('✅ PASSED - Retrieved MedChat Advance tier');
      console.log(`   - Price: ₹${response.data.tier.price}`);
      console.log(`   - Video consultation: ${response.data.tier.features.video_consultation}`);
      console.log(`   - Max consultations: ${response.data.tier.limits.max_consultations_per_month}`);
      passed++;
    } else {
      console.log('❌ FAILED - Wrong tier returned');
      failed++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message);
    failed++;
  }

  // Test 3: Compare MedChat tiers
  try {
    console.log('\nTest 3: Compare MedChat tiers (basic vs advance)');
    const response = await axios.get(
      `${API_URL}/api/subscriptions/compare?current_tier=medchat_basic&target_tier=medchat_advance`,
      { headers }
    );
    
    if (response.data.success && response.data.price_difference === 2000) {
      console.log('✅ PASSED - Tier comparison working');
      console.log(`   - Price difference: ₹${response.data.price_difference}`);
      console.log(`   - Is upgrade: ${response.data.is_upgrade}`);
      console.log(`   - Feature changes: ${Object.keys(response.data.feature_differences).length}`);
      passed++;
    } else {
      console.log('❌ FAILED - Wrong comparison result');
      failed++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message);
    failed++;
  }

  // Test 4: Verify hospital tiers still work
  try {
    console.log('\nTest 4: Verify hospital management tiers still accessible');
    const response = await axios.get(
      `${API_URL}/api/subscriptions/tiers?application_id=hospital-management`,
      { 
        headers: {
          'X-App-ID': 'hospital-management',
          'X-API-Key': 'hospital-dev-key-123',
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.success && response.data.tiers.length === 3) {
      console.log('✅ PASSED - Hospital tiers still working');
      console.log(`   - ${response.data.tiers[0].name}: ₹${response.data.tiers[0].price}`);
      passed++;
    } else {
      console.log('❌ FAILED - Hospital tiers not accessible');
      failed++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message);
    failed++;
  }

  // Test 5: Get all tiers (no filter)
  try {
    console.log('\nTest 5: Fetch all tiers (no application filter)');
    const response = await axios.get(
      `${API_URL}/api/subscriptions/tiers`,
      { headers }
    );
    
    if (response.data.success && response.data.tiers.length === 6) {
      console.log('✅ PASSED - Retrieved all 6 tiers');
      console.log(`   - Hospital tiers: 3`);
      console.log(`   - MedChat tiers: 3`);
      passed++;
    } else {
      console.log('❌ FAILED - Expected 6 total tiers');
      failed++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message);
    failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${passed}/5`);
  console.log(`❌ Failed: ${failed}/5`);
  console.log(`📈 Success Rate: ${((passed / 5) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All MedChat subscription tests passed!');
    console.log('✅ System ready for mobile app integration');
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed. Please review the errors above.`);
  }
}

// Run tests
if (require.main === module) {
  testMedChatSubscriptions().catch(console.error);
}

module.exports = { testMedChatSubscriptions };
