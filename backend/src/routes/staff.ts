import { Router, Request, Response } from 'express';
import * as staffService from '../services/staff';

const router = Router();

// Staff Profile Routes
router.get('/staff', async (req: Request, res: Response) => {
  try {
    const filters = {
      department: req.query.department as string,
      status: req.query.status as string,
      search: req.query.search as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
    };

    const staff = await staffService.getStaffProfiles(filters);
    
    res.json({
      success: true,
      data: staff,
      count: staff.length
    });
  } catch (error: any) {
    console.error('Error fetching staff:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch staff profiles',
      message: error.message
    });
  }
});

router.get('/staff/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const staff = await staffService.getStaffProfileById(id);
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        error: 'Staff profile not found'
      });
    }

    res.json({
      success: true,
      data: staff
    });
  } catch (error: any) {
    console.error('Error fetching staff profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch staff profile',
      message: error.message
    });
  }
});

router.post('/staff', async (req: Request, res: Response) => {
  try {
    const profile = await staffService.createStaffProfile(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Staff profile created successfully',
      data: profile
    });
  } catch (error: any) {
    console.error('Error creating staff profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create staff profile',
      message: error.message
    });
  }
});

router.put('/staff/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const profile = await staffService.updateStaffProfile(id, req.body);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Staff profile not found'
      });
    }

    res.json({
      success: true,
      message: 'Staff profile updated successfully',
      data: profile
    });
  } catch (error: any) {
    console.error('Error updating staff profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update staff profile',
      message: error.message
    });
  }
});

router.delete('/staff/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await staffService.deleteStaffProfile(id);
    
    res.json({
      success: true,
      message: 'Staff profile deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting staff profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete staff profile',
      message: error.message
    });
  }
});

// Staff Schedule Routes
router.get('/staff-schedules', async (req: Request, res: Response) => {
  try {
    const filters = {
      staff_id: req.query.staff_id ? parseInt(req.query.staff_id as string) : undefined,
      date: req.query.date as string,
      status: req.query.status as string
    };

    const schedules = await staffService.getStaffSchedules(filters);
    
    res.json({
      success: true,
      data: schedules,
      count: schedules.length
    });
  } catch (error: any) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch schedules',
      message: error.message
    });
  }
});

router.post('/staff-schedules', async (req: Request, res: Response) => {
  try {
    const schedule = await staffService.createStaffSchedule(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Schedule created successfully',
      data: schedule
    });
  } catch (error: any) {
    console.error('Error creating schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create schedule',
      message: error.message
    });
  }
});

router.put('/staff-schedules/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const schedule = await staffService.updateStaffSchedule(id, req.body);
    
    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: 'Schedule not found'
      });
    }

    res.json({
      success: true,
      message: 'Schedule updated successfully',
      data: schedule
    });
  } catch (error: any) {
    console.error('Error updating schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update schedule',
      message: error.message
    });
  }
});

router.get('/staff/:id/schedules', async (req: Request, res: Response) => {
  try {
    const staffId = parseInt(req.params.id);
    const schedules = await staffService.getStaffSchedules({ staff_id: staffId });
    
    res.json({
      success: true,
      data: schedules,
      count: schedules.length
    });
  } catch (error: any) {
    console.error('Error fetching staff schedules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch staff schedules',
      message: error.message
    });
  }
});

// Staff Credentials Routes
router.get('/staff-credentials', async (req: Request, res: Response) => {
  try {
    const staffId = parseInt(req.query.staff_id as string);
    
    if (!staffId) {
      return res.status(400).json({
        success: false,
        error: 'staff_id query parameter is required'
      });
    }

    const credentials = await staffService.getStaffCredentials(staffId);
    
    res.json({
      success: true,
      data: credentials,
      count: credentials.length
    });
  } catch (error: any) {
    console.error('Error fetching credentials:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch credentials',
      message: error.message
    });
  }
});

router.post('/staff-credentials', async (req: Request, res: Response) => {
  try {
    const credential = await staffService.createStaffCredential(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Credential added successfully',
      data: credential
    });
  } catch (error: any) {
    console.error('Error creating credential:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create credential',
      message: error.message
    });
  }
});

