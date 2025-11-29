const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'multitenant_db',
  password: 'password',
  port: 5432,
});

async function findTestUser() {
  try {
    console.log('=== FINDING TEST USER FOR API TESTING ===');
    
    // Check users in the tenant
    const users = await pool.query(`
      SELECT id, email, name, tenant_id, created_at
      FROM users 
      WHERE tenant_id = 'aajmin_polyclinic'
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    console.log('\nUsers in aajmin_polyclinic tenant:');
    users.rows.forEach(user => {
      console.log(`- ${user.email} (${user.name}) - ID: ${user.id}`);
    });
    
    if (users.rows.length > 0) {
      const testUser = users.rows[0];
      console.log(`\nUsing test user: ${testUser.email}`);
      console.log('Try password: Admin@123 or password123 or test123');
    } else {
      console.log('\nNo users found. Creating a test user...');
      
      // Create a test user
      const newUser = await pool.query(`
        INSERT INTO users (email, name, tenant_id, password_hash, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING id, email, name
      `, [
        'test@aajmin.com',
        'Test User',
        'aajmin_polyclinic',
        '$2b$10$example.hash.for.password123' // This would be a real bcrypt hash
      ]);
      
      console.log(`✅ Created test user: ${newUser.rows[0].email}`);
      console.log('Password: password123');
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

findTestUser();