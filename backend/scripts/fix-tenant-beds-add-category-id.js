require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function fixTenantBedsAddCategoryId() {
  try {
    console.log('🔧 Adding category_id column to tenant beds tables...\n');
    
    // Get all tenant schemas
    const tenantSchemas = await pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%' 
         OR schema_name LIKE 'demo_%' 
         OR schema_name = 'aajmin_polyclinic'
      ORDER BY schema_name
    `);
    
    console.log(`Found ${tenantSchemas.rows.length} tenant schemas to update:`);
    tenantSchemas.rows.forEach(schema => {
      console.log(`- ${schema.schema_name}`);
    });
    
    for (const schema of tenantSchemas.rows) {
      const schemaName = schema.schema_name;
      console.log(`\n🔧 Processing schema: ${schemaName}`);
      
      try {
        // Check if beds table exists in this schema
        const bedsExists = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = $1 AND table_name = 'beds'
          );
        `, [schemaName]);
        
        if (!bedsExists.rows[0].exists) {
          console.log(`  ⚠️ beds table does not exist in ${schemaName}, skipping...`);
          continue;
        }
        
        // Check if category_id column already exists
        const categoryIdExists = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = $1 AND table_name = 'beds' AND column_name = 'category_id'
          );
        `, [schemaName]);
        
        if (categoryIdExists.rows[0].exists) {
          console.log(`  ✅ category_id column already exists in ${schemaName}`);
          continue;
        }
        
        // Add category_id column
        console.log(`  ➕ Adding category_id column to ${schemaName}.beds...`);
        
        await pool.query(`
          ALTER TABLE "${schemaName}".beds 
          ADD COLUMN category_id INTEGER REFERENCES public.bed_categories(id)
        `);
        
        console.log(`  ✅ Successfully added category_id column to ${schemaName}.beds`);
        
        // Set default category for existing beds (optional)
        const bedsCount = await pool.query(`
          SELECT COUNT(*) as count FROM "${schemaName}".beds
        `);
        
        if (parseInt(bedsCount.rows[0].count) > 0) {
          console.log(`  🔄 Setting default category for ${bedsCount.rows[0].count} existing beds...`);
          
          // Set all existing beds to "General" category (ID: 1)
          await pool.query(`
            UPDATE "${schemaName}".beds 
            SET category_id = 1 
            WHERE category_id IS NULL
          `);
          
          console.log(`  ✅ Set default category for existing beds`);
        }
        
      } catch (schemaError) {
        console.log(`  ❌ Error processing ${schemaName}:`, schemaError.message);
      }
    }
    
    console.log('\n🎉 Finished updating tenant schemas');
    
    // Test the fix
    console.log('\n🧪 Testing the fix...');
    
    const testTenant = 'aajmin_polyclinic';
    await pool.query(`SET search_path TO "${testTenant}"`);
    
    try {
      const testResult = await pool.query(`
        SELECT 
          id,
          name,
          description,
          color,
          icon,
          is_active,
          (SELECT COUNT(*) FROM beds WHERE category_id = public.bed_categories.id AND is_active = true) as bed_count
        FROM public.bed_categories 
        WHERE is_active = true
        ORDER BY name ASC
        LIMIT 3
      `);
      
      console.log('✅ Test query successful!');
      console.log('📊 Sample results:');
      testResult.rows.forEach((cat, index) => {
        console.log(`${index + 1}. ${cat.name}: ${cat.bed_count} beds`);
      });
      
    } catch (testError) {
      console.log('❌ Test query failed:', testError.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixTenantBedsAddCategoryId();