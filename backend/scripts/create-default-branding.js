/**
 * Script: Create Default Branding Records
 * Purpose: Insert default branding configuration for all existing tenants
 * Requirements: 7.6
 * 
 * This script creates default branding records for tenants that don't have one yet.
 * Default colors: primary=#1e40af, secondary=#3b82f6, accent=#60a5fa
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'multitenant_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function createDefaultBranding() {
  const client = await pool.connect();
  
  try {
    console.log('🎨 Creating default branding records for all tenants...\n');
    
    // Get all tenants
    const tenantsResult = await client.query('SELECT id, name FROM tenants ORDER BY id');
    const tenants = tenantsResult.rows;
    
    console.log(`Found ${tenants.length} tenants\n`);
    
    let created = 0;
    let skipped = 0;
    
    for (const tenant of tenants) {
      // Check if branding already exists
      const existingBranding = await client.query(
        'SELECT id FROM tenant_branding WHERE tenant_id = $1',
        [tenant.id]
      );
      
      if (existingBranding.rows.length > 0) {
        console.log(`⏭️  Skipped: ${tenant.name} (${tenant.id}) - branding already exists`);
        skipped++;
        continue;
      }
      
      // Insert default branding
      await client.query(`
        INSERT INTO tenant_branding (
          tenant_id,
          primary_color,
          secondary_color,
          accent_color
        ) VALUES ($1, $2, $3, $4)
      `, [
        tenant.id,
        '#1e40af', // Medical Blue
        '#3b82f6', // Lighter Blue
        '#60a5fa'  // Accent Blue
      ]);
      
      console.log(`✅ Created: ${tenant.name} (${tenant.id})`);
      created++;
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   Total tenants: ${tenants.length}`);
    console.log(`   Created: ${created}`);
    console.log(`   Skipped: ${skipped}`);
    console.log('='.repeat(60));
    
    // Verify all tenants have branding
    const verifyResult = await client.query(`
      SELECT COUNT(*) as total_tenants,
             (SELECT COUNT(*) FROM tenant_branding) as total_branding
      FROM tenants
    `);
    
    const { total_tenants, total_branding } = verifyResult.rows[0];
    
    console.log('\n✅ Verification:');
    console.log(`   Tenants: ${total_tenants}`);
    console.log(`   Branding records: ${total_branding}`);
    
    if (parseInt(total_tenants) === parseInt(total_branding)) {
      console.log('   ✅ All tenants have branding records!\n');
    } else {
      console.log('   ⚠️  Warning: Mismatch between tenants and branding records\n');
    }
    
  } catch (error) {
    console.error('❌ Error creating default branding:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
createDefaultBranding()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
