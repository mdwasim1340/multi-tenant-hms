/**
 * Enhanced Bed Management Controller
 * Handles HTTP requests for comprehensive bed management operations
 */

import { Request, Response } from 'express';
import { Pool } from 'pg';
import { BedService } from '../services/bed-service';
import { BedTransferService } from '../services/bed-transfer.service';
import { BedDischargeService, DischargeData } from '../services/bed-discharge.service';
import { CreateBedTransferData, BedTransferSearchParams, TransferStatus } from '../types/bed';

export class BedManagementController {
  private bedService: BedService;
  private transferService: BedTransferService;
  private dischargeService: BedDischargeService;

  constructor(pool: Pool) {
    this.bedService = new BedService(pool);
    this.transferService = new BedTransferService();
    this.dischargeService = new BedDischargeService(pool);
  }

  /**
   * GET /api/bed-management/departments/:departmentName/beds
   * Get all beds for a specific department
   */
  getDepartmentBeds = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { departmentName } = req.params;
      
      // 🔍 DEBUG: Log which endpoint is being called
      console.log(`🔍 [BedManagementController] getDepartmentBeds called for department: ${departmentName}`);
      console.log(`🔍 [BedManagementController] Tenant: ${tenantId}`);
      console.log(`🔍 [BedManagementController] This should filter by category_id`);
      
      if (!tenantId) {
        res.status(400).json({ error: 'X-Tenant-ID header is required' });
        return;
      }

      // ✅ FIXED: Use category-based filtering instead of unit-based
      // Map department name to category ID for consistent filtering
      const categoryId = this.getDepartmentCategoryId(departmentName);
      
      console.log(`🔍 [BedManagementController] Category ID for ${departmentName}: ${categoryId}`);

