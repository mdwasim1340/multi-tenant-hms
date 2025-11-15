import { Router, Request, Response } from 'express';
import * as analyticsService from '../services/analytics';

const router = Router();

// Dashboard Analytics
router.get('/analytics/dashboard', async (req: Request, res: Response) => {
  try {
    const analytics = await analyticsService.getDashboardAnalytics();
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error: any) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard analytics',
      message: error.message
    });
  }
});

// Staff Analytics
router.get('/analytics/staff', async (req: Request, res: Response) => {
  try {
    const filters = {
      department: req.query.department as string,
      start_date: req.query.start_date as string,
      end_date: req.query.end_date as string
    };

    const analytics = await analyticsService.getStaffAnalytics(filters);
    
    res.json({
      success: true,
      data: analytics,
      count: analytics.length
    });
  } catch (error: any) {
    console.error('Error fetching staff analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch staff analytics',
      message: error.message
    });
  }
});

// Staff Trends
router.get('/analytics/staff/trends', async (req: Request, res: Response) => {
  try {
    const filters = {
      start_date: req.query.start_date as string,
      end_date: req.query.end_date as string
    };

    const analytics = await analyticsService.getStaffAnalytics(filters);
    
    // Calculate trends
    const trends = {
      hiring_trend: analytics.map(a => ({
        month: a.month,
        new_hires: a.new_hires
      })),
      employment_type_distribution: analytics.reduce((acc: any, curr) => {
        acc.full_time = (acc.full_time || 0) + curr.full_time_count;
        acc.part_time = (acc.part_time || 0) + curr.part_time_count;
        acc.contract = (acc.contract || 0) + curr.contract_count;
        return acc;
      }, {})
    };
    
    res.json({
      success: true,
      data: trends
    });
  } catch (error: any) {
    console.error('Error fetching staff trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch staff trends',
      message: error.message
    });
  }
});

// Schedule Analytics
router.get('/analytics/schedules', async (req: Request, res: Response) => {
  try {
    const filters = {
      start_date: req.query.start_date as string,
      end_date: req.query.end_date as string
    };

    const analytics = await analyticsService.getScheduleAnalytics(filters);
    
    res.json({
      success: true,
      data: analytics,
      count: analytics.length
    });
  } catch (error: any) {
    console.error('Error fetching schedule analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch schedule analytics',
      message: error.message
    });
  }
});

// Attendance Analytics
router.get('/analytics/attendance', async (req: Request, res: Response) => {
  try {
    const filters = {
      start_date: req.query.start_date as string,
      end_date: req.query.end_date as string
    };

    const analytics = await analyticsService.getAttendanceAnalytics(filters);
    
    res.json({
      success: true,
      data: analytics,
      count: analytics.length
    });
  } catch (error: any) {
    console.error('Error fetching attendance analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch attendance analytics',
      message: error.message
    });
  }
});

// Performance Analytics
router.get('/analytics/performance', async (req: Request, res: Response) => {
  try {
    const filters = {
      start_date: req.query.start_date as string,
      end_date: req.query.end_date as string
    };

    const analytics = await analyticsService.getPerformanceAnalytics(filters);
    
    res.json({
      success: true,
      data: analytics,
      count: analytics.length
    });
  } catch (error: any) {
    console.error('Error fetching performance analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch performance analytics',
      message: error.message
    });
  }
});

// Payroll Analytics
router.get('/analytics/payroll', async (req: Request, res: Response) => {
  try {
    const filters = {
      start_date: req.query.start_date as string,
      end_date: req.query.end_date as string
    };

    const analytics = await analyticsService.getPayrollAnalytics(filters);
    
    res.json({
      success: true,
      data: analytics,
      count: analytics.length
    });
  } catch (error: any) {
    console.error('Error fetching payroll analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payroll analytics',
      message: error.message
    });
  }
});

// Financial Summary
router.get('/analytics/financial', async (req: Request, res: Response) => {
  try {
    const filters = {
      start_date: req.query.start_date as string,
      end_date: req.query.end_date as string
    };

    const payrollAnalytics = await analyticsService.getPayrollAnalytics(filters);
    
    // Calculate financial summary
    const summary = payrollAnalytics.reduce((acc, curr) => ({
      total_payroll: acc.total_payroll + Number(curr.total_net_pay || 0),
      total_overtime: acc.total_overtime + Number(curr.total_overtime_pay || 0),
      total_bonuses: acc.total_bonuses + Number(curr.total_bonuses || 0),
      total_deductions: acc.total_deductions + Number(curr.total_deductions || 0),
      avg_salary: acc.avg_salary + Number(curr.avg_net_pay || 0)
    }), {
      total_payroll: 0,
      total_overtime: 0,
      total_bonuses: 0,
      total_deductions: 0,
      avg_salary: 0
    });
    
    if (payrollAnalytics.length > 0) {
      summary.avg_salary = summary.avg_salary / payrollAnalytics.length;
    }
    
    res.json({
      success: true,
      data: {
        summary,
        monthly_breakdown: payrollAnalytics
      }
    });
  } catch (error: any) {
    console.error('Error fetching financial analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch financial analytics',
      message: error.message
    });
  }
});

// Credentials Expiry
router.get('/analytics/credentials/expiry', async (req: Request, res: Response) => {
  try {
    const filters = {
      expiry_status: req.query.expiry_status as string,
      department: req.query.department as string
    };

    const credentials = await analyticsService.getCredentialsExpiry(filters);
    
    res.json({
      success: true,
      data: credentials,
      count: credentials.length
    });
  } catch (error: any) {
    console.error('Error fetching credentials expiry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch credentials expiry',
      message: error.message
    });
  }
});

// Department Statistics
router.get('/analytics/departments', async (req: Request, res: Response) => {
  try {
    const department = req.query.department as string;
    const statistics = await analyticsService.getDepartmentStatistics(department);
    
    res.json({
      success: true,
      data: statistics,
      count: statistics.length
    });
  } catch (error: any) {
    console.error('Error fetching department statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch department statistics',
      message: error.message
    });
  }
});

// Operational Reports
router.get('/analytics/operational', async (req: Request, res: Response) => {
  try {
    const [
      dashboardData,
      scheduleData,
      attendanceData,
      departmentData
    ] = await Promise.all([
      analyticsService.getDashboardAnalytics(),
      analyticsService.getScheduleAnalytics({ 
        start_date: req.query.start_date as string,
        end_date: req.query.end_date as string
      }),
      analyticsService.getAttendanceAnalytics({
        start_date: req.query.start_date as string,
        end_date: req.query.end_date as string
      }),
      analyticsService.getDepartmentStatistics()
    ]);
    
    res.json({
      success: true,
      data: {
        overview: dashboardData,
        schedules: scheduleData,
        attendance: attendanceData,
        departments: departmentData
      }
    });
  } catch (error: any) {
    console.error('Error fetching operational reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch operational reports',
      message: error.message
    });
  }
});

// Custom Report Generation
router.post('/analytics/custom', async (req: Request, res: Response) => {
  try {
    const reportConfig = req.body;
    
    // Validate report configuration
    if (!reportConfig.metrics || !Array.isArray(reportConfig.metrics)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid report configuration',
        message: 'metrics array is required'
      });
    }
    
    const reportData = await analyticsService.generateCustomReport(reportConfig);
    
    res.json({
      success: true,
      data: reportData,
      config: reportConfig
    });
  } catch (error: any) {
    console.error('Error generating custom report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate custom report',
      message: error.message
    });
  }
});

// Export Analytics Data
router.get('/analytics/export', async (req: Request, res: Response) => {
  try {
    const dataType = req.query.type as string;
    const format = req.query.format as string || 'json';
    
    if (!dataType) {
      return res.status(400).json({
        success: false,
        error: 'Data type is required',
        message: 'Specify type parameter (dashboard, staff, schedule, attendance, performance, payroll, credentials, departments)'
      });
    }
    
    const exportData = await analyticsService.exportAnalyticsData(dataType, format);
    
    res.json({
      success: true,
      export: exportData
    });
  } catch (error: any) {
    console.error('Error exporting analytics data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export analytics data',
      message: error.message
    });
  }
});

// Business Intelligence Dashboard
router.get('/analytics/business-intelligence', async (req: Request, res: Response) => {
  try {
    const [
      dashboard,
      staffTrends,
      performanceData,
      payrollData,
      departmentStats
    ] = await Promise.all([
      analyticsService.getDashboardAnalytics(),
      analyticsService.getStaffAnalytics({
        start_date: req.query.start_date as string,
        end_date: req.query.end_date as string
      }),
      analyticsService.getPerformanceAnalytics({
        start_date: req.query.start_date as string,
        end_date: req.query.end_date as string
      }),
      analyticsService.getPayrollAnalytics({
        start_date: req.query.start_date as string,
        end_date: req.query.end_date as string
      }),
      analyticsService.getDepartmentStatistics()
    ]);
    
    res.json({
      success: true,
      data: {
        overview: dashboard,
        staff_trends: staffTrends,
        performance: performanceData,
        financial: payrollData,
        departments: departmentStats
      }
    });
  } catch (error: any) {
    console.error('Error fetching business intelligence data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch business intelligence data',
      message: error.message
    });
  }
});

export default router;
