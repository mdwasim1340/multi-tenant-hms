const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'multitenant_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

async function setupBillingPermissions() {
  console.log('🔧 Setting up billing permissions...\n');

  try {
    // 1. Create billing permissions
    console.log('📋 Step 1: Creating billing permissions...');
    
    const billingPermissions = [
      { resource: 'billing', action: 'read', description: 'View billing information and reports' },
      { resource: 'billing', action: 'write', description: 'Create and edit invoices' },
      { resource: 'billing', action: 'admin', description: 'Process payments and manage billing settings' }
    ];

    for (const perm of billingPermissions) {
      const result = await pool.query(
        `INSERT INTO permissions (resource, action, description) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (resource, action) DO NOTHING 
         RETURNING id`,
        [perm.resource, perm.action, perm.description]
      );
      
      if (result.rows.length > 0) {
        console.log(`  ✅ Created: ${perm.resource}:${perm.action}`);
      } else {
        console.log(`  ℹ️  Already exists: ${perm.resource}:${perm.action}`);
      }
    }

    // 2. Get Admin role ID
    console.log('\n📋 Step 2: Getting Admin role...');
    const adminRole = await pool.query(
      `SELECT id FROM roles WHERE name = 'Admin'`
    );

    if (adminRole.rows.length === 0) {
      console.log('  ❌ Admin role not found!');
      return;
    }

    const adminRoleId = adminRole.rows[0].id;
    console.log(`  ✅ Found Admin role (ID: ${adminRoleId})`);

    // 3. Get Hospital Admin role ID
    console.log('\n📋 Step 3: Getting Hospital Admin role...');
    const hospitalAdminRole = await pool.query(
      `SELECT id FROM roles WHERE name = 'Hospital Admin'`
    );

    if (hospitalAdminRole.rows.length === 0) {
      console.log('  ⚠️  Hospital Admin role not found, skipping...');
    } else {
      const hospitalAdminRoleId = hospitalAdminRole.rows[0].id;
      console.log(`  ✅ Found Hospital Admin role (ID: ${hospitalAdminRoleId})`);
    }

    // 4. Assign all billing permissions to Admin role
    console.log('\n📋 Step 4: Assigning billing permissions to Admin role...');
    
    for (const perm of billingPermissions) {
      const permResult = await pool.query(
        `SELECT id FROM permissions WHERE resource = $1 AND action = $2`,
        [perm.resource, perm.action]
      );

      if (permResult.rows.length > 0) {
        const permId = permResult.rows[0].id;
        
        await pool.query(
          `INSERT INTO role_permissions (role_id, permission_id) 
           VALUES ($1, $2) 
           ON CONFLICT (role_id, permission_id) DO NOTHING`,
          [adminRoleId, permId]
        );
        
        console.log(`  ✅ Assigned ${perm.resource}:${perm.action} to Admin`);
      }
    }

    // 5. Assign billing:read and billing:write to Hospital Admin role
    if (hospitalAdminRole.rows.length > 0) {
      console.log('\n📋 Step 5: Assigning billing permissions to Hospital Admin role...');
      const hospitalAdminRoleId = hospitalAdminRole.rows[0].id;
      
      const hospitalAdminPerms = ['read', 'write'];
      
      for (const action of hospitalAdminPerms) {
        const permResult = await pool.query(
          `SELECT id FROM permissions WHERE resource = 'billing' AND action = $1`,
          [action]
        );

        if (permResult.rows.length > 0) {
          const permId = permResult.rows[0].id;
          
          await pool.query(
            `INSERT INTO role_permissions (role_id, permission_id) 
             VALUES ($1, $2) 
             ON CONFLICT (role_id, permission_id) DO NOTHING`,
            [hospitalAdminRoleId, permId]
          );
          
          console.log(`  ✅ Assigned billing:${action} to Hospital Admin`);
        }
      }
    }

    // 6. Verify permissions
    console.log('\n📋 Step 6: Verifying permissions...');
    
    const adminPerms = await pool.query(
      `SELECT p.resource, p.action 
       FROM permissions p 
       JOIN role_permissions rp ON p.id = rp.permission_id 
       JOIN roles r ON rp.role_id = r.id 
       WHERE r.name = 'Admin' AND p.resource = 'billing'
       ORDER BY p.action`
    );

    console.log(`  ✅ Admin has ${adminPerms.rows.length} billing permissions:`);
    adminPerms.rows.forEach(p => {
      console.log(`     - billing:${p.action}`);
    });

    if (hospitalAdminRole.rows.length > 0) {
      const hospitalAdminPerms = await pool.query(
        `SELECT p.resource, p.action 
         FROM permissions p 
         JOIN role_permissions rp ON p.id = rp.permission_id 
         JOIN roles r ON rp.role_id = r.id 
         WHERE r.name = 'Hospital Admin' AND p.resource = 'billing'
         ORDER BY p.action`
      );

      console.log(`  ✅ Hospital Admin has ${hospitalAdminPerms.rows.length} billing permissions:`);
      hospitalAdminPerms.rows.forEach(p => {
        console.log(`     - billing:${p.action}`);
      });
    }

    console.log('\n✅ Billing permissions setup complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Users with Admin role now have full billing access');
    console.log('   2. Users with Hospital Admin role can view and create invoices');
    console.log('   3. Run: node tests/test-billing-integration.js');

  } catch (error) {
    console.error('❌ Error setting up billing permissions:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the setup
setupBillingPermissions();