router.get('/staff/:id/credentials', async (req: Request, res: Response) => {
  try {
    const staffId = parseInt(req.params.id);
    const credentials = await staffService.getStaffCredentials(staffId);
    
    res.json({
      success: true,
      data: credentials,
      count: credentials.length
    });
  } catch (error: any) {
    console.error('Error fetching staff credentials:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch staff credentials',
      message: error.message
    });
  }
});

// Staff Attendance Routes
router.get('/staff-attendance', async (req: Request, res: Response) => {
  try {
    const filters = {
      staff_id: req.query.staff_id ? parseInt(req.query.staff_id as string) : undefined,
      date: req.query.date as string
    };

    const attendance = await staffService.getStaffAttendance(filters);
    
    res.json({
      success: true,
      data: attendance,
      count: attendance.length
    });
  } catch (error: any) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch attendance',
      message: error.message
    });
  }
});

router.post('/staff-attendance', async (req: Request, res: Response) => {
  try {
    const attendance = await staffService.recordStaffAttendance(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Attendance recorded successfully',
      data: attendance
    });
  } catch (error: any) {
    console.error('Error recording attendance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record attendance',
      message: error.message
    });
  }
});

router.get('/staff/:id/attendance', async (req: Request, res: Response) => {
  try {
    const staffId = parseInt(req.params.id);
    const attendance = await staffService.getStaffAttendance({ staff_id: staffId });
    
    res.json({
      success: true,
      data: attendance,
      count: attendance.length
    });
  } catch (error: any) {
    console.error('Error fetching staff attendance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch staff attendance',
      message: error.message
    });
  }
});

// Staff Performance Routes
router.get('/staff-performance', async (req: Request, res: Response) => {
  try {
    const staffId = parseInt(req.query.staff_id as string);
    
    if (!staffId) {
      return res.status(400).json({
        success: false,
        error: 'staff_id query parameter is required'
      });
    }

    const reviews = await staffService.getStaffPerformanceReviews(staffId);
    
    res.json({
      success: true,
      data: reviews,
      count: reviews.length
    });
  } catch (error: any) {
    console.error('Error fetching performance reviews:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch performance reviews',
      message: error.message
    });
  }
});

router.post('/staff-performance', async (req: Request, res: Response) => {
  try {
    const review = await staffService.createPerformanceReview(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Performance review created successfully',
      data: review
    });
  } catch (error: any) {
    console.error('Error creating performance review:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create performance review',
      message: error.message
    });
  }
});

router.get('/staff/:id/performance', async (req: Request, res: Response) => {
  try {
    const staffId = parseInt(req.params.id);
    const reviews = await staffService.getStaffPerformanceReviews(staffId);
    
    res.json({
      success: true,
      data: reviews,
      count: reviews.length
    });
  } catch (error: any) {
    console.error('Error fetching staff performance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch staff performance',
      message: error.message
    });
  }
});

// Staff Payroll Routes
router.get('/staff-payroll', async (req: Request, res: Response) => {
  try {
    const staffId = parseInt(req.query.staff_id as string);
    
    if (!staffId) {
      return res.status(400).json({
        success: false,
        error: 'staff_id query parameter is required'
      });
    }

    const payroll = await staffService.getStaffPayroll(staffId);
    
    res.json({
      success: true,
      data: payroll,
      count: payroll.length
    });
  } catch (error: any) {
    console.error('Error fetching payroll:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payroll',
      message: error.message
    });
  }
});

router.post('/staff-payroll', async (req: Request, res: Response) => {
  try {
    const payroll = await staffService.createPayrollRecord(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Payroll record created successfully',
      data: payroll
    });
  } catch (error: any) {
    console.error('Error creating payroll record:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payroll record',
      message: error.message
    });
  }
});

router.get('/staff/:id/payroll', async (req: Request, res: Response) => {
  try {
    const staffId = parseInt(req.params.id);
    const payroll = await staffService.getStaffPayroll(staffId);
    
    res.json({
      success: true,
      data: payroll,
      count: payroll.length
    });
  } catch (error: any) {
    console.error('Error fetching staff payroll:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch staff payroll',
      message: error.message
    });
  }
});

export default router;
