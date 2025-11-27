#!/usr/bin/env node

/**
 * Check the actual bed data in the database to see category assignments
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

async function checkBedCategoryData() {
  try {
    console.log('🔍 Checking bed category data...\n');
    
    // Set tenant context
    await pool.query('SET search_path TO "aajmin_polyclinic", public');
    
    // Check bed table structure
    console.log('1. Bed table structure:');
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'beds' AND table_schema = 'aajmin_polyclinic'
      ORDER BY ordinal_position
    `);
    
    tableInfo.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Check actual bed data
    console.log('\n2. Current bed data:');
    const beds = await pool.query('SELECT id, bed_number, category_id, department_id, unit, status FROM beds LIMIT 10');
    
    if (beds.rows.length === 0) {
      console.log('  No beds found in database');
    } else {
      console.log('  Beds:');
      beds.rows.forEach(bed => {
        console.log(`    - ${bed.bed_number}: category_id=${bed.category_id}, department_id=${bed.department_id}, unit=${bed.unit}, status=${bed.status}`);
      });
    }
    
    // Check categories
    console.log('\n3. Available categories:');
    const categories = await pool.query('SELECT id, name FROM bed_categories ORDER BY id');
    
    if (categories.rows.length === 0) {
      console.log('  No categories found');
    } else {
      categories.rows.forEach(cat => {
        console.log(`    - ${cat.id}: ${cat.name}`);
      });
    }
    
    // Check if beds have category_id column
    console.log('\n4. Checking category_id column:');
    const categoryIdCheck = await pool.query(`
      SELECT COUNT(*) as total_beds,
             COUNT(category_id) as beds_with_category,
             COUNT(*) - COUNT(category_id) as beds_without_category
      FROM beds
    `);
    
    const stats = categoryIdCheck.rows[0];
    console.log(`  - Total beds: ${stats.total_beds}`);
    console.log(`  - Beds with category_id: ${stats.beds_with_category}`);
    console.log(`  - Beds without category_id: ${stats.beds_without_category}`);
    
    if (stats.beds_without_category > 0) {
      console.log('\n⚠️  ISSUE FOUND: Some beds are missing category_id assignments!');
      console.log('   This is why beds appear in all categories.');
      
      // Suggest fix
      console.log('\n💡 Suggested fix:');
      console.log('   1. Assign category_id to existing beds');
      console.log('   2. Update bed creation to require category_id');
      console.log('   3. Update frontend to send category_id when creating beds');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkBedCategoryData();