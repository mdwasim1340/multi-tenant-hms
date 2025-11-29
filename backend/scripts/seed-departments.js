/**
 * Seed Departments Data
 * Creates initial hospital departments with bed capacity
 * Run: node scripts/seed-departments.js
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
});

const departments = [
  {
    code: 'EMERG',
    name: 'Emergency Department',
    description: 'Emergency and trauma care',
    floor: 1,
    building: 'Main',
    capacity: 20,
  },
  {
    code: 'ICU',
    name: 'Intensive Care Unit',
    description: 'Critical care for severely ill patients',
    floor: 3,
    building: 'Main',
    capacity: 15,
  },
  {
    code: 'CARD',
    name: 'Cardiology',
    description: 'Heart and cardiovascular care',
    floor: 2,
    building: 'Main',
    capacity: 25,
  },
  {
    code: 'ORTHO',
    name: 'Orthopedics',
    description: 'Bone, joint, and musculoskeletal care',
    floor: 4,
    building: 'Main',
    capacity: 30,
  },
  {
    code: 'PEDIA',
    name: 'Pediatrics',
    description: 'Child and adolescent care',
    floor: 2,
    building: 'West Wing',
    capacity: 25,
  },
  {
    code: 'MATER',
    name: 'Maternity',
    description: 'Obstetrics and maternity care',
    floor: 3,
    building: 'West Wing',
    capacity: 20,
  },
  {
    code: 'NEURO',
    name: 'Neurology',
    description: 'Brain and nervous system care',
    floor: 5,
    building: 'Main',
    capacity: 20,
  },
  {
    code: 'ONCO',
    name: 'Oncology',
    description: 'Cancer treatment and care',
    floor: 4,
    building: 'East Wing',
    capacity: 18,
  },
  {
    code: 'SURG',
    name: 'Surgery',
    description: 'Surgical procedures and post-op care',
    floor: 3,
    building: 'East Wing',
    capacity: 22,
  },
  {
    code: 'GWARD',
    name: 'General Ward',
    description: 'General medical care',
    floor: 2,
    building: 'East Wing',
    capacity: 40,
  },
];

async function seedDepartments() {
  const client = await pool.connect();
  
  try {
    console.log('🏥 Starting department seeding...\n');
    
    // Get all tenant schemas (including custom named ones)
    const schemasResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%' 
         OR schema_name LIKE 'demo_%'
         OR schema_name = 'aajmin_polyclinic'
         OR schema_name LIKE 'test_complete_%'
      ORDER BY schema_name
    `);
    
    const tenantSchemas = schemasResult.rows.map(row => row.schema_name);
    
    if (tenantSchemas.length === 0) {
      console.log('⚠️  No tenant schemas found. Please create tenants first.');
      return;
    }
    
    console.log(`Found ${tenantSchemas.length} tenant schema(s):\n`);
    
    for (const schema of tenantSchemas) {
      console.log(`📋 Seeding departments for schema: ${schema}`);
      
      // Set search path to tenant schema
      await client.query(`SET search_path TO "${schema}"`);
      
      // Check if departments table exists
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = '${schema}' 
          AND table_name = 'departments'
        )
      `);
      
      if (!tableCheck.rows[0].exists) {
        console.log(`   ⚠️  Departments table does not exist in ${schema}. Skipping...`);
        continue;
      }
      
      // Check if departments already exist
      const existingCount = await client.query('SELECT COUNT(*) FROM departments');
      
      if (parseInt(existingCount.rows[0].count) > 0) {
        console.log(`   ℹ️  Departments already exist (${existingCount.rows[0].count} found). Skipping...`);
        continue;
      }
      
      // Insert departments
      let insertedCount = 0;
      for (const dept of departments) {
        try {
          await client.query(`
            INSERT INTO departments (
              department_code, name, description, floor_number, 
              building, total_bed_capacity, active_bed_count, status
            ) VALUES ($1, $2, $3, $4, $5, $6, 0, 'active')
          `, [
            dept.code,
            dept.name,
            dept.description,
            dept.floor,
            dept.building,
            dept.capacity,
          ]);
          insertedCount++;
        } catch (error) {
          console.log(`   ❌ Error inserting ${dept.name}: ${error.message}`);
        }
      }
      
      console.log(`   ✅ Inserted ${insertedCount} departments\n`);
    }
    
    console.log('✨ Department seeding completed!\n');
    
    // Display summary
    console.log('📊 Summary:');
    for (const schema of tenantSchemas) {
      await client.query(`SET search_path TO "${schema}"`);
      const count = await client.query('SELECT COUNT(*) FROM departments');
      console.log(`   ${schema}: ${count.rows[0].count} departments`);
    }
    
  } catch (error) {
    console.error('❌ Error seeding departments:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  seedDepartments()
    .then(() => {
      console.log('\n✅ Seed script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Seed script failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDepartments };
