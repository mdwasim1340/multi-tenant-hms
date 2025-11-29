/**
 * Add beds permissions to the database
 * Run: node add-beds-permissions.js
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'multitenant_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function addBedsPermissions() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking existing permissions...\n');
    
    // Check if permissions table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'permissions'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ Permissions table does not exist!');
      console.log('Creating permissions table...');
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS permissions (
          id SERIAL PRIMARY KEY,
          resource VARCHAR(100) NOT NULL,
          action VARCHAR(50) NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(resource, action)
        );
      `);
      console.log('✅ Permissions table created');
    }
    
    // Check existing permissions
    const existingPerms = await client.query(`
      SELECT resource, action FROM permissions ORDER BY resource, action
    `);
    
    console.log('📋 Existing permissions:');
    existingPerms.rows.forEach(p => {
      console.log(`   - ${p.resource}:${p.action}`);
    });
    
    // Check if beds permissions exist
    const bedsPerms = await client.query(`
      SELECT * FROM permissions WHERE resource = 'beds'
    `);
    
    if (bedsPerms.rows.length === 0) {
      console.log('\n⚠️ No beds permissions found. Adding them...');
      
      // Add beds permissions
      await client.query(`
        INSERT INTO permissions (resource, action, description)
        VALUES 
          ('beds', 'read', 'View bed information and status'),
          ('beds', 'write', 'Create, update, and delete beds'),
          ('beds', 'admin', 'Full administrative access to bed management')
        ON CONFLICT (resource, action) DO NOTHING
      `);
      
      console.log('✅ Beds permissions added');
    } else {
      console.log('\n✅ Beds permissions already exist:');
      bedsPerms.rows.forEach(p => {
        console.log(`   - ${p.resource}:${p.action}: ${p.description}`);
      });
    }
    
    // Check role_permissions table
    const rolePermsTable = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'role_permissions'
      );
    `);
    
    if (!rolePermsTable.rows[0].exists) {
      console.log('\n⚠️ role_permissions table does not exist. Creating...');
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS role_permissions (
          id SERIAL PRIMARY KEY,
          role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
          permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(role_id, permission_id)
        );
      `);
      console.log('✅ role_permissions table created');
    }
    
    // Assign beds permissions to relevant roles
    console.log('\n🔧 Assigning beds permissions to roles...');
    
    // Get role IDs
    const roles = await client.query(`SELECT id, name FROM roles`);
    console.log('📋 Available roles:');
    roles.rows.forEach(r => console.log(`   - ${r.id}: ${r.name}`));
    
    // Get beds permission IDs
    const bedsPermIds = await client.query(`
      SELECT id, action FROM permissions WHERE resource = 'beds'
    `);
    
    // Assign permissions based on role
    for (const role of roles.rows) {
      const roleName = role.name.toLowerCase();
      
      // Admin gets all permissions
      if (roleName === 'admin' || roleName === 'hospital admin') {
        for (const perm of bedsPermIds.rows) {
          await client.query(`
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES ($1, $2)
            ON CONFLICT (role_id, permission_id) DO NOTHING
          `, [role.id, perm.id]);
        }
        console.log(`   ✅ ${role.name}: all beds permissions`);
      }
      // Doctor, Nurse, Receptionist get read and write
      else if (['doctor', 'nurse', 'receptionist'].includes(roleName)) {
        for (const perm of bedsPermIds.rows) {
          if (perm.action === 'read' || perm.action === 'write') {
            await client.query(`
              INSERT INTO role_permissions (role_id, permission_id)
              VALUES ($1, $2)
              ON CONFLICT (role_id, permission_id) DO NOTHING
            `, [role.id, perm.id]);
          }
        }
        console.log(`   ✅ ${role.name}: beds read/write permissions`);
      }
      // Others get read only
      else {
        for (const perm of bedsPermIds.rows) {
          if (perm.action === 'read') {
            await client.query(`
              INSERT INTO role_permissions (role_id, permission_id)
              VALUES ($1, $2)
              ON CONFLICT (role_id, permission_id) DO NOTHING
            `, [role.id, perm.id]);
          }
        }
        console.log(`   ✅ ${role.name}: beds read permission`);
      }
    }
    
    // Verify final state
    console.log('\n📊 Final permissions state:');
    const finalPerms = await client.query(`
      SELECT r.name as role_name, p.resource, p.action
      FROM role_permissions rp
      JOIN roles r ON rp.role_id = r.id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE p.resource = 'beds'
      ORDER BY r.name, p.action
    `);
    
    finalPerms.rows.forEach(p => {
      console.log(`   ${p.role_name}: ${p.resource}:${p.action}`);
    });
    
    console.log('\n✅ Beds permissions setup complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addBedsPermissions().catch(console.error);