      const params = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        search: req.query.search as string,
        category_id: categoryId, // ✅ Use category_id for filtering
        bed_type: req.query.bed_type as string,
        status: req.query.status as string,
        sort_by: req.query.sort_by as any,
        sort_order: req.query.sort_order as any,
      };

      const result = await this.bedService.getBeds(params, tenantId);
      res.json(result);
    } catch (error: any) {
      console.error('Error fetching department beds:', error);
      res.status(500).json({ 
        error: 'Failed to fetch department beds',
        message: error.message 
      });
    }
  };

  /**
   * GET /api/bed-management/departments/:departmentName/stats
   * Get department-specific bed statistics
   */
  getDepartmentStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { departmentName } = req.params;
      
      if (!tenantId) {
        res.status(400).json({ error: 'X-Tenant-ID header is required' });
        return;
      }

      // ✅ FIXED: Get department-specific statistics directly from database
      const categoryId = this.getDepartmentCategoryId(departmentName);
      const departmentId = this.getDepartmentIdFromName(departmentName);
      
      // Set tenant context and get department-specific stats
      await this.bedService.pool.query(`SET search_path TO "${tenantId}", public`);
      
      const statsResult = await this.bedService.pool.query(`
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
      
      // Calculate additional metrics
      const avgOccupancyTime = await this.calculateAvgOccupancyTime(departmentId, tenantId);
      const criticalPatients = await this.getCriticalPatientsCount(departmentId, tenantId);

      res.json({
        department_id: departmentId,
        department_name: this.formatDepartmentName(departmentName),
        total_beds: totalBeds,
        occupied_beds: occupiedBeds,
        available_beds: availableBeds,
        maintenance_beds: maintenanceBeds,
        occupancy_rate: Math.round(occupancyRate * 10) / 10, // Round to 1 decimal
        avgOccupancyTime,
        criticalPatients
      });
    } catch (error: any) {
      console.error('Error fetching department stats:', error);
      res.status(500).json({ 
        error: 'Failed to fetch department stats',
        message: error.message 
      });
    }
  };

  /**
   * GET /api/bed-management/beds/:bedId/history
   * Get bed history
   */
  getBedHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const bedId = parseInt(req.params.bedId);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      if (!tenantId) {
        res.status(400).json({ error: 'X-Tenant-ID header is required' });
        return;
      }

      const history = await this.dischargeService.getBedHistory(bedId, tenantId, limit);
      res.json({ history });
    } catch (error: any) {
      console.error('Error fetching bed history:', error);
      res.status(500).json({ 
        error: 'Failed to fetch bed history',
        message: error.message 
      });
    }
  };

  /**
   * POST /api/bed-management/transfers
   * Create a new patient transfer
   */
  createTransfer = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = (req as any).userId;

      if (!tenantId) {
        res.status(400).json({ error: 'X-Tenant-ID header is required' });
        return;
      }

      const transferData: CreateBedTransferData = {
        ...req.body,
        performed_by: userId,
        scheduled_time: req.body.scheduledTime ? new Date(req.body.scheduledTime) : undefined
      };

      const transfer = await this.transferService.createBedTransfer(tenantId, transferData);
      res.status(201).json(transfer);
    } catch (error: any) {
      console.error('Error creating transfer:', error);
      res.status(500).json({ 
        error: 'Failed to create transfer',
        message: error.message 
      });
    }
  };

  /**
   * POST /api/bed-management/transfers/:transferId/execute
   * Execute a scheduled transfer
   */
  executeTransfer = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = (req as any).userId;
      const transferId = parseInt(req.params.transferId);

      if (!tenantId) {
        res.status(400).json({ error: 'X-Tenant-ID header is required' });
        return;
      }

      const transfer = await this.transferService.completeBedTransfer(tenantId, transferId, userId);
      res.json(transfer);
    } catch (error: any) {
      console.error('Error executing transfer:', error);
      res.status(500).json({ 
        error: 'Failed to execute transfer',
        message: error.message 
      });
    }
  };

  /**
   * GET /api/bed-management/transfers
   * Get transfer history
   */
  getTransfers = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;

      if (!tenantId) {
        res.status(400).json({ error: 'X-Tenant-ID header is required' });
        return;
      }

      const filters: BedTransferSearchParams = {
        patient_id: req.query.patientId ? parseInt(req.query.patientId as string) : undefined,
        from_bed_id: req.query.bedId ? parseInt(req.query.bedId as string) : undefined,
        status: req.query.status as TransferStatus | undefined,
        transfer_date_from: req.query.dateFrom as string | undefined,
        transfer_date_to: req.query.dateTo as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10
      };

      const result = await this.transferService.getBedTransfers(tenantId, filters);
      res.json(result);
    } catch (error: any) {
      console.error('Error fetching transfers:', error);
      res.status(500).json({ 
        error: 'Failed to fetch transfers',
        message: error.message 
      });
    }
  };

  /**
   * POST /api/bed-management/discharges
   * Process patient discharge
   */
  dischargePatient = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = (req as any).userId;

      if (!tenantId) {
        res.status(400).json({ error: 'X-Tenant-ID header is required' });
        return;
      }

      if (!userId) {
        res.status(401).json({ error: 'User authentication required' });
        return;
      }

      const dischargeData: DischargeData = {
        ...req.body,
        performedBy: userId,
        dischargeDate: new Date(req.body.dischargeDate),
        followUpDate: req.body.followUpDate ? new Date(req.body.followUpDate) : undefined
      };

      const discharge = await this.dischargeService.dischargePatient(dischargeData, tenantId);
      res.status(201).json(discharge);
    } catch (error: any) {
      console.error('Error processing discharge:', error);
      res.status(500).json({ 
        error: 'Failed to process discharge',
        message: error.message 
      });
    }
  };

  /**
   * GET /api/bed-management/discharges
   * Get discharge history
   */
  getDischarges = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;

      if (!tenantId) {
        res.status(400).json({ error: 'X-Tenant-ID header is required' });
        return;
      }

      const filters = {
        patientId: req.query.patientId ? parseInt(req.query.patientId as string) : undefined,
        bedId: req.query.bedId ? parseInt(req.query.bedId as string) : undefined,
        dischargeType: req.query.dischargeType as string,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      };

      const result = await this.dischargeService.getDischargeHistory(tenantId, filters);
      res.json(result);
    } catch (error: any) {
      console.error('Error fetching discharges:', error);
      res.status(500).json({ 
        error: 'Failed to fetch discharges',
        message: error.message 
      });
    }
  };

  /**
   * GET /api/bed-management/available-beds
   * Get available beds for transfer
   */
  getAvailableBeds = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;

      if (!tenantId) {
        res.status(400).json({ error: 'X-Tenant-ID header is required' });
        return;
      }

      const departmentId = req.query.departmentId ? parseInt(req.query.departmentId as string) : undefined;
      const bedType = req.query.bedType as string;

      const result = await this.bedService.checkBedAvailability(tenantId, departmentId, bedType);
      res.json(result);
    } catch (error: any) {
      console.error('Error fetching available beds:', error);
      res.status(500).json({ 
        error: 'Failed to fetch available beds',
        message: error.message 
      });
    }
  };

  /**
   * Helper method to get department ID from name - CORRECTED FOR ACTUAL DATABASE
   */
  private getDepartmentIdFromName(departmentName: string): number {
    const departmentMap: { [key: string]: number } = {
      'cardiology': 3,    // Cardiology department ID from database
      'orthopedics': 4,   // Orthopedics department ID
      'neurology': 7,     // Neurology department ID
      'pediatrics': 5,    // Pediatrics department ID
      'icu': 2,           // ICU department ID
      'emergency': 1,     // Emergency department ID
      'maternity': 6,     // Maternity department ID
      'oncology': 8,      // Oncology department ID
      'surgery': 9,       // Surgery department ID
      'general': 10       // General Ward department ID
    };

    return departmentMap[departmentName.toLowerCase()] || 1;
  }

  /**
   * Helper method to get category ID from department name - FOR CONSISTENT FILTERING
   */
  private getDepartmentCategoryId(departmentName: string): number | undefined {
    const categoryMap: { [key: string]: number } = {
      'cardiology': 8,     // Cardiology category ID
      'icu': 2,           // ICU category ID
      'general': 1,       // General category ID
      'pediatric': 4,     // ✅ FIXED: Add singular form (URL uses this)
      'pediatrics': 4,    // Pediatrics category ID (plural form)
      'emergency': 3,     // Emergency category ID
      'maternity': 5,     // Maternity category ID
      'orthopedic': 9,    // ✅ FIXED: Add singular form
      'orthopedics': 9,   // Orthopedics category ID (plural form)
      'neurology': 10,    // Neurology category ID
      'oncology': 11,     // Oncology category ID (if exists)
      'surgery': 12       // Surgery category ID (if exists)
    };

    return categoryMap[departmentName.toLowerCase()];
  }

  /**
   * Helper method to get unit name from department name - CORRECTED FOR ACTUAL DATABASE UNITS
   */
  private getDepartmentUnitFromName(departmentName: string): string {
    const unitMap: { [key: string]: string } = {
      'cardiology': 'Cardiology', // ✅ FIXED: Map cardiology to Cardiology (actual unit name)
      'orthopedics': 'General',   // Map to General ward
      'neurology': 'ICU',         // Map to ICU
      'pediatrics': 'Pediatrics', // This exists
      'icu': 'ICU',              // This exists
      'emergency': 'General',     // Map to General
      'maternity': 'Maternity',   // ✅ FIXED: Map to Maternity (now exists)
      'oncology': 'General',      // Map to General
      'surgery': 'General',       // Map to General
      'general': 'General'        // This exists
    };

    return unitMap[departmentName.toLowerCase()] || 'ICU';
  }

  /**
   * Helper method to format department name
   */
  private formatDepartmentName(departmentName: string): string {
    return departmentName.charAt(0).toUpperCase() + departmentName.slice(1).replace(/-/g, ' ');
  }

  /**
   * Calculate average occupancy time for a department
   */
  private async calculateAvgOccupancyTime(departmentId: number, tenantId: string): Promise<number> {
    // This would calculate the average length of stay for patients in this department
    // For now, return a mock value
    return 4.2;
  }

  /**
   * Get count of critical patients in a department
   */
  private async getCriticalPatientsCount(departmentId: number, tenantId: string): Promise<number> {
    // This would count patients with critical condition in the department
    // For now, return a mock value
    return 3;
  }
}