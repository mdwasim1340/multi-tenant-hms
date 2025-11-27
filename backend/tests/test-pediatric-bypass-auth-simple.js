const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'multitenant_db',
  password: 'password',
  port: 5432,
});

const app = express();
app.use(cors());
app.use(express.json());

// Simple test endpoint that bypasses all authentication
app.get('/api/bed-management/departments/:departmentName/beds', async (req, res) => {
  try {
    const { departmentName } = req.params;
    const tenantId = 'aajmin_polyclinic';
    
    console.log(`🔍 Test endpoint called for department: ${departmentName}`);
    
    // Set tenant context
    await pool.query(`SET search_path TO "${tenantId}", public`);
    
    // Get category ID
    const categoryMap = {
      'pediatrics': 4,
      'maternity': 5,
      'cardiology': 8,
      'icu': 2,
      'general': 1
    };
    
    const categoryId = categoryMap[departmentName.toLowerCase()];
    
    if (!categoryId) {
      return res.status(400).json({ error: 'Invalid department' });
    }
    
    console.log(`🔍 Category ID: ${categoryId}`);
    
    // Get beds with category filter
    const bedsResult = await pool.query(`
      SELECT id, bed_number, status, unit, category_id, bed_type, room, floor, updated_at
      FROM beds
      WHERE category_id = $1
      ORDER BY bed_number ASC
      LIMIT 50
    `, [categoryId]);
    
    const beds = bedsResult.rows.map(bed => ({
      id: bed.id.toString(),
      bedNumber: bed.bed_number,
      status: bed.status,
      bedType: bed.bed_type || 'Standard',
      unit: bed.unit,
      category_id: bed.category_id,
      room: bed.room,
      floor: bed.floor,
      lastUpdated: bed.updated_at || new Date().toISOString()
    }));
    
    const result = {
      beds: beds,
      pagination: {
        page: 1,
        limit: 50,
        total: beds.length,
        pages: 1
      }
    };
    
    console.log(`✅ Returning ${beds.length} beds for ${departmentName}`);
    
    res.json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test stats endpoint
app.get('/api/bed-management/departments/:departmentName/stats', async (req, res) => {
  try {
    const { departmentName } = req.params;
    const tenantId = 'aajmin_polyclinic';
    
    console.log(`🔍 Test stats endpoint called for department: ${departmentName}`);
    
    // Set tenant context
    await pool.query(`SET search_path TO "${tenantId}", public`);
    
    // Get category ID
    const categoryMap = {
      'pediatrics': 4,
      'maternity': 5,
      'cardiology': 8,
      'icu': 2,
      'general': 1
    };
    
    const categoryId = categoryMap[departmentName.toLowerCase()];
    
    if (!categoryId) {
      return res.status(400).json({ error: 'Invalid department' });
    }
    
    // Get stats
    const statsResult = await pool.query(`
      SELECT
        COUNT(*) as total_beds,
        SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied_beds,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_beds,
        SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance_beds
      FROM beds
      WHERE category_id = $1
    `, [categoryId]);
    
    const stats = statsResult.rows[0];
    const totalBeds = parseInt(stats.total_beds) || 0;
    const occupiedBeds = parseInt(stats.occupied_beds) || 0;
    const availableBeds = parseInt(stats.available_beds) || 0;
    const maintenanceBeds = parseInt(stats.maintenance_beds) || 0;
    
    const result = {
      department_id: categoryId,
      department_name: departmentName.charAt(0).toUpperCase() + departmentName.slice(1),
      total_beds: totalBeds,
      occupied_beds: occupiedBeds,
      available_beds: availableBeds,
      maintenance_beds: maintenanceBeds,
      occupancy_rate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100 * 10) / 10 : 0,
      avgOccupancyTime: 4.2,
      criticalPatients: 0
    };
    
    console.log(`✅ Returning stats for ${departmentName}:`, result);
    
    res.json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log('Test endpoints:');
  console.log(`- http://localhost:${PORT}/api/bed-management/departments/pediatrics/stats`);
  console.log(`- http://localhost:${PORT}/api/bed-management/departments/pediatrics/beds`);
  console.log('');
  console.log('🔧 To test: Update frontend API base URL to http://localhost:3002 temporarily');
  console.log('   Or test with curl:');
  console.log(`   curl http://localhost:${PORT}/api/bed-management/departments/pediatrics/beds`);
});