/**
 * Fix bed data integrity by updating missing department_id and category_id
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

async function fixBedDataIntegrity() {
  console.log('🔧 Fixing bed data integrity...\n');

  try {
    // Set tenant context
    await pool.query('SET search_path TO "aajmin_polyclinic"');
    console.log('✅ Set tenant context to aajmin_polyclinic');

    // First, let's create the bed_categories table if it doesn't exist
    console.log('\n1. Creating bed_categories table if needed...');
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS bed_categories (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          color VARCHAR(7) DEFAULT '#3B82F6',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ bed_categories table created/verified');

      // Insert default categories
      await pool.query(`
        INSERT INTO bed_categories (id, name, description, color) VALUES
        (1, 'General', 'General ward beds', '#3B82F6'),
        (2, 'ICU', 'Intensive Care Unit beds', '#EF4444'),
        (3, 'Emergency', 'Emergency department beds', '#F59E0B'),
        (4, 'Pediatric', 'Pediatric ward beds', '#10B981'),
        (5, 'Maternity', 'Maternity ward beds', '#EC4899'),
        (8, 'Cardiology', 'Cardiac care beds', '#FF6B6B'),
        (9, 'Orthopedics', 'Orthopedic care beds', '#4ECDC4'),
        (10, 'Neurology', 'Neurological care beds', '#45B7D1')
        ON CONFLICT (id) DO NOTHING
      `);
      console.log('✅ Default categories inserted');
    } catch (error) {
      console.log('⚠️ Categories setup:', error.message);
    }

    // Get all beds that need fixing
    console.log('\n2. Getting beds that need fixing...');
    const bedsToFix = await pool.query(`
      SELECT id, bed_number, department_id, category_id, bed_type
      FROM beds 
      WHERE department_id IS NULL OR category_id IS NULL
      ORDER BY bed_number
    `);

    console.log(`📊 Found ${bedsToFix.rows.length} beds to fix`);

    // Define mapping logic based on bed patterns and types
    const getBedMapping = (bedNumber, bedType) => {
      // Map based on bed number patterns and types
      if (bedNumber.includes('CARDIO') || bedNumber.includes('TEST-001') || bedNumber.includes('CONSISTENCY') || bedNumber.includes('FIX')) {
        return { department_id: 3, category_id: 8 }; // Cardiology
      }
      if (bedNumber.includes('ICU') || bedNumber.startsWith('101') || bedNumber.startsWith('102')) {
        return { department_id: 2, category_id: 2 }; // ICU
      }
      if (bedNumber.startsWith('201') || bedNumber.startsWith('202')) {
        return { department_id: 10, category_id: 1 }; // General
      }
      if (bedNumber.startsWith('301')) {
        return { department_id: 5, category_id: 4 }; // Pediatrics
      }
      
      // Default based on bed type
      if (bedType === 'ICU') {
        return { department_id: 2, category_id: 2 }; // ICU
      }
      if (bedType === 'Standard') {
        return { department_id: 10, category_id: 1 }; // General
      }
      
      // Default fallback
      return { department_id: 10, category_id: 1 }; // General
    };

    // Fix each bed
    console.log('\n3. Updating beds with proper department_id and category_id...');
    let fixedCount = 0;

    for (const bed of bedsToFix.rows) {
      const mapping = getBedMapping(bed.bed_number, bed.bed_type);
      
      // Only update if values are actually missing
      const needsDeptUpdate = bed.department_id === null;
      const needsCatUpdate = bed.category_id === null;
      
      if (needsDeptUpdate || needsCatUpdate) {
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;

        if (needsDeptUpdate) {
          updateFields.push(`department_id = $${paramIndex++}`);
          updateValues.push(mapping.department_id);
        }

        if (needsCatUpdate) {
          updateFields.push(`category_id = $${paramIndex++}`);
          updateValues.push(mapping.category_id);
        }

        updateValues.push(bed.id);

        const updateQuery = `
          UPDATE beds 
          SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
          WHERE id = $${paramIndex}
        `;

        await pool.query(updateQuery, updateValues);
        
        console.log(`   ✅ Fixed ${bed.bed_number}: Dept ${mapping.department_id}, Cat ${mapping.category_id}`);
        fixedCount++;
      }
    }

    console.log(`\n✅ Fixed ${fixedCount} beds`);

    // Verify the fix
    console.log('\n4. Verifying the fix...');
    const verifyBeds = await pool.query(`
      SELECT 
        COUNT(*) as total_beds,
        COUNT(CASE WHEN department_id IS NULL THEN 1 END) as missing_dept,
        COUNT(CASE WHEN category_id IS NULL THEN 1 END) as missing_cat
      FROM beds
    `);

    const stats = verifyBeds.rows[0];
    console.log(`📊 Verification results:`);
    console.log(`   Total beds: ${stats.total_beds}`);
    console.log(`   Missing department_id: ${stats.missing_dept}`);
    console.log(`   Missing category_id: ${stats.missing_cat}`);

    if (stats.missing_dept === '0' && stats.missing_cat === '0') {
      console.log('\n🎉 SUCCESS! All beds now have proper department_id and category_id');
    } else {
      console.log('\n⚠️ Some beds still have missing values');
    }

    // Show General department beds specifically
    console.log('\n5. Checking General department beds (category_id = 1)...');
    const generalBeds = await pool.query(`
      SELECT bed_number, department_id, category_id, status
      FROM beds 
      WHERE category_id = 1
      ORDER BY bed_number
    `);

    console.log(`📊 General department beds (${generalBeds.rows.length}):`);
    generalBeds.rows.forEach(bed => {
      console.log(`   - ${bed.bed_number} (Dept: ${bed.department_id}, Status: ${bed.status})`);
    });

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  } finally {
    await pool.end();
  }
}

fixBedDataIntegrity().catch(console.error);