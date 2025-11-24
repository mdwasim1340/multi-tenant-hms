#!/usr/bin/env node

/**
 * Debug script to investigate the data mismatch between 
 * Department Overview and Bed Categories for Cardiology
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

async function debugCardiologyDataMismatch() {
  try {
    console.log('🔍 Debugging Cardiology Data Mismatch...\n');
    
    // Set tenant context
    await pool.query('SET search_path TO "aajmin_polyclinic", public');
    
    console.log('=== DEPARTMENT OVERVIEW DATA (unit-based filtering) ===');
    
    // Check beds by unit = 'Cardiology' (what Department Overview shows)
    const departmentBeds = await pool.query(`
      SELECT bed_number, unit, category_id, status, created_at
      FROM beds 
      WHERE unit ILIKE '%cardiology%' OR unit = 'Cardiology'
      ORDER BY bed_number
    `);
    
    console.log(`Beds with unit containing 'cardiology': ${departmentBeds.rows.length}`);
    departmentBeds.rows.forEach(bed => {
      console.log(`  - ${bed.bed_number}: unit="${bed.unit}", category_id=${bed.category_id}, status=${bed.status}`);
    });
    
    console.log('\n=== BED CATEGORIES DATA (category_id-based filtering) ===');
    
    // Check beds by category_id = 8 (Cardiology category ID)
    const categoryBeds = await pool.query(`
      SELECT bed_number, unit, category_id, status, created_at
      FROM beds 
      WHERE category_id = 8
      ORDER BY bed_number
    `);
    
    console.log(`Beds with category_id = 8 (Cardiology): ${categoryBeds.rows.length}`);
    categoryBeds.rows.forEach(bed => {
      console.log(`  - ${bed.bed_number}: unit="${bed.unit}", category_id=${bed.category_id}, status=${bed.status}`);
    });
    
    console.log('\n=== ALL BEDS ANALYSIS ===');
    
    // Get all beds to see the full picture
    const allBeds = await pool.query(`
      SELECT bed_number, unit, category_id, status, created_at
      FROM beds 
      ORDER BY created_at DESC
    `);
    
    console.log(`Total beds in database: ${allBeds.rows.length}`);
    console.log('\nBreakdown by unit:');
    
    const unitCounts = {};
    const categoryCounts = {};
    
    allBeds.rows.forEach(bed => {
      // Count by unit
      const unit = bed.unit || 'NULL';
      unitCounts[unit] = (unitCounts[unit] || 0) + 1;
      
      // Count by category_id
      const categoryId = bed.category_id || 'NULL';
      categoryCounts[categoryId] = (categoryCounts[categoryId] || 0) + 1;
    });
    
    Object.entries(unitCounts).forEach(([unit, count]) => {
      console.log(`  - Unit "${unit}": ${count} beds`);
    });
    
    console.log('\nBreakdown by category_id:');
    Object.entries(categoryCounts).forEach(([categoryId, count]) => {
      console.log(`  - Category ID "${categoryId}": ${count} beds`);
    });
    
    console.log('\n=== CARDIOLOGY CATEGORY INFO ===');
    
    // Get Cardiology category details
    const cardiologyCategory = await pool.query(`
      SELECT id, name, description, bed_count
      FROM bed_categories 
      WHERE name ILIKE '%cardiology%'
    `);
    
    if (cardiologyCategory.rows.length > 0) {
      const category = cardiologyCategory.rows[0];
      console.log(`Category: ${category.name} (ID: ${category.id})`);
      console.log(`Description: ${category.description}`);
      console.log(`Reported bed_count: ${category.bed_count}`);
    }
    
    console.log('\n=== ISSUE ANALYSIS ===');
    
    const departmentBedCount = departmentBeds.rows.length;
    const categoryBedCount = categoryBeds.rows.length;
    
    if (departmentBedCount !== categoryBedCount) {
      console.log('❌ DATA MISMATCH CONFIRMED!');
      console.log(`   Department Overview shows: ${departmentBedCount} beds`);
      console.log(`   Bed Categories shows: ${categoryBedCount} beds`);
      console.log('');
      
      // Find beds that are in department but not in category
      const departmentBedNumbers = new Set(departmentBeds.rows.map(b => b.bed_number));
      const categoryBedNumbers = new Set(categoryBeds.rows.map(b => b.bed_number));
      
      const inDepartmentNotCategory = [...departmentBedNumbers].filter(x => !categoryBedNumbers.has(x));
      const inCategoryNotDepartment = [...categoryBedNumbers].filter(x => !departmentBedNumbers.has(x));
      
      if (inDepartmentNotCategory.length > 0) {
        console.log('🔍 Beds in Department Overview but NOT in Bed Categories:');
        inDepartmentNotCategory.forEach(bedNumber => {
          const bed = departmentBeds.rows.find(b => b.bed_number === bedNumber);
          console.log(`   - ${bedNumber}: unit="${bed.unit}", category_id=${bed.category_id || 'NULL'}`);
        });
      }
      
      if (inCategoryNotDepartment.length > 0) {
        console.log('🔍 Beds in Bed Categories but NOT in Department Overview:');
        inCategoryNotDepartment.forEach(bedNumber => {
          const bed = categoryBeds.rows.find(b => b.bed_number === bedNumber);
          console.log(`   - ${bedNumber}: unit="${bed.unit}", category_id=${bed.category_id}`);
        });
      }
      
      console.log('\n💡 SOLUTION:');
      console.log('   The beds shown in Department Overview need to have their category_id set to 8 (Cardiology)');
      console.log('   This will make both screens show the same beds consistently.');
      
    } else {
      console.log('✅ No mismatch found - both screens should show the same data');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

debugCardiologyDataMismatch();