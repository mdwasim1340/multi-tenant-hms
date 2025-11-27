#!/usr/bin/env node

/**
 * Check the latest bed that was created to see if it has proper category assignment
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function checkLatestBed() {
  try {
    console.log('🔍 Checking latest bed creation...\n');
    
    // Set tenant context
    await pool.query('SET search_path TO "aajmin_polyclinic", public');
    
    // Get the most recent beds
    console.log('Latest 5 beds created:');
    const latestBeds = await pool.query(`
      SELECT id, bed_number, category_id, unit, status, created_at,
             (SELECT name FROM bed_categories WHERE id = beds.category_id) as category_name
      FROM beds 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    latestBeds.rows.forEach((bed, index) => {
      console.log(`${index + 1}. ${bed.bed_number}:`);
      console.log(`   - Category ID: ${bed.category_id || 'NULL'}`);
      console.log(`   - Category Name: ${bed.category_name || 'No category assigned'}`);
      console.log(`   - Unit: ${bed.unit}`);
      console.log(`   - Status: ${bed.status}`);
      console.log(`   - Created: ${bed.created_at}`);
      console.log('');
    });
    
    // Check beds in Cardiology category specifically
    console.log('Beds in Cardiology category (ID: 8):');
    const cardiologyBeds = await pool.query(`
      SELECT bed_number, status, created_at
      FROM beds 
      WHERE category_id = 8
      ORDER BY created_at DESC
    `);
    
    if (cardiologyBeds.rows.length === 0) {
      console.log('  No beds found in Cardiology category');
    } else {
      cardiologyBeds.rows.forEach((bed, index) => {
        console.log(`  ${index + 1}. ${bed.bed_number} (${bed.status}) - Created: ${bed.created_at}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkLatestBed();