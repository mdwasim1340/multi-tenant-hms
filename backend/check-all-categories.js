const { pool } = require('./src/database');

async function checkCategories() {
  try {
    // Check bed_categories table
    const result = await pool.query('SELECT * FROM bed_categories ORDER BY created_at DESC LIMIT 15');
    console.log('=== BED CATEGORIES ===');
    console.log('Total categories:', result.rows.length);
    result.rows.forEach(cat => {
      console.log(`- ${cat.name} (ID: ${cat.id}, Beds: ${cat.bed_count || 0})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkCategories();