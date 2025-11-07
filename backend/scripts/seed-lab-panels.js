const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

const samplePanels = [
  {
    panel_code: 'CBC',
    panel_name: 'Complete Blood Count',
    description: 'Measures different components of blood',
    category: 'hematology',
    tests_included: ['WBC', 'RBC', 'HGB', 'HCT', 'PLT'],
    turnaround_time_hours: 2
  },
  {
    panel_code: 'CMP',
    panel_name: 'Comprehensive Metabolic Panel',
    description: 'Measures glucose, electrolytes, kidney and liver function',
    category: 'chemistry',
    tests_included: ['GLU', 'BUN', 'CR', 'NA', 'K', 'CL', 'CO2', 'ALT', 'AST'],
    turnaround_time_hours: 4
  },
  {
    panel_code: 'LIPID',
    panel_name: 'Lipid Panel',
    description: 'Measures cholesterol and triglycerides',
    category: 'chemistry',
    tests_included: ['CHOL', 'HDL', 'LDL', 'TRIG'],
    turnaround_time_hours: 4
  },
  {
    panel_code: 'BMP',
    panel_name: 'Basic Metabolic Panel',
    description: 'Measures glucose, electrolytes, and kidney function',
    category: 'chemistry',
    tests_included: ['GLU', 'BUN', 'CR', 'NA', 'K', 'CL', 'CO2'],
    turnaround_time_hours: 3
  },
  {
    panel_code: 'LFT',
    panel_name: 'Liver Function Tests',
    description: 'Measures liver enzymes and function',
    category: 'chemistry',
    tests_included: ['ALT', 'AST', 'ALP', 'BILI', 'ALB'],
    turnaround_time_hours: 4
  }
];

async function seedLabPanels() {
  const client = await pool.connect();
  
  try {
    const schemasResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%' OR schema_name LIKE 'demo_%'
    `);
    
    const schemas = schemasResult.rows.map(row => row.schema_name);
    
    for (const schema of schemas) {
      console.log(`\nSeeding lab panels in: ${schema}`);
      
      await client.query(`SET search_path TO "${schema}"`);
      
      for (const panel of samplePanels) {
        await client.query(`
          INSERT INTO lab_panels (
            panel_code, panel_name, description, category,
            tests_included, turnaround_time_hours
          ) VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (panel_code) DO NOTHING
        `, [
          panel.panel_code,
          panel.panel_name,
          panel.description,
          panel.category,
          JSON.stringify(panel.tests_included),
          panel.turnaround_time_hours
        ]);
      }
      
      console.log(`✅ Seeded ${samplePanels.length} lab panels in ${schema}`);
    }
    
    console.log('\n✅ All lab panels seeded successfully');
    
  } catch (error) {
    console.error('Error seeding lab panels:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedLabPanels();
