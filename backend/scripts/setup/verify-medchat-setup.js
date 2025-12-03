// Verify MedChat Mobile Tenant Setup
// Run: node backend/scripts/setup/verify-medchat-setup.js

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'multitenant_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function verifySetup() {
  console.log('🔍 Verifying MedChat Mobile Tenant Setup...\n');

  try {
    // 1. Check tenant exists
    console.log('1️⃣ Checking tenant record...');
    const tenantResult = await pool.query(
      'SELECT id, name, subdomain, status FROM tenants WHERE id = $1',
      ['tenant_medchat_mobile']
    );

    if (tenantResult.rows.length === 0) {
      console.log('❌ Tenant not found: tenant_medchat_mobile');
      console.log('   Run: psql -U postgres -d multitenant_db -f hms-app/setup-medchat-tenant.sql\n');
      return;
    }

    const tenant = tenantResult.rows[0];
    console.log('✅ Tenant found:');
    console.log(`   ID: ${tenant.id}`);
    console.log(`   Name: ${tenant.name}`);
    console.log(`   Subdomain: ${tenant.subdomain}`);
    console.log(`   Status: ${tenant.status}\n`);

    // 2. Check schema exists
    console.log('2️⃣ Checking tenant schema...');
    const schemaResult = await pool.query(
      "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'tenant_medchat_mobile'"
    );

    if (schemaResult.rows.length === 0) {
      console.log('❌ Schema not found: tenant_medchat_mobile');
      console.log('   Run: psql -U postgres -d multitenant_db -f hms-app/setup-medchat-tenant.sql\n');
      return;
    }

    console.log('✅ Schema exists: tenant_medchat_mobile\n');

    // 3. Check subscription
    console.log('3️⃣ Checking subscription...');
    const subResult = await pool.query(
      'SELECT tenant_id, tier_id, status FROM tenant_subscriptions WHERE tenant_id = $1',
      ['tenant_medchat_mobile']
    );

    if (subResult.rows.length === 0) {
      console.log('⚠️  No subscription found (optional)');
    } else {
      const sub = subResult.rows[0];
      console.log('✅ Subscription found:');
      console.log(`   Tier: ${sub.tier_id}`);
      console.log(`   Status: ${sub.status}\n`);
    }

    // 4. Check user exists
    console.log('4️⃣ Checking admin user...');
    const userResult = await pool.query(
      'SELECT email, name, tenant_id, status FROM users WHERE email = $1',
      ['admin@medchat.ai']
    );

    if (userResult.rows.length === 0) {
      console.log('⚠️  User not found: admin@medchat.ai');
      console.log('   Create user in Cognito first, then add to database');
      console.log('   Run: node backend/scripts/setup/setup-medchat-user.js\n');
    } else {
      const user = userResult.rows[0];
      console.log('✅ User found:');
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Tenant: ${user.tenant_id}`);
      console.log(`   Status: ${user.status}\n`);

      if (user.tenant_id !== 'tenant_medchat_mobile') {
        console.log('⚠️  WARNING: User tenant_id does not match!');
        console.log(`   Expected: tenant_medchat_mobile`);
        console.log(`   Found: ${user.tenant_id}\n`);
      }
    }

    // 5. Check tables in tenant schema
    console.log('5️⃣ Checking tenant schema tables...');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'tenant_medchat_mobile'
      ORDER BY table_name
    `);

    if (tablesResult.rows.length === 0) {
      console.log('⚠️  No tables found in tenant schema');
      console.log('   Run: psql -U postgres -d multitenant_db -f hms-app/setup-medchat-tenant.sql\n');
    } else {
      console.log(`✅ Found ${tablesResult.rows.length} tables:`);
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
      console.log('');
    }

    // Summary
    console.log('═'.repeat(60));
    console.log('📋 SETUP SUMMARY');
    console.log('═'.repeat(60));
    console.log('Tenant ID: tenant_medchat_mobile');
    console.log('App ID: medchat-mobile');
    console.log('API Key: medchat-dev-key-789');
    console.log('');
    console.log('Flutter App Configuration:');
    console.log('  File: hms-app/lib/core/config/api_config.dart');
    console.log('  tenantId: "tenant_medchat_mobile"');
    console.log('  appId: "medchat-mobile"');
    console.log('  apiKey: "medchat-dev-key-789"');
    console.log('');
    console.log('Login Credentials:');
    console.log('  Email: admin@medchat.ai');
    console.log('  Password: (set in Cognito)');
    console.log('═'.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

verifySetup();
