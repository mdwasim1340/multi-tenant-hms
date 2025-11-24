const { Pool } = require('pg');
const express = require('express');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'multitenant_db',
  password: 'password',
  port: 5432,
});

// Create a simple test server to bypass authentication
const app = express();

// Simple tenant middleware
app.use((req, res, next) => {
  req.headers['x-tenant-id'] = 'aajmin_polyclinic';
  next();
});

// Test the exact controller logic
app.get('/test/pediatrics/stats', async (req, res) => {
  try {
    const tenantId = 'aajmin_polyclinic';
    const departmentName = 'pediatrics';
    const categoryId = 4; // Pediatrics category ID
    
    // Set tenant context
    await pool.query(`SET search_path TO "${tenantId}", public`);
    
    const statsResult = await pool.query(`
      SELECT
        COUNT(*) as total_beds,
        SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied_beds,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_beds,
        SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance_beds,
        SUM(CASE WHEN status = 'cleaning' THEN 1 ELSE 0 END) as cleaning_beds
      FROM beds
      WHERE category_id = $1
    `, [categoryId]);
    
    const stats = statsResult.rows[0];
    const totalBeds = parseInt(stats.total_beds) || 0;
    const occupiedBeds = parseInt(stats.occupied_beds) || 0;
    const availableBeds = parseInt(stats.available_beds) || 0;
    const maintenanceBeds = parseInt(stats.maintenance_beds) || 0;
    
    const occupancyRate = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;
    
    const result = {
      department_id: 5,
      department_name: 'Pediatrics',
      total_beds: totalBeds,
      occupied_beds: occupiedBeds,
      available_beds: availableBeds,
      maintenance_beds: maintenanceBeds,
      occupancy_rate: Math.round(occupancyRate * 10) / 10,
      avgOccupancyTime: 4.2,
      criticalPatients: 0
    };
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/test/pediatrics/beds', async (req, res) => {
  try {
    const tenantId = 'aajmin_polyclinic';
    const categoryId = 4; // Pediatrics category ID
    
    // Set tenant context
    await pool.query(`SET search_path TO "${tenantId}", public`);
    
    const bedsResult = await pool.query(`
      SELECT id, bed_number, status, unit, category_id, bed_type, room, floor
      FROM beds
      WHERE category_id = $1
      ORDER BY bed_number
      LIMIT 50
    `, [categoryId]);
    
    const result = {
      beds: bedsResult.rows.map(bed => ({
        id: bed.id.toString(),
        bed_number: bed.bed_number,
        status: bed.status,
        bed_type: bed.bed_type || 'Standard',
        unit: bed.unit,
        category_id: bed.category_id,
        room: bed.room,
        floor: bed.floor
      })),
      pagination: {
        page: 1,
        limit: 50,
        total: bedsResult.rows.length,
        pages: Math.ceil(bedsResult.rows.length / 50)
      }
    };
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start test server on different port
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log('Test endpoints:');
  console.log(`- http://localhost:${PORT}/test/pediatrics/stats`);
  console.log(`- http://localhost:${PORT}/test/pediatrics/beds`);
  
  // Test the endpoints
  setTimeout(async () => {
    const http = require('http');
    
    console.log('\n=== TESTING PEDIATRIC API (NO AUTH) ===');
    
    // Test stats
    const statsReq = http.get(`http://localhost:${PORT}/test/pediatrics/stats`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('\n✅ Pediatrics Stats (No Auth):');
        console.log(data);
      });
    });
    
    // Test beds
    const bedsReq = http.get(`http://localhost:${PORT}/test/pediatrics/beds`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('\n✅ Pediatrics Beds (No Auth):');
        const response = JSON.parse(data);
        console.log(`Found ${response.beds.length} beds:`);
        response.beds.forEach(bed => {
          console.log(`- ${bed.bed_number}: ${bed.status} (category: ${bed.category_id})`);
        });
        
        console.log('\n🎯 CONCLUSION:');
        console.log('If this shows 2 Pediatric beds, the backend logic is correct.');
        console.log('The issue is in frontend authentication or API calling.');
        
        process.exit(0);
      });
    });
    
  }, 1000);
});