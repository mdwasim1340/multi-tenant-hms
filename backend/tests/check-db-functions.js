require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function check() {
  try {
    const result = await pool.query(`
      SELECT proname FROM pg_proc 
      WHERE proname IN ('check_user_permission', 'get_user_permissions')
    `);
    console.log('Functions found:', result.rows);
    
    if (result.rows.length < 2) {
      console.log('\n⚠️ Missing functions. Creating them...');
      
      // Create check_user_permission function
      await pool.query(`
        CREATE OR REPLACE FUNCTION check_user_permission(
          p_user_id INTEGER,
          p_resource VARCHAR,
          p_action VARCHAR
        ) RETURNS BOOLEAN AS $$
        BEGIN
          RETURN EXISTS (
            SELECT 1
            FROM user_roles ur
            JOIN role_permissions rp ON ur.role_id = rp.role_id
            JOIN permissions p ON rp.permission_id = p.id
            WHERE ur.user_id = p_user_id
              AND p.resource = p_resource
              AND p.action = p_action
          );
        END;
        $$ LANGUAGE plpgsql;
      `);
      console.log('✅ check_user_permission function created');
      
      // Create get_user_permissions function
      await pool.query(`
        CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id INTEGER)
        RETURNS TABLE(resource VARCHAR, action VARCHAR) AS $$
        BEGIN
          RETURN QUERY
          SELECT DISTINCT p.resource, p.action
          FROM user_roles ur
          JOIN role_permissions rp ON ur.role_id = rp.role_id
          JOIN permissions p ON rp.permission_id = p.id
          WHERE ur.user_id = p_user_id
          ORDER BY p.resource, p.action;
        END;
        $$ LANGUAGE plpgsql;
      `);
      console.log('✅ get_user_permissions function created');
    }
    
    console.log('\n✅ Database functions are ready');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

check();
