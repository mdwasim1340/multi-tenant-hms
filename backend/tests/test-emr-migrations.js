const { execSync } = require('child_process');

console.log('🧪 Testing EMR Migrations\n');
console.log('=' .repeat(60));

// Test 1: Verify all tables exist
console.log('\n📋 Test 1: Verify all EMR tables exist');
const tables = [
  'clinical_notes',
  'clinical_note_versions',
  'note_templates',
  'imaging_reports',
  'imaging_report_files',
  'prescriptions',
  'medical_history',
  'record_shares'
];

try {
  const result = execSync(
    `docker exec backend-postgres-1 psql -U postgres -d multitenant_db -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'tenant_1762083064503' AND table_name IN ('clinical_notes', 'clinical_note_versions', 'note_templates', 'imaging_reports', 'imaging_report_files', 'prescriptions', 'medical_history', 'record_shares') ORDER BY table_name"`,
    { encoding: 'utf8' }
  );
  
  const foundTables = result.split('\n').map(t => t.trim()).filter(t => t);
  
  tables.forEach(table => {
    if (foundTables.includes(table)) {
      console.log(`  ✅ ${table}`);
    } else {
      console.log(`  ❌ ${table} - MISSING`);
    }
  });
} catch (error) {
  console.error('  ❌ Error checking tables:', error.message);
}

// Test 2: Verify clinical_notes structure
console.log('\n📋 Test 2: Verify clinical_notes table structure');
try {
  const result = execSync(
    `docker exec backend-postgres-1 psql -U postgres -d multitenant_db -t -c "SELECT column_name FROM information_schema.columns WHERE table_schema = 'tenant_1762083064503' AND table_name = 'clinical_notes' ORDER BY ordinal_position"`,
    { encoding: 'utf8' }
  );
  
  const columns = result.split('\n').map(c => c.trim()).filter(c => c);
  const expectedColumns = ['id', 'patient_id', 'provider_id', 'note_type', 'content', 'summary', 'status', 'signed_at', 'signed_by', 'template_id', 'created_at', 'updated_at'];
  
  expectedColumns.forEach(col => {
    if (columns.includes(col)) {
      console.log(`  ✅ ${col}`);
    } else {
      console.log(`  ❌ ${col} - MISSING`);
    }
  });
} catch (error) {
  console.error('  ❌ Error checking columns:', error.message);
}

// Test 3: Verify note templates exist
console.log('\n📋 Test 3: Verify note templates');
try {
  const result = execSync(
    `docker exec backend-postgres-1 psql -U postgres -d multitenant_db -t -c "SELECT COUNT(DISTINCT name) FROM tenant_1762083064503.note_templates"`,
    { encoding: 'utf8' }
  );
  
  const count = parseInt(result.trim());
  console.log(`  ℹ️  Found ${count} unique template(s)`);
  
  if (count >= 3) {
    console.log('  ✅ Templates populated');
  } else {
    console.log('  ⚠️  Expected at least 3 templates');
  }
} catch (error) {
  console.error('  ❌ Error checking templates:', error.message);
}

// Test 4: Verify indexes
console.log('\n📋 Test 4: Verify indexes on clinical_notes');
try {
  const result = execSync(
    `docker exec backend-postgres-1 psql -U postgres -d multitenant_db -t -c "SELECT indexname FROM pg_indexes WHERE schemaname = 'tenant_1762083064503' AND tablename = 'clinical_notes'"`,
    { encoding: 'utf8' }
  );
  
  const indexes = result.split('\n').map(i => i.trim()).filter(i => i);
  console.log(`  ℹ️  Found ${indexes.length} index(es)`);
  
  const expectedIndexes = ['idx_clinical_notes_patient', 'idx_clinical_notes_provider', 'idx_clinical_notes_status'];
  expectedIndexes.forEach(idx => {
    if (indexes.some(i => i.includes(idx))) {
      console.log(`  ✅ ${idx}`);
    } else {
      console.log(`  ⚠️  ${idx} - not found`);
    }
  });
} catch (error) {
  console.error('  ❌ Error checking indexes:', error.message);
}

// Test 5: Verify triggers
console.log('\n📋 Test 5: Verify triggers');
try {
  const result = execSync(
    `docker exec backend-postgres-1 psql -U postgres -d multitenant_db -t -c "SELECT trigger_name FROM information_schema.triggers WHERE event_object_schema = 'tenant_1762083064503' AND event_object_table IN ('clinical_notes', 'clinical_note_versions', 'prescriptions', 'medical_history')"`,
    { encoding: 'utf8' }
  );
  
  const triggers = result.split('\n').map(t => t.trim()).filter(t => t);
  console.log(`  ℹ️  Found ${triggers.length} trigger(s)`);
  
  if (triggers.length > 0) {
    triggers.forEach(trigger => {
      console.log(`  ✅ ${trigger}`);
    });
  } else {
    console.log('  ⚠️  No triggers found');
  }
} catch (error) {
  console.error('  ❌ Error checking triggers:', error.message);
}

// Test 6: Verify foreign key constraints
console.log('\n📋 Test 6: Verify foreign key constraints');
try {
  const result = execSync(
    `docker exec backend-postgres-1 psql -U postgres -d multitenant_db -t -c "SELECT conname FROM pg_constraint WHERE connamespace = 'tenant_1762083064503'::regnamespace AND contype = 'f'"`,
    { encoding: 'utf8' }
  );
  
  const constraints = result.split('\n').map(c => c.trim()).filter(c => c);
  console.log(`  ℹ️  Found ${constraints.length} foreign key constraint(s)`);
  
  if (constraints.length > 0) {
    constraints.forEach(constraint => {
      console.log(`  ✅ ${constraint}`);
    });
  }
} catch (error) {
  console.error('  ❌ Error checking constraints:', error.message);
}

// Test 7: Test multi-tenant isolation
console.log('\n📋 Test 7: Verify multi-tenant isolation');
try {
  const schemas = ['tenant_1762083064503', 'tenant_1762083064515'];
  
  schemas.forEach(schema => {
    const result = execSync(
      `docker exec backend-postgres-1 psql -U postgres -d multitenant_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '${schema}' AND table_name = 'clinical_notes'"`,
      { encoding: 'utf8' }
    );
    
    const count = parseInt(result.trim());
    if (count === 1) {
      console.log(`  ✅ ${schema} has clinical_notes table`);
    } else {
      console.log(`  ❌ ${schema} missing clinical_notes table`);
    }
  });
} catch (error) {
  console.error('  ❌ Error checking isolation:', error.message);
}

console.log('\n' + '='.repeat(60));
console.log('✅ EMR Migration Tests Complete!\n');
