const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const runMigrations = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Running database migrations...');
    
    // Enable UUID extension first
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('✅ UUID extension enabled');
    
    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS pgmigrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        run_on TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Get list of migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js'))
      .sort();
    
    console.log(`Found ${migrationFiles.length} migration files`);
    
    // Check which migrations have already been run
    const { rows: completedMigrations } = await client.query(
      'SELECT name FROM pgmigrations ORDER BY id'
    );
    const completedNames = completedMigrations.map(row => row.name);
    
    // Run pending migrations
    for (const file of migrationFiles) {
      const migrationName = file.replace('.js', '');
      
      if (completedNames.includes(migrationName)) {
        console.log(`⏭️  Skipping ${migrationName} (already completed)`);
        continue;
      }
      
      console.log(`🔄 Running migration: ${migrationName}`);
      
      try {
        // Load and execute migration
        const migrationPath = path.join(migrationsDir, file);
        const migration = require(migrationPath);
        
        // Simple migration runner - execute the up function
        if (migration.up) {
          // Create a simple pgm object for basic operations
          const pgm = {
            createTable: async (tableName, columns) => {
              let sql = `CREATE TABLE IF NOT EXISTS ${tableName} (`;
              const columnDefs = [];
              
              for (const [colName, colDef] of Object.entries(columns)) {
                let colSql = `${colName} `;
                
                if (colDef.type === 'string') colSql += 'VARCHAR(255)';
                else if (colDef.type === 'timestamp') colSql += 'TIMESTAMP';
                else if (colDef.type === 'serial') colSql += 'SERIAL';
                else if (colDef.type === 'uuid') colSql += 'UUID';
                else colSql += colDef.type.toUpperCase();
                
                if (colDef.notNull) colSql += ' NOT NULL';
                if (colDef.primaryKey) colSql += ' PRIMARY KEY';
                if (colDef.default) {
                  if (typeof colDef.default === 'object' && colDef.default.func) {
                    if (colDef.default.func === 'gen_random_uuid()') {
                      colSql += ` DEFAULT uuid_generate_v4()`;
                    } else {
                      colSql += ` DEFAULT ${colDef.default.func}`;
                    }
                  } else {
                    colSql += ` DEFAULT '${colDef.default}'`;
                  }
                }
                
                columnDefs.push(colSql);
              }
              
              sql += columnDefs.join(', ') + ')';
              await client.query(sql);
            },
            func: (funcName) => funcName
          };
          
          await migration.up(pgm);
        }
        
        // Record migration as completed
        await client.query(
          'INSERT INTO pgmigrations (name) VALUES ($1)',
          [migrationName]
        );
        
        console.log(`✅ Completed migration: ${migrationName}`);
      } catch (error) {
        console.error(`❌ Failed migration ${migrationName}:`, error.message);
        throw error;
      }
    }
    
    console.log('✅ All migrations completed successfully');
    
    // Verify tenants table exists
    const { rows } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'tenants'
    `);
    
    if (rows.length > 0) {
      console.log('✅ Tenants table exists and ready for use');
    } else {
      console.log('⚠️  Tenants table not found');
    }
    
  } catch (error) {
    console.error('❌ Migration process failed:', error.message);
    throw error;
  } finally {
    client.release();
  }
};

runMigrations();