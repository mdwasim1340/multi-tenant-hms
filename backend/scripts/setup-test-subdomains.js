#!/usr/bin/env node

/**
 * Setup Test Subdomains Script
 * Creates or updates tenants with subdomain values for testing
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'multitenant_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function setupSubdomains() {
  console.log('\n' + '='.repeat(60));
  log('Setting Up Test Subdomains', 'cyan');
  console.log('='.repeat(60) + '\n');
  
  try {
    // Check if subdomain column exists
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tenants' AND column_name = 'subdomain'
    `);
    
    if (columnCheck.rows.length === 0) {
      log('Adding subdomain column to tenants table...', 'yellow');
      await pool.query(`
        ALTER TABLE tenants 
        ADD COLUMN IF NOT EXISTS subdomain VARCHAR(255) UNIQUE
      `);
      log('✅ Subdomain column added', 'green');
    }
    
    // Get existing tenants
    const tenants = await pool.query(`
      SELECT id, name, subdomain, status 
      FROM tenants 
      ORDER BY name
    `);
    
    if (tenants.rows.length === 0) {
      log('❌ No tenants found in database', 'red');
      log('Please create tenants first using the admin dashboard', 'yellow');
      return;
    }
    
    log(`Found ${tenants.rows.length} tenants:\n`, 'cyan');
    
    // Suggest subdomains for tenants without them
    const updates = [];
    
    for (const tenant of tenants.rows) {
      if (tenant.subdomain) {
        log(`✅ ${tenant.name} → ${tenant.subdomain}.localhost`, 'green');
      } else {
        // Generate subdomain from tenant name
        const suggestedSubdomain = tenant.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '')
          .substring(0, 30);
        
        log(`⚠️  ${tenant.name} → No subdomain (suggesting: ${suggestedSubdomain})`, 'yellow');
        updates.push({ id: tenant.id, name: tenant.name, subdomain: suggestedSubdomain });
      }
    }
    
    if (updates.length > 0) {
      log(`\n${updates.length} tenants need subdomain assignment`, 'yellow');
      log('Updating tenants...', 'cyan');
      
      for (const update of updates) {
        try {
          await pool.query(
            'UPDATE tenants SET subdomain = $1 WHERE id = $2',
            [update.subdomain, update.id]
          );
          log(`✅ Updated ${update.name} → ${update.subdomain}.localhost`, 'green');
        } catch (error) {
          if (error.code === '23505') { // Unique constraint violation
            log(`❌ Subdomain "${update.subdomain}" already taken`, 'red');
          } else {
            log(`❌ Error updating ${update.name}: ${error.message}`, 'red');
          }
        }
      }
    }
    
    // Show final configuration
    log('\n' + '='.repeat(60), 'cyan');
    log('Final Subdomain Configuration', 'cyan');
    console.log('='.repeat(60) + '\n');
    
    const finalTenants = await pool.query(`
      SELECT id, name, subdomain, status 
      FROM tenants 
      WHERE subdomain IS NOT NULL
      ORDER BY name
    `);
    
    if (finalTenants.rows.length === 0) {
      log('❌ No tenants with subdomains configured', 'red');
    } else {
      finalTenants.rows.forEach(tenant => {
        log(`✅ http://${tenant.subdomain}.localhost:3001 → ${tenant.name}`, 'blue');
      });
      
      log('\n' + '='.repeat(60), 'cyan');
      log('Next Steps:', 'cyan');
      console.log('='.repeat(60) + '\n');
      
      log('1. Add hosts entries (run as Administrator):', 'yellow');
      log('   powershell -ExecutionPolicy Bypass -File backend/scripts/setup-hosts-windows.ps1\n', 'cyan');
      
      log('2. Verify routing:', 'yellow');
      log('   node backend/scripts/verify-subdomain-routing.js\n', 'cyan');
      
      log('3. Access your hospitals:', 'yellow');
      finalTenants.rows.forEach(tenant => {
        log(`   http://${tenant.subdomain}.localhost:3001`, 'cyan');
      });
    }
    
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    console.error(error);
  } finally {
    await pool.end();
  }
}

setupSubdomains();
