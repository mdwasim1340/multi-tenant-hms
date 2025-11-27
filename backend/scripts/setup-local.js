const { Pool } = require('pg');
require('dotenv').config();

async function setupLocalDatabase() {
  console.log('🗄️  Setting up local database...');
  
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'postgres', // Connect to default database first
    password: process.env.DB_PASSWORD || 'password',
    port: Number(process.env.DB_PORT) || 5432,
  });

  try {
    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'multitenant_db';
    await pool.query(`CREATE DATABASE ${dbName}`);
    console.log(`✅ Database '${dbName}' created successfully`);
  } catch (error) {
    if (error.code === '42P04') {
      console.log('✅ Database already exists');
    } else {
      console.error('❌ Error creating database:', error.message);
    }
  } finally {
    await pool.end();
  }

  // Connect to the target database and create extension
  const targetPool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'multitenant_db',
    password: process.env.DB_PASSWORD || 'password',
    port: Number(process.env.DB_PORT) || 5432,
  });

  try {
    // Create uuid extension if needed
    await targetPool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('✅ UUID extension enabled');
  } catch (error) {
    console.error('❌ Error creating extension:', error.message);
  } finally {
    await targetPool.end();
  }
}

async function checkAWSConfiguration() {
  console.log('\n🔧 Checking AWS configuration...');
  
  const requiredEnvVars = [
    'COGNITO_USER_POOL_ID',
    'COGNITO_CLIENT_ID',
    'AWS_REGION',
    'S3_BUCKET_NAME'
  ];

  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.log('⚠️  Missing AWS configuration:');
    missing.forEach(varName => {
      console.log(`   - ${varName}`);
    });
    console.log('\n📝 Please update your .env file with AWS credentials');
    console.log('   You can use the .env.example as a template');
  } else {
    console.log('✅ AWS configuration looks complete');
  }
}

async function main() {
  console.log('🚀 Multi-Tenant Backend Setup\n');
  
  await setupLocalDatabase();
  await checkAWSConfiguration();
  
  console.log('\n📋 Next steps:');
  console.log('1. Start PostgreSQL if not running');
  console.log('2. Configure AWS Cognito and S3 in .env file');
  console.log('3. Run: npm run dev');
  console.log('4. Test with: node test-api.js');
}

if (require.main === module) {
  main().catch(console.error);
}