const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function createSampleData() {
  const client = await pool.connect();

  try {
    await client.query(`SET search_path TO "demo_hospital_001"`);

    console.log('🏥 Creating sample appointment data...\n');

    // Create doctor schedule (Monday-Friday, 9 AM - 5 PM)
    console.log('1. Creating doctor schedule...');
    for (let day = 1; day <= 5; day++) {
      await client.query(
        `
        INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes)
        VALUES (1, $1, '09:00', '17:00', 30)
        ON CONFLICT DO NOTHING
      `,
        [day]
      );
    }
    console.log('   ✅ Doctor schedule created\n');

    // Create sample appointments
    console.log('2. Creating sample appointments...');
    const appointments = [
      {
        patient_id: 1,
        doctor_id: 1,
        appointment_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        duration_minutes: 30,
        appointment_type: 'consultation',
        status: 'scheduled',
      },
      {
        patient_id: 2,
        doctor_id: 1,
        appointment_date: new Date(
          Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000
        ), // Tomorrow + 30 min
        duration_minutes: 30,
        appointment_type: 'follow_up',
        status: 'scheduled',
      },
    ];

    for (const apt of appointments) {
      const endTime = new Date(
        apt.appointment_date.getTime() + apt.duration_minutes * 60 * 1000
      );

      await client.query(
        `
        INSERT INTO appointments (
          appointment_number, patient_id, doctor_id, appointment_date, 
          appointment_end_time, duration_minutes, appointment_type, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
        [
          `APT${Date.now()}${Math.floor(Math.random() * 1000)}`,
          apt.patient_id,
          apt.doctor_id,
          apt.appointment_date,
          endTime,
          apt.duration_minutes,
          apt.appointment_type,
          apt.status,
        ]
      );
    }
    console.log('   ✅ Sample appointments created\n');

    console.log('🎉 Sample data created successfully!');
  } finally {
    client.release();
    await pool.end();
  }
}

createSampleData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
