/**
 * Team Alpha - Seed Doctor Schedules
 * Creates sample doctor schedules for testing available-slots endpoint
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const TENANT_ID = 'tenant_1762083064503';
const DOCTOR_ID = 3; // Admin User (we'll use as doctor for testing)

async function seedDoctorSchedules() {
  const client = await pool.connect();

  try {
    await client.query(`SET search_path TO "${TENANT_ID}"`);

    console.log('\n🏥 Seeding Doctor Schedules for Testing');
    console.log('='.repeat(50));

    // Check if schedules already exist
    const existingCheck = await client.query(
      'SELECT COUNT(*) FROM doctor_schedules WHERE doctor_id = $1',
      [DOCTOR_ID]
    );

    if (parseInt(existingCheck.rows[0].count) > 0) {
      console.log('⚠️  Doctor schedules already exist. Deleting old schedules...');
      await client.query('DELETE FROM doctor_schedules WHERE doctor_id = $1', [DOCTOR_ID]);
    }

    // Create schedules for Monday to Friday (1-5)
    const schedules = [
      // Monday (1)
      {
        doctor_id: DOCTOR_ID,
        day_of_week: 1,
        start_time: '09:00:00',
        end_time: '17:00:00',
        slot_duration_minutes: 30,
        break_duration_minutes: 60, // 1 hour lunch break
        is_available: true,
      },
      // Tuesday (2)
      {
        doctor_id: DOCTOR_ID,
        day_of_week: 2,
        start_time: '09:00:00',
        end_time: '17:00:00',
        slot_duration_minutes: 30,
        break_duration_minutes: 60,
        is_available: true,
      },
      // Wednesday (3)
      {
        doctor_id: DOCTOR_ID,
        day_of_week: 3,
        start_time: '09:00:00',
        end_time: '17:00:00',
        slot_duration_minutes: 30,
        break_duration_minutes: 60,
        is_available: true,
      },
      // Thursday (4)
      {
        doctor_id: DOCTOR_ID,
        day_of_week: 4,
        start_time: '09:00:00',
        end_time: '17:00:00',
        slot_duration_minutes: 30,
        break_duration_minutes: 60,
        is_available: true,
      },
      // Friday (5)
      {
        doctor_id: DOCTOR_ID,
        day_of_week: 5,
        start_time: '09:00:00',
        end_time: '13:00:00', // Half day Friday
        slot_duration_minutes: 30,
        break_duration_minutes: 0,
        is_available: true,
      },
    ];

    console.log(`\n📅 Creating schedules for Doctor ID: ${DOCTOR_ID}`);

    for (const schedule of schedules) {
      const insertQuery = `
        INSERT INTO doctor_schedules (
          doctor_id, day_of_week, start_time, end_time,
          slot_duration_minutes, break_duration_minutes, is_available,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `;

      const result = await client.query(insertQuery, [
        schedule.doctor_id,
        schedule.day_of_week,
        schedule.start_time,
        schedule.end_time,
        schedule.slot_duration_minutes,
        schedule.break_duration_minutes,
        schedule.is_available,
      ]);

      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      console.log(`✅ ${dayNames[schedule.day_of_week]}: ${schedule.start_time} - ${schedule.end_time}`);
    }

    // Verify schedules
    const verifyResult = await client.query(
      'SELECT * FROM doctor_schedules WHERE doctor_id = $1 ORDER BY day_of_week',
      [DOCTOR_ID]
    );

    console.log(`\n✅ Successfully created ${verifyResult.rows.length} schedules`);
    console.log('\n📊 Schedule Summary:');
    console.log('='.repeat(50));

    verifyResult.rows.forEach((schedule) => {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      console.log(`${dayNames[schedule.day_of_week]}: ${schedule.start_time} - ${schedule.end_time} (${schedule.slot_duration_minutes} min slots)`);
    });

    console.log('\n🎉 Doctor schedules seeded successfully!');
    console.log('\n📝 Next Steps:');
    console.log('1. Test available-slots endpoint with these schedules');
    console.log('2. Create some test appointments');
    console.log('3. Verify conflict detection works');

  } catch (error) {
    console.error('❌ Error seeding doctor schedules:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run seeding
if (require.main === module) {
  seedDoctorSchedules().catch(console.error);
}

module.exports = { seedDoctorSchedules };
