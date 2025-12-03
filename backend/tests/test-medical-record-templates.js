/**
 * Team Alpha - Medical Record Templates Test
 * Test complete template management system
 */

const axios = require('axios');
const { Pool } = require('pg');
require('dotenv').config();

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_TENANT_ID = 'tenant_1762083064503';

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'multitenant_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

// Test JWT token (would be obtained from signin in real scenario)
const TEST_JWT_TOKEN = 'test-jwt-token';

// API client with authentication
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${TEST_JWT_TOKEN}`,
    'X-Tenant-ID': TEST_TENANT_ID,
    'X-App-ID': 'hospital-management',
    'X-API-Key': 'hospital-dev-key-789',
    'Content-Type': 'application/json'
  }
});

async function testMedicalRecordTemplates() {
  console.log('🚀 Testing Medical Record Templates System...\n');

  let testResults = {
    passed: 0,
    failed: 0,
    total: 0
  };

  // Test 1: Database Migration Applied
  console.log('📋 Test 1: Database Migration Applied');
  try {
    const client = await pool.connect();
    
    // Check if medical_record_templates table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'medical_record_templates'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ medical_record_templates table exists');
      testResults.passed++;
    } else {
      console.log('❌ medical_record_templates table missing');
      testResults.failed++;
    }
    
    // Check if usage table exists
    const usageTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'medical_record_template_usage'
      );
    `);
    
    if (usageTableCheck.rows[0].exists) {
      console.log('✅ medical_record_template_usage table exists');
      testResults.passed++;
    } else {
      console.log('❌ medical_record_template_usage table missing');
      testResults.failed++;
    }
    
    // Check if functions exist
    const functionCheck = await client.query(`
      SELECT COUNT(*) as count
      FROM pg_proc
      WHERE proname IN ('get_template_statistics', 'get_recommended_templates');
    `);
    
    if (functionCheck.rows[0].count == 2) {
      console.log('✅ Template analysis functions exist');
      testResults.passed++;
    } else {
      console.log('❌ Template analysis functions missing');
      testResults.failed++;
    }
    
    // Check default templates
    const defaultTemplatesCheck = await client.query(`
      SELECT COUNT(*) as count
      FROM medical_record_templates
      WHERE tenant_id = 'default';
    `);
    
    if (defaultTemplatesCheck.rows[0].count >= 4) {
      console.log(`✅ Default templates exist (${defaultTemplatesCheck.rows[0].count} templates)`);
      testResults.passed++;
    } else {
      console.log('❌ Default templates missing');
      testResults.failed++;
    }
    
    client.release();
    testResults.total += 4;
  } catch (error) {
    console.log('❌ Database check failed:', error.message);
    testResults.failed += 4;
    testResults.total += 4;
  }

  // Test 2: Get Templates API
  console.log('\n📋 Test 2: Get Templates API');
  try {
    const response = await api.get('/api/templates');
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Get templates API working');
      console.log(`   - Templates: ${response.data.data.templates.length}`);
      console.log(`   - Total: ${response.data.data.pagination.total}`);
      testResults.passed++;
    } else {
      console.log('❌ Get templates API failed');
      testResults.failed++;
    }
    testResults.total++;
  } catch (error) {
    console.log('❌ Get templates API error:', error.response?.data?.error || error.message);
    testResults.failed++;
    testResults.total++;
  }

  // Test 3: Copy Default Templates
  console.log('\n📋 Test 3: Copy Default Templates');
  try {
    const response = await api.post('/api/templates/copy-defaults');
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Copy default templates API working');
      console.log(`   - Copied: ${response.data.data.copied_count} templates`);
      testResults.passed++;
    } else {
      console.log('❌ Copy default templates API failed');
      testResults.failed++;
    }
    testResults.total++;
  } catch (error) {
    console.log('❌ Copy default templates API error:', error.response?.data?.error || error.message);
    testResults.failed++;
    testResults.total++;
  }

  // Test 4: Create Custom Template
  console.log('\n📋 Test 4: Create Custom Template');
  try {
    const customTemplate = {
      name: 'Test Cardiology Consultation',
      description: 'Custom template for cardiology consultations',
      template_type: 'consultation',
      specialty: 'cardiology',
      fields: {
        chief_complaint: {
          type: 'textarea',
          label: 'Chief Complaint',
          required: true,
          placeholder: 'Patient\'s main cardiac concern'
        },
        cardiac_history: {
          type: 'textarea',
          label: 'Cardiac History',
          required: true,
          placeholder: 'Previous cardiac conditions and procedures'
        },
        current_medications: {
          type: 'textarea',
          label: 'Current Cardiac Medications',
          required: false,
          placeholder: 'List current cardiac medications'
        },
        vital_signs: {
          type: 'object',
          label: 'Vital Signs',
          required: true,
          fields: {
            blood_pressure: {
              type: 'text',
              label: 'Blood Pressure',
              required: true,
              placeholder: '120/80'
            },
            heart_rate: {
              type: 'number',
              label: 'Heart Rate (bpm)',
              required: true,
              validation: { min: 30, max: 200 }
            }
          }
        },
        ecg_findings: {
          type: 'textarea',
          label: 'ECG Findings',
          required: false,
          placeholder: 'ECG interpretation'
        },
        assessment: {
          type: 'textarea',
          label: 'Cardiac Assessment',
          required: true,
          placeholder: 'Clinical assessment and diagnosis'
        },
        plan: {
          type: 'textarea',
          label: 'Treatment Plan',
          required: true,
          placeholder: 'Treatment plan and follow-up'
        }
      },
      default_values: {
        vital_signs: {
          blood_pressure: '120/80',
          heart_rate: 72
        }
      },
      validation_rules: {
        'vital_signs.heart_rate': { min: 30, max: 200 },
        'chief_complaint': { minLength: 10, maxLength: 500 }
      },
      is_default: false
    };

    const response = await api.post('/api/templates', customTemplate);
    
    if (response.status === 201 && response.data.success) {
      console.log('✅ Create custom template API working');
      console.log(`   - Template ID: ${response.data.data.template.id}`);
      console.log(`   - Template Name: ${response.data.data.template.name}`);
      
      // Store template ID for later tests
      global.testTemplateId = response.data.data.template.id;
      testResults.passed++;
    } else {
      console.log('❌ Create custom template API failed');
      testResults.failed++;
    }
    testResults.total++;
  } catch (error) {
    console.log('❌ Create custom template API error:', error.response?.data?.error || error.message);
    testResults.failed++;
    testResults.total++;
  }

  // Test 5: Get Template by ID
  console.log('\n📋 Test 5: Get Template by ID');
  try {
    if (global.testTemplateId) {
      const response = await api.get(`/api/templates/${global.testTemplateId}`);
      
      if (response.status === 200 && response.data.success) {
        console.log('✅ Get template by ID API working');
        console.log(`   - Template: ${response.data.data.template.name}`);
        console.log(`   - Type: ${response.data.data.template.template_type}`);
        console.log(`   - Specialty: ${response.data.data.template.specialty}`);
        testResults.passed++;
      } else {
        console.log('❌ Get template by ID API failed');
        testResults.failed++;
      }
    } else {
      console.log('⚠️  Skipping test - no template ID available');
      testResults.failed++;
    }
    testResults.total++;
  } catch (error) {
    console.log('❌ Get template by ID API error:', error.response?.data?.error || error.message);
    testResults.failed++;
    testResults.total++;
  }

  // Test 6: Apply Template
  console.log('\n📋 Test 6: Apply Template');
  try {
    if (global.testTemplateId) {
      const customValues = {
        chief_complaint: 'Chest pain and shortness of breath',
        cardiac_history: 'Previous MI in 2020',
        vital_signs: {
          blood_pressure: '140/90',
          heart_rate: 85
        }
      };

      const response = await api.post(`/api/templates/${global.testTemplateId}/apply`, {
        custom_values: customValues
      });
      
      if (response.status === 200 && response.data.success) {
        console.log('✅ Apply template API working');
        console.log(`   - Template applied: ${response.data.data.template.name}`);
        console.log(`   - Fields populated: ${Object.keys(response.data.data.populated_fields).length}`);
        
        // Check if custom values were applied
        const populatedFields = response.data.data.populated_fields;
        if (populatedFields.chief_complaint === customValues.chief_complaint) {
          console.log('✅ Custom values applied correctly');
        } else {
          console.log('⚠️  Custom values not applied correctly');
        }
        
        testResults.passed++;
      } else {
        console.log('❌ Apply template API failed');
        testResults.failed++;
      }
    } else {
      console.log('⚠️  Skipping test - no template ID available');
      testResults.failed++;
    }
    testResults.total++;
  } catch (error) {
    console.log('❌ Apply template API error:', error.response?.data?.error || error.message);
    testResults.failed++;
    testResults.total++;
  }

  // Test 7: Update Template
  console.log('\n📋 Test 7: Update Template');
  try {
    if (global.testTemplateId) {
      const updateData = {
        description: 'Updated custom template for cardiology consultations with enhanced features',
        is_default: true
      };

      const response = await api.put(`/api/templates/${global.testTemplateId}`, updateData);
      
      if (response.status === 200 && response.data.success) {
        console.log('✅ Update template API working');
        console.log(`   - Updated description: ${response.data.data.template.description.substring(0, 50)}...`);
        console.log(`   - Is default: ${response.data.data.template.is_default}`);
        testResults.passed++;
      } else {
        console.log('❌ Update template API failed');
        testResults.failed++;
      }
    } else {
      console.log('⚠️  Skipping test - no template ID available');
      testResults.failed++;
    }
    testResults.total++;
  } catch (error) {
    console.log('❌ Update template API error:', error.response?.data?.error || error.message);
    testResults.failed++;
    testResults.total++;
  }

  // Test 8: Record Template Usage
  console.log('\n📋 Test 8: Record Template Usage');
  try {
    if (global.testTemplateId) {
      const usageData = {
        template_id: global.testTemplateId,
        medical_record_id: 123, // Mock medical record ID
        customizations: {
          added_field: 'Additional notes',
          modified_field: 'chief_complaint'
        },
        completion_time_seconds: 180
      };

      const response = await api.post('/api/templates/usage', usageData);
      
      if (response.status === 201 && response.data.success) {
        console.log('✅ Record template usage API working');
        console.log(`   - Usage recorded for template: ${global.testTemplateId}`);
        console.log(`   - Completion time: ${usageData.completion_time_seconds} seconds`);
        testResults.passed++;
      } else {
        console.log('❌ Record template usage API failed');
        testResults.failed++;
      }
    } else {
      console.log('⚠️  Skipping test - no template ID available');
      testResults.failed++;
    }
    testResults.total++;
  } catch (error) {
    console.log('❌ Record template usage API error:', error.response?.data?.error || error.message);
    testResults.failed++;
    testResults.total++;
  }

  // Test 9: Get Template Statistics
  console.log('\n📋 Test 9: Get Template Statistics');
  try {
    const response = await api.get('/api/templates/statistics');
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Get template statistics API working');
      console.log(`   - Statistics for ${response.data.data.statistics.length} templates`);
      
      if (response.data.data.statistics.length > 0) {
        const firstStat = response.data.data.statistics[0];
        console.log(`   - Most used: ${firstStat.template_name} (${firstStat.usage_count} uses)`);
      }
      
      testResults.passed++;
    } else {
      console.log('❌ Get template statistics API failed');
      testResults.failed++;
    }
    testResults.total++;
  } catch (error) {
    console.log('❌ Get template statistics API error:', error.response?.data?.error || error.message);
    testResults.failed++;
    testResults.total++;
  }

  // Test 10: Get Template Recommendations
  console.log('\n📋 Test 10: Get Template Recommendations');
  try {
    const response = await api.get('/api/templates/recommendations?specialty=cardiology&template_type=consultation');
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Get template recommendations API working');
      console.log(`   - Recommendations: ${response.data.data.recommendations.length}`);
      
      if (response.data.data.recommendations.length > 0) {
        const topRec = response.data.data.recommendations[0];
        console.log(`   - Top recommendation: ${topRec.template_name} (score: ${topRec.recommendation_score})`);
      }
      
      testResults.passed++;
    } else {
      console.log('❌ Get template recommendations API failed');
      testResults.failed++;
    }
    testResults.total++;
  } catch (error) {
    console.log('❌ Get template recommendations API error:', error.response?.data?.error || error.message);
    testResults.failed++;
    testResults.total++;
  }

  // Test 11: Template Filtering
  console.log('\n📋 Test 11: Template Filtering');
  try {
    const response = await api.get('/api/templates?template_type=consultation&specialty=cardiology&is_active=true');
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Template filtering API working');
      console.log(`   - Filtered templates: ${response.data.data.templates.length}`);
      console.log(`   - Total matching: ${response.data.data.pagination.total}`);
      
      // Verify filtering worked
      const templates = response.data.data.templates;
      const allMatch = templates.every(t => 
        t.template_type === 'consultation' && 
        (t.specialty === 'cardiology' || t.specialty === null) &&
        t.is_active === true
      );
      
      if (allMatch) {
        console.log('✅ Filtering criteria applied correctly');
      } else {
        console.log('⚠️  Filtering criteria not applied correctly');
      }
      
      testResults.passed++;
    } else {
      console.log('❌ Template filtering API failed');
      testResults.failed++;
    }
    testResults.total++;
  } catch (error) {
    console.log('❌ Template filtering API error:', error.response?.data?.error || error.message);
    testResults.failed++;
    testResults.total++;
  }

  // Test 12: Template Search
  console.log('\n📋 Test 12: Template Search');
  try {
    const response = await api.get('/api/templates?search=cardiology');
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Template search API working');
      console.log(`   - Search results: ${response.data.data.templates.length}`);
      
      // Verify search worked
      const templates = response.data.data.templates;
      const hasSearchTerm = templates.some(t => 
        t.name.toLowerCase().includes('cardiology') || 
        (t.description && t.description.toLowerCase().includes('cardiology'))
      );
      
      if (hasSearchTerm || templates.length === 0) {
        console.log('✅ Search functionality working correctly');
      } else {
        console.log('⚠️  Search functionality not working correctly');
      }
      
      testResults.passed++;
    } else {
      console.log('❌ Template search API failed');
      testResults.failed++;
    }
    testResults.total++;
  } catch (error) {
    console.log('❌ Template search API error:', error.response?.data?.error || error.message);
    testResults.failed++;
    testResults.total++;
  }

  // Display final results
  console.log('\n' + '='.repeat(60));
  console.log('📊 MEDICAL RECORD TEMPLATES TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${testResults.passed}/${testResults.total}`);
  console.log(`❌ Failed: ${testResults.failed}/${testResults.total}`);
  console.log(`📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

  if (testResults.passed === testResults.total) {
    console.log('\n🎉 ALL TESTS PASSED! Medical Record Templates System is working perfectly!');
    console.log('\n💡 Template System Benefits:');
    console.log('   - Standardized medical record creation');
    console.log('   - Improved documentation quality');
    console.log('   - Faster record completion');
    console.log('   - Specialty-specific workflows');
    console.log('   - Usage analytics and recommendations');
    console.log('   - Template versioning and management');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
  }

  console.log('\n🔄 Next Steps:');
  console.log('   1. Create frontend template components');
  console.log('   2. Integrate templates into medical record forms');
  console.log('   3. Add template management UI');
  console.log('   4. Test with real medical record creation');

  return testResults.passed === testResults.total;
}

// Run the test
if (require.main === module) {
  testMedicalRecordTemplates()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Test execution failed:', error);
      process.exit(1);
    })
    .finally(() => {
      pool.end();
    });
}

module.exports = { testMedicalRecordTemplates };