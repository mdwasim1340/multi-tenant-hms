const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function applyEMRMigrations() {
  const client = null;
  
  try {
    console.log('🚀 Starting EMR migrations application...\n');
    
    // Get all tenant schemas using Docker exec
    const getTenantSchemasCmd = `docker exec backend-postgres-1 psql -U postgres -d multitenant_db -t -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%' ORDER BY schema_name"`;
    
    const tenantsOutput = execSync(getTenantSchemasCmd, { encoding: 'utf8' });
    const tenantSchemas = tenantsOutput
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    console.log(`📋 Found ${tenantSchemas.length} tenant schemas\n`);
    
    // Migration files in order
    const migrationFiles = [
      '1732900000000_create_clinical_notes.sql',
      '1732900100000_create_clinical_note_versions.sql',
      '1732900200000_create_note_templates.sql',
      '1732900300000_create_imaging_reports.sql',
      '1732900400000_create_prescriptions.sql',
      '1732900500000_create_medical_history.sql',
      '1732900600000_create_record_shares.sql'
    ];
    
    // Apply each migration to each tenant schema
    for (const migrationFile of migrationFiles) {
      console.log(`\n📄 Applying migration: ${migrationFile}`);
      
      const migrationPath = path.join(__dirname, '..', 'migrations', migrationFile);
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      // Write SQL to temp file for Docker exec
      const tempSqlPath = path.join(__dirname, 'temp_migration.sql');
      
      for (const tenantSchema of tenantSchemas) {
        try {
          // Create SQL with search path set
          const sqlWithSearchPath = `SET search_path TO "${tenantSchema}";\n${migrationSQL}`;
          fs.writeFileSync(tempSqlPath, sqlWithSearchPath);
          
          // Copy SQL file to container and execute
          execSync(`docker cp "${tempSqlPath}" backend-postgres-1:/tmp/migration.sql`, { stdio: 'pipe' });
          execSync(`docker exec backend-postgres-1 psql -U postgres -d multitenant_db -f /tmp/migration.sql`, { stdio: 'pipe' });
          
          console.log(`  ✅ Applied to ${tenantSchema}`);
        } catch (error) {
          console.error(`  ❌ Error applying to ${tenantSchema}:`, error.message);
        }
      }
      
      // Clean up temp file
      if (fs.existsSync(tempSqlPath)) {
        fs.unlinkSync(tempSqlPath);
      }
    }
    
    console.log('\n\n✅ EMR migrations completed successfully!');
    console.log('\n📊 Verifying tables...\n');
    
    // Verify tables in first tenant schema
    if (tenantSchemas.length > 0) {
      const firstTenant = tenantSchemas[0];
      
      const verifyCmd = `docker exec backend-postgres-1 psql -U postgres -d multitenant_db -c "SET search_path TO '${firstTenant}'; SELECT table_name FROM information_schema.tables WHERE table_schema = '${firstTenant}' AND table_name IN ('clinical_notes', 'clinical_note_versions', 'note_templates', 'imaging_reports', 'imaging_report_files', 'prescriptions', 'medical_history', 'record_shares') ORDER BY table_name"`;
      
      const tablesOutput = execSync(verifyCmd, { encoding: 'utf8' });
      
      console.log(`Tables in ${firstTenant}:`);
      console.log(tablesOutput);
    }
    
  } catch (error) {
    console.error('❌ Error applying EMR migrations:', error);
    throw error;
  }
}

// Run the migration
applyEMRMigrations()
  .then(() => {
    console.log('\n🎉 All done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });
