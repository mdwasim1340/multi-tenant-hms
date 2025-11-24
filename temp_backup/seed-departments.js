#!/usr/bin/env node

/**
 * Seed script to create initial department data for all tenants
 * Usage: node scripts/seed-departments.js
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'multitenant_db',
});

// Common hospital departments with typical bed capacities
const departments = [
  {
    department_code: 'EMERG',
    name: 'Emergency Department',
    description: 'Emergency and urgent care services',
    floor_number: 1,
    building: 'Main',
    total_bed_capacity: 20,
  },
  {
    department_code: 'ICU',
    name: 'Intensive Care Unit',
    description: 'Critical care and intensive monitoring',
    floor_number: 3,
    building: 'Main',
    total_bed_capacity: 15,
  },
  {
    department_code: 'CARD',
    name: 'Cardiology',
    description: 'Heart and cardiovascular care',
    floor_number: 2,
    building: 'Main',
    total_bed_capacity: 12,
  },
  {
    department_code: 'ORTHO',
    name: 'Orthopedics',
    description: 'Bone and joint surgery',
    floor_number: 4,
    building: 'Main',
    total_bed_capacity: 18,
  },
  {
    department_code: 'PEDS',
    name: 'Pediatrics',
    description: 'Children and infant care',
    floor_number: 2,
    building: 'West Wing',
    total_bed_capacity: 16,
  },
  {
    department_code: 'OB-GYN',
    name: 'Obstetrics & Gynecology',
    description: 'Maternity and women health services',
    floor_number: 3,
    building: 'West Wing',
    total_bed_capacity: 14,
  },
  {
    department_code: 'NEURO',
    name: 'Neurology',
    description: 'Neurological disorders and brain care',
    floor_number: 5,
    building: 'Main',
    total_bed_capacity: 10,
  },
  {
    department_code: 'ONCOL',
    name: 'Oncology',
    description: 'Cancer treatment and care',
    floor_number: 4,
    building: 'West Wing',
    total_bed_capacity: 12,
  },
  {
    department_code: 'RESP',
    name: 'Respiratory',
    description: 'Lung and respiratory care',
    floor_number: 3,
    building: 'East Wing',
    total_bed_capacity: 11,
  },
  {
    department_code: 'GASTRO',
    name: 'Gastroenterology',
    description: 'Digestive system care',
    floor_number: 2,
    building: 'East Wing',
    total_bed_capacity: 9,
  },
];

async function seedDepartments() {
  const client = await pool.connect();

  try {
    // Get all tenant schemas
    const schemasResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%' OR schema_name LIKE 'demo_%'
      ORDER BY schema_name
    `);

    const schemas = schemasResult.rows.map(row => row.schema_name);

    if (schemas.length === 0) {
      console.log('❌ No tenant schemas found');
      return;
    }

    console.log(`\n📋 Found ${schemas.length} tenant schemas\n`);

    // Seed departments for each tenant
    for (const schema of schemas) {
      console.log(`🌱 Seeding departments in schema: ${schema}`);

      // Set schema context
      await client.query(`SET search_path TO "${schema}"`);

      // Check if departments already exist
      const existingResult = await client.query('SELECT COUNT(*) as count FROM departments');
      const existingCount = parseInt(existingResult.rows[0].count);

      if (existingCount > 0) {
        console.log(`   ⚠️  ${existingCount} departments already exist, skipping...`);
        continue;
      }

      // Insert departments
      let insertedCount = 0;
      for (const dept of departments) {
        try {
          await client.query(
            `INSERT INTO departments (
              department_code, name, description, floor_number, building, 
              total_bed_capacity, active_bed_count, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              dept.department_code,
              dept.name,
              dept.description,
              dept.floor_number,
              dept.building,
              dept.total_bed_capacity,
              0,
              'active',
            ]
          );
          insertedCount++;
        } catch (error) {
          if (error.code === '23505') {
            // Unique constraint violation - department already exists
            console.log(`   ⚠️  Department ${dept.department_code} already exists`);
          } else {
            throw error;
          }
        }
      }

      console.log(`   ✅ Inserted ${insertedCount} departments\n`);
    }

    console.log('✨ Department seeding completed successfully!\n');
  } catch (error) {
    console.error('❌ Error seeding departments:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the seed script
seedDepartments();
