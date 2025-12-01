/**
 * Seed sample diagnostic invoices with categorized line items
 * for testing Profit & Loss report integration
 * 
 * Run: node backend/scripts/seed-sample-diagnostic-invoices.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'multitenant_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password'
});

// Sample line items for different categories
const sampleInvoices = [
  {
    patient_name: 'John Doe',
    patient_number: 'P001',
    line_items: [
      { description: 'General Consultation - Dr. Smith', amount: 500, quantity: 1, unit_price: 500 },
      { description: 'Blood Test - CBC', amount: 350, quantity: 1, unit_price: 350 },
      { description: 'Paracetamol Tablets 500mg', amount: 50, quantity: 1, unit_price: 50 }
    ],
    status: 'paid'
  },
  {
    patient_name: 'Jane Smith',
    patient_number: 'P002',
    line_items: [
      { description: 'Specialist Consultation - Cardiology', amount: 1000, quantity: 1, unit_price: 1000 },
      { description: 'ECG Procedure', amount: 800, quantity: 1, unit_price: 800 },
      { description: 'Lipid Profile Test', amount: 600, quantity: 1, unit_price: 600 }
    ],
    status: 'paid'
  },
  {
    patient_name: 'Robert Johnson',
    patient_number: 'P003',
    line_items: [
      { description: 'X-Ray Chest', amount: 400, quantity: 1, unit_price: 400 },
      { description: 'Ultrasound Abdomen', amount: 1200, quantity: 1, unit_price: 1200 },
      { description: 'Antibiotic Injection', amount: 250, quantity: 1, unit_price: 250 }
    ],
    status: 'paid'
  },
  {
    patient_name: 'Emily Davis',
    patient_number: 'P004',
    line_items: [
      { description: 'OPD Visit - General Medicine', amount: 300, quantity: 1, unit_price: 300 },
      { description: 'Thyroid Function Test', amount: 450, quantity: 1, unit_price: 450 },
      { description: 'Glucose Fasting Test', amount: 150, quantity: 1, unit_price: 150 },
      { description: 'Prescription Medicines', amount: 350, quantity: 1, unit_price: 350 }
    ],
    status: 'paid'
  },
  {
    patient_name: 'Michael Brown',
    patient_number: 'P005',
    line_items: [
      { description: 'MRI Brain Scan', amount: 5000, quantity: 1, unit_price: 5000 },
      { description: 'Neurologist Consultation', amount: 1500, quantity: 1, unit_price: 1500 }
    ],
    status: 'pending'
  },
  {
    patient_name: 'Sarah Wilson',
    patient_number: 'P006',
    line_items: [
      { description: 'Laboratory Blood Culture', amount: 800, quantity: 1, unit_price: 800 },
      { description: 'Urine Analysis', amount: 200, quantity: 1, unit_price: 200 },
      { description: 'Doctor Checkup', amount: 400, quantity: 1, unit_price: 400 }
    ],
    status: 'paid'
  },
  {
    patient_name: 'David Lee',
    patient_number: 'P007',
    line_items: [
      { description: 'Minor Surgery - Wound Suturing', amount: 2500, quantity: 1, unit_price: 2500 },
      { description: 'Anesthesia', amount: 500, quantity: 1, unit_price: 500 },
      { description: 'Post-operative Medication', amount: 600, quantity: 1, unit_price: 600 }
    ],
    status: 'paid'
  },
  {
    patient_name: 'Lisa Anderson',
    patient_number: 'P008',
    line_items: [
      { description: 'CT Scan Abdomen', amount: 3500, quantity: 1, unit_price: 3500 },
      { description: 'Biopsy Procedure', amount: 4000, quantity: 1, unit_price: 4000 },
      { description: 'Pathology Report', amount: 1500, quantity: 1, unit_price: 1500 }
    ],
    status: 'pending'
  }
];

async function seedSampleInvoices() {
  const client = await pool.connect();
  
  try {
    console.log('='.repeat(60));
    console.log('SEEDING SAMPLE DIAGNOSTIC INVOICES');
    console.log('='.repeat(60));
    
    // Get tenant that has users (aajmin_polyclinic has users)
    const tenantResult = await client.query("SELECT id, name FROM tenants WHERE id = 'aajmin_polyclinic' LIMIT 1");
    if (tenantResult.rows.length === 0) {
      // Fallback to first tenant with users
      const fallbackResult = await client.query(`
        SELECT DISTINCT t.id, t.name 
        FROM tenants t 
        INNER JOIN users u ON t.id = u.tenant_id 
        LIMIT 1
      `);
      if (fallbackResult.rows.length === 0) {
        console.log('No tenants with users found. Please create a tenant and user first.');
        return;
      }
    }
    
    const tenant = tenantResult.rows[0] || { id: 'aajmin_polyclinic', name: 'Aajmin Polyclinic' };
    console.log(`\nUsing tenant: ${tenant.name} (${tenant.id})\n`);
    
    let createdCount = 0;
    
    for (const invoice of sampleInvoices) {
      const totalAmount = invoice.line_items.reduce((sum, item) => sum + item.amount, 0);
      const invoiceNumber = `INV-DIAG-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);
      
      await client.query(`
        INSERT INTO invoices (
          invoice_number, tenant_id, billing_period_start, billing_period_end,
          amount, currency, status, due_date, line_items, notes,
          patient_name, patient_number
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        invoiceNumber,
        tenant.id,
        new Date(),
        new Date(),
        totalAmount,
        'INR',
        invoice.status,
        dueDate,
        JSON.stringify(invoice.line_items),
        'Sample diagnostic invoice for testing',
        invoice.patient_name,
        invoice.patient_number
      ]);
      
      console.log(`✅ Created invoice for ${invoice.patient_name}: ₹${totalAmount} (${invoice.status})`);
      invoice.line_items.forEach(item => {
        console.log(`   - ${item.description}: ₹${item.amount}`);
      });
      console.log('');
      
      createdCount++;
      
      // Small delay to ensure unique timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    console.log('='.repeat(60));
    console.log(`CREATED ${createdCount} SAMPLE INVOICES`);
    console.log('='.repeat(60));
    console.log('\nNow run the test script to see the categorized data:');
    console.log('node backend/scripts/test-profit-loss-integration.js');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seedSampleInvoices();
