/**
 * Setup MedChat Mobile App Tenant
 * 
 * This script creates:
 * 1. Tenant record in public.tenants
 * 2. Tenant schema
 * 3. Subscription
 * 4. Branding
 * 5. Required tables in tenant schema
 * 
 * Run: node scripts/setup-medchat-tenant.js
 */

require('dotenv').config();
const { Pool } = require('pg');

// Create pool using environment variables
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'multitenant_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

const TENANT_ID = 'tenant_medchat_mobile';
const TENANT_NAME = 'MedChat Mobile App';
const TENANT_EMAIL = 'admin@medchat.ai';
const SUBDOMAIN = 'medchat';
const SUBSCRIPTION_TIER = 'premium'; // Available: basic, advanced, premium

async function setupTenant() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Setting up MedChat Mobile Tenant...\n');
    
    await client.query('BEGIN');
    
    // 1. Create tenant record
    console.log('1️⃣ Creating tenant record...');
    await client.query(`
      INSERT INTO public.tenants (id, name, email, plan, status, subdomain)
      VALUES ($1, $2, $3, $4, 'active', $5)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        plan = EXCLUDED.plan,
        status = EXCLUDED.status,
        subdomain = EXCLUDED.subdomain
    `, [TENANT_ID, TENANT_NAME, TENANT_EMAIL, SUBSCRIPTION_TIER, SUBDOMAIN]);
    console.log('   ✅ Tenant record created');
    
    // 2. Create schema
    console.log('2️⃣ Creating tenant schema...');
    const schemaExists = await client.query(`
      SELECT 1 FROM information_schema.schemata WHERE schema_name = $1
    `, [TENANT_ID]);
    
    if (schemaExists.rows.length === 0) {
      await client.query(`CREATE SCHEMA "${TENANT_ID}"`);
      console.log('   ✅ Schema created');
    } else {
      console.log('   ℹ️ Schema already exists');
    }
    
    // 3. Create subscription
    console.log('3️⃣ Creating subscription...');
    await client.query(`
      INSERT INTO tenant_subscriptions (tenant_id, tier_id, usage_limits, billing_cycle, status)
      VALUES ($1, $2, $3, 'monthly', 'active')
      ON CONFLICT (tenant_id) DO UPDATE SET
        tier_id = EXCLUDED.tier_id,
        usage_limits = EXCLUDED.usage_limits,
        status = EXCLUDED.status
    `, [
      TENANT_ID,
      SUBSCRIPTION_TIER,
      JSON.stringify({
        max_patients: -1,  // Unlimited for premium
        max_users: -1,
        storage_gb: -1,
        api_calls_per_day: -1
      })
    ]);
    console.log('   ✅ Subscription created');
    
    // 4. Create branding
    console.log('4️⃣ Creating branding...');
    await client.query(`
      INSERT INTO tenant_branding (tenant_id, primary_color, secondary_color, accent_color)
      VALUES ($1, '#00897B', '#26A69A', '#4DB6AC')
      ON CONFLICT (tenant_id) DO UPDATE SET
        primary_color = EXCLUDED.primary_color,
        secondary_color = EXCLUDED.secondary_color,
        accent_color = EXCLUDED.accent_color
    `, [TENANT_ID]);
    console.log('   ✅ Branding created');
    
    // 5. Create tables in tenant schema
    console.log('5️⃣ Creating tables in tenant schema...');
    await client.query(`SET search_path TO "${TENANT_ID}"`);
    
    // Patients table
    await client.query(`
      CREATE TABLE IF NOT EXISTS patients (
        id SERIAL PRIMARY KEY,
        patient_number VARCHAR(50) UNIQUE NOT NULL,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        date_of_birth DATE,
        gender VARCHAR(20),
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        country VARCHAR(100),
        postal_code VARCHAR(20),
        blood_type VARCHAR(10),
        emergency_contact_name VARCHAR(255),
        emergency_contact_phone VARCHAR(50),
        insurance_provider VARCHAR(255),
        insurance_policy_number VARCHAR(100),
        allergies TEXT,
        medical_conditions TEXT,
        current_medications TEXT,
        notes TEXT,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✅ Patients table created');
    
    // Chat sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        title VARCHAR(255),
        messages JSONB DEFAULT '[]',
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✅ Chat sessions table created');
    
    // Chat messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        session_id INTEGER REFERENCES chat_sessions(id),
        role VARCHAR(20) NOT NULL,
        content TEXT NOT NULL,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✅ Chat messages table created');
    
    // Reset search path
    await client.query('SET search_path TO public');
    
    await client.query('COMMIT');
    
    console.log('\n============================================================');
    console.log('✅ MedChat Mobile Tenant Setup Complete!');
    console.log('============================================================');
    console.log(`Tenant ID:  ${TENANT_ID}`);
    console.log(`Name:       ${TENANT_NAME}`);
    console.log(`Subdomain:  ${SUBDOMAIN}`);
    console.log(`Plan:       enterprise`);
    console.log('============================================================');
    console.log('\n📝 Next Steps:');
    console.log('1. Create admin user in Cognito:');
    console.log('   node scripts/create-cognito-user.js admin@medchat.ai MedChat@2025!');
    console.log('2. Add user to database:');
    console.log('   INSERT INTO users (email, name, tenant_id) VALUES');
    console.log(`   ('admin@medchat.ai', 'MedChat Admin', '${TENANT_ID}');`);
    console.log('3. Configure Flutter app with tenant ID');
    console.log('============================================================\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error setting up tenant:', error);
    throw error;
  } finally {
    client.release();
    process.exit(0);
  }
}

setupTenant().catch(console.error);
