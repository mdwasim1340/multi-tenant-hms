#!/usr/bin/env ts-node

/**
 * Script to seed initial department data for all tenants
 * Usage: ts-node scripts/seed-departments.ts
 */
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'multitenant_db',
});

const DEPARTMENTS = [
  { name: 'Emergency', code: 'ER', capacity: 25 },
  { name: 'Intensive Care Unit', code: 'ICU', capacity: 10 },
  { name: 'Cardiology', code: 'CARD', capacity: 15 },
  { name: 'Orthopedics', code: 'ORTHO', capacity: 14 },
  { name: 'Pediatrics', code: 'PEDS', capacity: 20 },
  { name: 'Maternity', code: 'MAT', capacity: 12 },
  { name: 'Surgery', code: 'SURG', capacity: 8 },
  { name: 'Neurology', code: 'NEURO', capacity: 8 },
  { name: 'Oncology', code: 'ONC', capacity: 10 },
  { name: 'General Medicine', code: 'GEN', capacity: 18 },
];

async function seedDepartments() {
  const client = await pool.connect();
  try {
    const tenants = await client.query('SELECT schema_name FROM tenants WHERE is_active = true');
    for (const row of tenants.rows) {
      const schema = row.schema_name;
      console.log(`Seeding departments for tenant schema: ${schema}`);
      await client.query(`SET search_path TO "${schema}", public`);
      for (const dept of DEPARTMENTS) {
        await client.query(
          `INSERT INTO departments (department_name, department_code, total_capacity, status, created_by)
           VALUES ($1, $2, $3, 'active', 1)
           ON CONFLICT (department_code) DO NOTHING`,
          [dept.name, dept.code, dept.capacity]
        );
      }
    }
    console.log('✅ Departments seeded for all tenants.');
  } catch (error) {
    console.error('❌ Error seeding departments:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

seedDepartments().catch(console.error);