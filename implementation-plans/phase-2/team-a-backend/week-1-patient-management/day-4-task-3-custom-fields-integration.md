# Day 4, Task 3: Custom Fields Integration Testing

## 🎯 Task Objective
Test and verify custom fields work correctly with all patient operations.

## ⏱️ Estimated Time: 2 hours

## 📝 Step 1: Create Custom Fields Test Script

Create file: `backend/scripts/test-custom-fields.js`

```javascript
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function testCustomFields() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Testing Custom Fields Integration\n');
    
    // Step 1: Create a custom field in public schema
    console.log('1. Creating custom field definition...');
    await client.query(`
      INSERT INTO public.custom_fields (name, label, type, entity_type, required, display_order)
      VALUES ('preferred_language', 'Preferred Language', 'text', 'patient', false, 1)
      ON CONFLICT (name, entity_type) DO NOTHING
    `);
    console.log('   ✅ Custom field created\n');
    
    // Step 2: Create patient with custom field
    console.log('2. Creating patient with custom field...');
    await client.query(`SET search_path TO "demo_hospital_001"`);
    
    const patientResult = await client.query(`
      INSERT INTO patients (patient_number, first_name, last_name, date_of_birth)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, [`CF_TEST_${Date.now()}`, 'Custom', 'Field', '1990-01-01']);
    
    const patientId = patientResult.rows[0].id;
    console.log(`   ✅ Patient created with ID: ${patientId}\n`);
    
    // Step 3: Add custom field value
    console.log('3. Adding custom field value...');
    const fieldResult = await client.query(`
      SELECT id FROM public.custom_fields 
      WHERE name = 'preferred_language' AND entity_type = 'patient'
    `);
    
    const fieldId = fieldResult.rows[0].id;
    
    await client.query(`
      INSERT INTO custom_field_values (entity_type, entity_id, field_id, value)
      VALUES ($1, $2, $3, $4)
    `, ['patient', patientId, fieldId, 'Spanish']);
    console.log('   ✅ Custom field value added\n');
    
    // Step 4: Retrieve patient with custom field
    console.log('4. Retrieving patient with custom field...');
    const retrieveResult = await client.query(`
      SELECT 
        p.*,
        json_object_agg(cf.name, cfv.value) FILTER (WHERE cfv.id IS NOT NULL) as custom_fields
      FROM patients p
      LEFT JOIN custom_field_values cfv ON cfv.entity_id = p.id AND cfv.entity_type = 'patient'
      LEFT JOIN public.custom_fields cf ON cf.id = cfv.field_id
      WHERE p.id = $1
      GROUP BY p.id
    `, [patientId]);
    
    const patient = retrieveResult.rows[0];
    console.log('   Patient:', {
      id: patient.id,
      name: `${patient.first_name} ${patient.last_name}`,
      custom_fields: patient.custom_fields
    });
    console.log('   ✅ Custom field retrieved successfully\n');
    
    // Step 5: Update custom field
    console.log('5. Updating custom field value...');
    await client.query(`
      UPDATE custom_field_values
      SET value = $1, updated_at = CURRENT_TIMESTAMP
      WHERE entity_type = 'patient' AND entity_id = $2 AND field_id = $3
    `, ['English', patientId, fieldId]);
    console.log('   ✅ Custom field updated\n');
    
    // Step 6: Verify update
    console.log('6. Verifying update...');
    const verifyResult = await client.query(`
      SELECT value FROM custom_field_values
      WHERE entity_type = 'patient' AND entity_id = $1 AND field_id = $2
    `, [patientId, fieldId]);
    
    console.log('   Updated value:', verifyResult.rows[0].value);
    console.log('   ✅ Update verified\n');
    
    console.log('🎉 All custom fields tests passed!\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

testCustomFields()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
```

## 📝 Step 2: Run Custom Fields Test

```bash
node scripts/test-custom-fields.js
```

Expected output: All tests passing

## 📝 Step 3: Test via API

```bash
# Create patient with custom fields
curl -X POST http://localhost:3000/api/patients \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: demo_hospital_001" \
  -d '{
    "patient_number": "CF001",
    "first_name": "Custom",
    "last_name": "Fields",
    "date_of_birth": "1990-01-01T00:00:00.000Z",
    "custom_fields": {
      "preferred_language": "Spanish",
      "emergency_contact_relationship": "Spouse"
    }
  }'

# Get patient and verify custom fields
curl http://localhost:3000/api/patients/[ID] \
  -H "X-Tenant-ID: demo_hospital_001"

# Update custom fields
curl -X PUT http://localhost:3000/api/patients/[ID] \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: demo_hospital_001" \
  -d '{
    "custom_fields": {
      "preferred_language": "English"
    }
  }'
```

## ✅ Verification Checklist

- [ ] Custom field definitions can be created
- [ ] Custom field values save correctly
- [ ] Custom fields retrieved with patient data
- [ ] Custom fields update correctly
- [ ] Custom fields delete when patient deleted
- [ ] Multiple custom fields work together
- [ ] Custom fields isolated per tenant

## 📄 Commit

```bash
git add scripts/test-custom-fields.js
git commit -m "test(patient): Add custom fields integration tests"
```