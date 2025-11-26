const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'multitenant_db',
  password: 'password',
  port: 5432,
});

async function createAllCategoryBeds() {
  try {
    // Set tenant context
    await pool.query('SET search_path TO "aajmin_polyclinic"');
    
    console.log('🏥 Creating beds for all categories in aajmin_polyclinic tenant...');
    
    // First, let's check current bed count
    const currentCount = await pool.query('SELECT COUNT(*) as count FROM beds');
    console.log(`📊 Current bed count: ${currentCount.rows[0].count}`);
    
    // Get all departments
    const departments = await pool.query('SELECT * FROM departments ORDER BY id');
    console.log(`📋 Found ${departments.rows.length} departments`);
    
    // Define bed categories with their department mappings
    const categoryBeds = [
      { category: 'ICU', department: 'Intensive Care Unit', count: 6, startNum: 101 },
      { category: 'General', department: 'General Ward', count: 8, startNum: 201 },
      { category: 'Pediatric', department: 'Pediatrics', count: 2, startNum: 301 },
      { category: 'Emergency', department: 'Emergency', count: 2, startNum: 401 },
      { category: 'Cardiology', department: 'Cardiology', count: 9, startNum: 501 },
      { category: 'Maternity', department: 'Maternity', count: 8, startNum: 601 },
      { category: 'Neurology', department: 'Neurology', count: 5, startNum: 701 },
      { category: 'Orthopedics', department: 'Orthopedics', count: 5, startNum: 801 },
      { category: 'Surgery', department: 'Surgery', count: 5, startNum: 901 },
      { category: 'Oncology', department: 'Oncology', count: 5, startNum: 1001 }
    ];
    
    // Clear existing beds first
    await pool.query('DELETE FROM beds');
    console.log('🗑️  Cleared existing beds');
    
    let totalCreated = 0;
    
    for (const categoryInfo of categoryBeds) {
      console.log(`\n🏗️  Creating ${categoryInfo.count} beds for ${categoryInfo.category}...`);
      
      // Find or create department
      let department = departments.rows.find(d => 
        d.name.toLowerCase().includes(categoryInfo.department.toLowerCase()) ||
        categoryInfo.department.toLowerCase().includes(d.name.toLowerCase())
      );
      
      if (!department) {
        // Create department if it doesn't exist
        const newDept = await pool.query(
          'INSERT INTO departments (name, description) VALUES ($1, $2) RETURNING *',
          [categoryInfo.department, `${categoryInfo.department} Department`]
        );
        department = newDept.rows[0];
        console.log(`   ➕ Created department: ${department.name}`);
      }
      
      // Create beds for this category
      for (let i = 0; i < categoryInfo.count; i++) {
        const bedNumber = `${categoryInfo.startNum + i}`;
        const room = `${Math.floor((categoryInfo.startNum + i) / 100)}${String(i + 1).padStart(2, '0')}`;
        const floor = Math.floor((categoryInfo.startNum + i) / 100).toString();
        
        const statuses = ['available', 'occupied', 'reserved', 'cleaning'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        await pool.query(`
          INSERT INTO beds (
            bed_number, unit, department_id, status, bed_type, 
            floor, wing, room, is_active, created_at, updated_at,
            created_by, updated_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW(), $10, $11)
        `, [
          bedNumber,
          categoryInfo.category, // unit field
          department.id,
          status,
          'Standard',
          floor,
          'A',
          room,
          true,
          1, // created_by
          1  // updated_by
        ]);
        
        totalCreated++;
      }
      
      console.log(`   ✅ Created ${categoryInfo.count} beds for ${categoryInfo.category}`);
    }
    
    // Verify final count
    const finalCount = await pool.query('SELECT COUNT(*) as count FROM beds');
    console.log(`\n🎉 SUCCESS! Created ${totalCreated} beds total`);
    console.log(`📊 Final bed count: ${finalCount.rows[0].count}`);
    
    // Show beds by department
    const bedsByDept = await pool.query(`
      SELECT 
        d.name as department_name,
        COUNT(b.id) as bed_count,
        STRING_AGG(b.status, ', ') as statuses
      FROM beds b
      JOIN departments d ON b.department_id = d.id
      GROUP BY d.name
      ORDER BY d.name
    `);
    
    console.log('\n📋 Beds by department:');
    bedsByDept.rows.forEach(row => {
      console.log(`   ${row.department_name}: ${row.bed_count} beds`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

createAllCategoryBeds();