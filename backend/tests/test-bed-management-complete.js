/**
 * Comprehensive Bed Management System Test
 * Tests all enhanced bed management functionality including transfers and discharges
 */

const axios = require('axios');
const { Pool } = require('pg');
require('dotenv').config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TENANT_ID = process.env.TEST_TENANT_ID || 'tenant_1762083064503';

// Test configuration
const testConfig = {
  timeout: 30000,
  retries: 3
};

class BedManagementTester {
  constructor() {
    this.pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'multitenant_db',
      password: process.env.DB_PASSWORD || 'postgres',
      port: process.env.DB_PORT || 5432,
    });
    
    this.authToken = null;
    this.testResults = {
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  async runAllTests() {
    console.log('🏥 Starting Comprehensive Bed Management System Tests...\n');
    
    try {
      // Setup
      await this.authenticate();
      await this.setupTestData();
      
      // Core bed management tests
      await this.testBedOccupancy();
      await this.testDepartmentBeds();
      await this.testDepartmentStats();
      await this.testBedHistory();
      
      // Transfer functionality tests
      await this.testCreateTransfer();
      await this.testExecuteTransfer();
      await this.testTransferHistory();
      
      // Discharge functionality tests
      await this.testDischargePatient();
      await this.testDischargeHistory();
      
      // Available beds tests
      await this.testAvailableBeds();
      
      // Error handling tests
      await this.testErrorHandling();
      
      // Cleanup
      await this.cleanup();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Test suite error: ${error.message}`);
    }
    
    this.printResults();
  }

  async authenticate() {
    try {
      console.log('🔐 Authenticating...');
      
      const response = await axios.post(`${API_BASE_URL}/auth/signin`, {
        email: 'admin@test.com',
        password: 'password123'
      });
      
      this.authToken = response.data.token;
      console.log('✅ Authentication successful\n');
      this.testResults.passed++;
    } catch (error) {
      console.error('❌ Authentication failed:', error.response?.data || error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Authentication: ${error.message}`);
      throw error;
    }
  }

  async setupTestData() {
    try {
      console.log('🔧 Setting up test data...');
      
      // Set tenant schema context
      await this.pool.query(`SET search_path TO "${TENANT_ID}"`);
      
      // Create test beds if they don't exist
      const bedsExist = await this.pool.query('SELECT COUNT(*) FROM beds');
      if (parseInt(bedsExist.rows[0].count) === 0) {
        await this.pool.query(`
          INSERT INTO beds (bed_number, department_id, bed_type, floor_number, room_number, wing, status, created_by, updated_by)
          VALUES 
          ('101', 1, 'Standard', '1', '101', 'A', 'Available', 1, 1),
          ('102', 1, 'Standard', '1', '102', 'A', 'Occupied', 1, 1),
          ('103', 1, 'ICU', '1', '103', 'A', 'Available', 1, 1),
          ('201', 2, 'Standard', '2', '201', 'B', 'Available', 1, 1),
          ('202', 2, 'ICU', '2', '202', 'B', 'Maintenance', 1, 1)
        `);
      }
      
      // Create test patients if they don't exist
      const patientsExist = await this.pool.query('SELECT COUNT(*) FROM patients');
      if (parseInt(patientsExist.rows[0].count) === 0) {
        await this.pool.query(`
          INSERT INTO patients (patient_number, first_name, last_name, date_of_birth, status, created_by, updated_by)
          VALUES 
          ('P001', 'John', 'Doe', '1980-01-01', 'Active', 1, 1),
          ('P002', 'Jane', 'Smith', '1985-05-15', 'Active', 1, 1)
        `);
      }
      
      console.log('✅ Test data setup complete\n');
      this.testResults.passed++;
    } catch (error) {
      console.error('❌ Test data setup failed:', error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Setup: ${error.message}`);
    }
  }

  async testBedOccupancy() {
    try {
      console.log('🛏️ Testing bed occupancy statistics...');
      
      const response = await axios.get(`${API_BASE_URL}/api/beds/occupancy`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'X-Tenant-ID': TENANT_ID
        }
      });
      
      const occupancy = response.data;
      
      // Validate response structure
      if (!occupancy.total_beds || !occupancy.hasOwnProperty('occupied_beds') || !occupancy.hasOwnProperty('available_beds')) {
        throw new Error('Invalid occupancy response structure');
      }
      
      console.log(`   📊 Total beds: ${occupancy.total_beds}`);
      console.log(`   🔴 Occupied: ${occupancy.occupied_beds}`);
      console.log(`   🟢 Available: ${occupancy.available_beds}`);
      console.log(`   📈 Occupancy rate: ${occupancy.occupancy_rate}%`);
      console.log('✅ Bed occupancy test passed\n');
      
      this.testResults.passed++;
    } catch (error) {
      console.error('❌ Bed occupancy test failed:', error.response?.data || error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Bed occupancy: ${error.message}`);
    }
  }

  async testDepartmentBeds() {
    try {
      console.log('🏥 Testing department beds retrieval...');
      
      const response = await axios.get(`${API_BASE_URL}/api/bed-management/departments/cardiology/beds`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'X-Tenant-ID': TENANT_ID
        }
      });
      
      const result = response.data;
      
      if (!result.beds || !Array.isArray(result.beds)) {
        throw new Error('Invalid department beds response structure');
      }
      
      console.log(`   🛏️ Found ${result.beds.length} beds in cardiology department`);
      console.log('✅ Department beds test passed\n');
      
      this.testResults.passed++;
    } catch (error) {
      console.error('❌ Department beds test failed:', error.response?.data || error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Department beds: ${error.message}`);
    }
  }

  async testDepartmentStats() {
    try {
      console.log('📊 Testing department statistics...');
      
      const response = await axios.get(`${API_BASE_URL}/api/bed-management/departments/cardiology/stats`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'X-Tenant-ID': TENANT_ID
        }
      });
      
      const stats = response.data;
      
      if (!stats.hasOwnProperty('totalBeds') || !stats.hasOwnProperty('occupiedBeds')) {
        throw new Error('Invalid department stats response structure');
      }
      
      console.log(`   📈 Department stats retrieved successfully`);
      console.log('✅ Department stats test passed\n');
      
      this.testResults.passed++;
    } catch (error) {
      console.error('❌ Department stats test failed:', error.response?.data || error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Department stats: ${error.message}`);
    }
  }

  async testBedHistory() {
    try {
      console.log('📋 Testing bed history retrieval...');
      
      // Get a bed ID first
      const bedsResponse = await axios.get(`${API_BASE_URL}/api/beds`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'X-Tenant-ID': TENANT_ID
        }
      });
      
      if (!bedsResponse.data.beds || bedsResponse.data.beds.length === 0) {
        throw new Error('No beds available for history test');
      }
      
      const bedId = bedsResponse.data.beds[0].id;
      
      const response = await axios.get(`${API_BASE_URL}/api/bed-management/beds/${bedId}/history`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'X-Tenant-ID': TENANT_ID
        }
      });
      
      const result = response.data;
      
      if (!result.history || !Array.isArray(result.history)) {
        throw new Error('Invalid bed history response structure');
      }
      
      console.log(`   📜 Retrieved ${result.history.length} history entries`);
      console.log('✅ Bed history test passed\n');
      
      this.testResults.passed++;
    } catch (error) {
      console.error('❌ Bed history test failed:', error.response?.data || error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Bed history: ${error.message}`);
    }
  }

  async testCreateTransfer() {
    try {
      console.log('🔄 Testing transfer creation...');
      
      const transferData = {
        fromBedId: 1,
        toBedId: 2,
        patientId: 1,
        reason: 'Medical necessity',
        priority: 'Medium',
        notes: 'Test transfer for automated testing',
        notifications: ['doctor', 'nurse']
      };
      
      const response = await axios.post(`${API_BASE_URL}/api/bed-management/transfers`, transferData, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'X-Tenant-ID': TENANT_ID,
          'Content-Type': 'application/json'
        }
      });
      
      const transfer = response.data;
      
      if (!transfer.id || !transfer.reason) {
        throw new Error('Invalid transfer response structure');
      }
      
      console.log(`   🆔 Transfer created with ID: ${transfer.id}`);
      console.log(`   📝 Reason: ${transfer.reason}`);
      console.log('✅ Transfer creation test passed\n');
      
      this.testResults.passed++;
      return transfer.id;
    } catch (error) {
      console.error('❌ Transfer creation test failed:', error.response?.data || error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Transfer creation: ${error.message}`);
      return null;
    }
  }

  async testExecuteTransfer() {
    try {
      console.log('⚡ Testing transfer execution...');
      
      // First create a transfer
      const transferId = await this.testCreateTransfer();
      if (!transferId) {
        throw new Error('No transfer ID available for execution test');
      }
      
      const response = await axios.post(`${API_BASE_URL}/api/bed-management/transfers/${transferId}/execute`, {}, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'X-Tenant-ID': TENANT_ID
        }
      });
      
      const executedTransfer = response.data;
      
      if (!executedTransfer.executedTime) {
        throw new Error('Transfer execution did not complete properly');
      }
      
      console.log(`   ✅ Transfer ${transferId} executed successfully`);
      console.log('✅ Transfer execution test passed\n');
      
      this.testResults.passed++;
    } catch (error) {
      console.error('❌ Transfer execution test failed:', error.response?.data || error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Transfer execution: ${error.message}`);
    }
  }

  async testTransferHistory() {
    try {
      console.log('📚 Testing transfer history...');
      
      const response = await axios.get(`${API_BASE_URL}/api/bed-management/transfers`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'X-Tenant-ID': TENANT_ID
        }
      });
      
      const result = response.data;
      
      if (!result.transfers || !Array.isArray(result.transfers)) {
        throw new Error('Invalid transfer history response structure');
      }
      
      console.log(`   📋 Retrieved ${result.transfers.length} transfer records`);
      console.log('✅ Transfer history test passed\n');
      
      this.testResults.passed++;
    } catch (error) {
      console.error('❌ Transfer history test failed:', error.response?.data || error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Transfer history: ${error.message}`);
    }
  }

  async testDischargePatient() {
    try {
      console.log('🚪 Testing patient discharge...');
      
      const dischargeData = {
        bedId: 1,
        patientId: 1,
        dischargeDate: new Date().toISOString(),
        dischargeType: 'Recovered',
        dischargeSummary: 'Patient recovered fully and ready for discharge',
        finalBillStatus: 'Paid',
        followUpRequired: true,
        followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        followUpInstructions: 'Follow up in one week',
        medications: ['Continue current medications'],
        homeCareInstructions: 'Rest and follow medication schedule',
        notifications: ['doctor', 'nurse', 'billing'],
        transportArrangement: 'Family pickup'
      };
      
      const response = await axios.post(`${API_BASE_URL}/api/bed-management/discharges`, dischargeData, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'X-Tenant-ID': TENANT_ID,
          'Content-Type': 'application/json'
        }
      });
      
      const discharge = response.data;
      
      if (!discharge.id || !discharge.dischargeSummary) {
        throw new Error('Invalid discharge response structure');
      }
      
      console.log(`   🆔 Discharge processed with ID: ${discharge.id}`);
      console.log(`   📋 Type: ${discharge.dischargeType}`);
      console.log('✅ Patient discharge test passed\n');
      
      this.testResults.passed++;
    } catch (error) {
      console.error('❌ Patient discharge test failed:', error.response?.data || error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Patient discharge: ${error.message}`);
    }
  }

  async testDischargeHistory() {
    try {
      console.log('📖 Testing discharge history...');
      
      const response = await axios.get(`${API_BASE_URL}/api/bed-management/discharges`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'X-Tenant-ID': TENANT_ID
        }
      });
      
      const result = response.data;
      
      if (!result.discharges || !Array.isArray(result.discharges)) {
        throw new Error('Invalid discharge history response structure');
      }
      
      console.log(`   📋 Retrieved ${result.discharges.length} discharge records`);
      console.log('✅ Discharge history test passed\n');
      
      this.testResults.passed++;
    } catch (error) {
      console.error('❌ Discharge history test failed:', error.response?.data || error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Discharge history: ${error.message}`);
    }
  }

  async testAvailableBeds() {
    try {
      console.log('🟢 Testing available beds retrieval...');
      
      const response = await axios.get(`${API_BASE_URL}/api/bed-management/available-beds`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'X-Tenant-ID': TENANT_ID
        }
      });
      
      const result = response.data;
      
      if (!result.hasOwnProperty('available_beds') || !result.beds || !Array.isArray(result.beds)) {
        throw new Error('Invalid available beds response structure');
      }
      
      console.log(`   🛏️ Found ${result.available_beds} available beds`);
      console.log('✅ Available beds test passed\n');
      
      this.testResults.passed++;
    } catch (error) {
      console.error('❌ Available beds test failed:', error.response?.data || error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Available beds: ${error.message}`);
    }
  }

  async testErrorHandling() {
    try {
      console.log('⚠️ Testing error handling...');
      
      // Test invalid tenant ID
      try {
        await axios.get(`${API_BASE_URL}/api/beds/occupancy`, {
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'X-Tenant-ID': 'invalid_tenant'
          }
        });
        throw new Error('Should have failed with invalid tenant ID');
      } catch (error) {
        if (error.response?.status !== 400 && error.response?.status !== 404) {
          throw error;
        }
      }
      
      // Test missing authentication
      try {
        await axios.get(`${API_BASE_URL}/api/beds/occupancy`, {
          headers: {
            'X-Tenant-ID': TENANT_ID
          }
        });
        throw new Error('Should have failed without authentication');
      } catch (error) {
        if (error.response?.status !== 401) {
          throw error;
        }
      }
      
      console.log('✅ Error handling test passed\n');
      this.testResults.passed++;
    } catch (error) {
      console.error('❌ Error handling test failed:', error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Error handling: ${error.message}`);
    }
  }

  async cleanup() {
    try {
      console.log('🧹 Cleaning up test data...');
      
      // Clean up test transfers and discharges
      await this.pool.query(`SET search_path TO "${TENANT_ID}"`);
      await this.pool.query('DELETE FROM bed_transfers WHERE notes LIKE \'%automated testing%\'');
      await this.pool.query('DELETE FROM patient_discharges WHERE discharge_summary LIKE \'%automated testing%\'');
      
      console.log('✅ Cleanup completed\n');
    } catch (error) {
      console.error('⚠️ Cleanup warning:', error.message);
    }
  }

  printResults() {
    console.log('=' .repeat(60));
    console.log('🏥 BED MANAGEMENT SYSTEM TEST RESULTS');
    console.log('=' .repeat(60));
    console.log(`✅ Tests Passed: ${this.testResults.passed}`);
    console.log(`❌ Tests Failed: ${this.testResults.failed}`);
    console.log(`📊 Success Rate: ${((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100).toFixed(1)}%`);
    
    if (this.testResults.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.testResults.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    console.log('\n🎯 SYSTEM STATUS:');
    if (this.testResults.failed === 0) {
      console.log('🟢 BED MANAGEMENT SYSTEM: FULLY OPERATIONAL');
      console.log('🚀 Ready for production use');
    } else if (this.testResults.passed > this.testResults.failed) {
      console.log('🟡 BED MANAGEMENT SYSTEM: MOSTLY OPERATIONAL');
      console.log('⚠️ Some features need attention');
    } else {
      console.log('🔴 BED MANAGEMENT SYSTEM: NEEDS ATTENTION');
      console.log('🔧 Multiple issues require fixing');
    }
    
    console.log('=' .repeat(60));
  }
}

// Run the tests
if (require.main === module) {
  const tester = new BedManagementTester();
  tester.runAllTests().catch(console.error);
}

module.exports = BedManagementTester;