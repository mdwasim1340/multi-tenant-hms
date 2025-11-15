const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function checkStaffTables() {
  try {
    console.log('🔍 Checking for staff management tables...\n');

    const tables = [
      'staff_profiles',
      'staff_schedules',
      'staff_credentials',
      'staff_performance',
      'staff_attendance',
      'staff_payroll'
    ];

    const views = [
      'dashboard_analytics',
      'patient_analytics',
      'clinical_analytics',
      'financial_analytics',
      'operational_analytics',
      'staff_analytics',
      'appointment_analytics',
      'revenue_analytics'
    ];

    // Check tables
    console.log('📊 Checking Tables:');
    for (const table of tables) {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [table]);
      
      const exists = result.rows[0].exists;
      console.log(`  ${exists ? '✅' : '❌'} ${table}`);
    }

    // Check views
    console.log('\n📈 Checking Analytics Views:');
    for (const view of views) {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.views 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [view]);
      
      const exists = result.rows[0].exists;
      console.log(`  ${exists ? '✅' : '❌'} ${view}`);
    }

    // Check if any staff data exists
    const staffCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'staff_profiles'
      );
    `);

    if (staffCheck.rows[0].exists) {
      const countResult = await pool.query('SELECT COUNT(*) FROM staff_profiles');
      console.log(`\n👥 Total Staff Members: ${countResult.rows[0].count}`);
    }

    console.log('\n✅ Check complete!');
    
    // Check if migrations need to be run
    const allTablesExist = tables.every(async (table) => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [table]);
      return result.rows[0].exists;
    });

    if (!allTablesExist) {
      console.log('\n⚠️  Some tables are missing. Run migrations:');
      console.log('   cd backend');
      console.log('   node migrations/1800000000000_create-staff-management-tables.js');
      console.log('   node migrations/1800000000001_create-analytics-views.js');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkStaffTables();
