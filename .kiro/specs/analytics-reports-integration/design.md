# Design Document

## Overview

This design document outlines the architecture and implementation approach for integrating the Analytics and Reports management system with the backend API. The solution replaces mock data with real-time data from the PostgreSQL database while maintaining multi-tenant isolation, security, and performance.

### Key Design Principles

1. **Multi-Tenant Isolation**: All analytics queries operate within tenant-specific database schemas
2. **Performance First**: Implement caching, query optimization, and pagination for fast response times
3. **Real-Time Data**: Fetch current data from the database with optional caching for frequently accessed metrics
4. **Security**: Enforce authentication, authorization, and tenant validation on all endpoints
5. **Scalability**: Design APIs to handle growing data volumes and concurrent users
6. **Error Resilience**: Graceful error handling with fallbacks and retry mechanisms

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                   Hospital Management System                 │
│                     (Next.js Frontend)                       │
├─────────────────────────────────────────────────────────────┤
│  Analytics Pages:                                            │
│  - Dashboard Analytics    - Patient Analytics                │
│  - Clinical Analytics     - Financial Analytics              │
│  - Operational Reports    - Business Intelligence            │
│  - Custom Reports                                            │
└────────────────┬────────────────────────────────────────────┘
                 │ HTTPS + JWT + X-Tenant-ID
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend API Server                      │
│                   (Node.js + Express)                        │
├─────────────────────────────────────────────────────────────┤
│  Middleware Chain:                                           │
│  1. Auth Middleware (JWT validation)                         │
│  2. Tenant Middleware (schema context)                       │
│  3. Authorization Middleware (permissions)                   │
├─────────────────────────────────────────────────────────────┤
│  Analytics Routes:                                           │
│  - /api/analytics/dashboard                                  │
│  - /api/analytics/patients                                   │
│  - /api/analytics/clinical                                   │
│  - /api/analytics/financial                                  │
│  - /api/analytics/operational                                │
│  - /api/analytics/business-intelligence                      │
│  - /api/analytics/custom-reports                             │
├─────────────────────────────────────────────────────────────┤
│  Analytics Services:                                         │
│  - Dashboard Analytics Service                               │
│  - Patient Analytics Service                                 │
│  - Clinical Analytics Service                                │
│  - Financial Analytics Service                               │
│  - Operational Analytics Service                             │
│  - Report Generation Service                                 │
└────────────────┬────────────────────────────────────────────┘
                 │ SQL Queries with Tenant Schema Context
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                       │
├─────────────────────────────────────────────────────────────┤
│  Public Schema:                                              │
│  - tenants, users, roles                                     │
│                                                              │
│  Tenant Schemas (per hospital):                              │
│  - patients, appointments, medical_records                   │
│  - billing, invoices, payments                               │
│  - staff, departments, equipment                             │
│  - custom_field_values                                       │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Request**: User navigates to analytics page in Hospital Management System
2. **Authentication**: Frontend includes JWT token and X-Tenant-ID header in API request
3. **Validation**: Backend validates JWT, checks tenant exists, sets database schema context
4. **Authorization**: Backend verifies user has permission to access requested analytics
5. **Data Fetch**: Backend executes optimized SQL queries within tenant schema
6. **Aggregation**: Backend calculates metrics, trends, and aggregations
7. **Response**: Backend returns JSON data with analytics results
8. **Rendering**: Frontend displays data in charts, tables, and visualizations

## Components and Interfaces

### Frontend Components

#### 1. Analytics API Client (`lib/api/analytics.ts`)

```typescript
interface AnalyticsClient {
  // Dashboard Analytics
  getDashboardKPIs(): Promise<DashboardKPIs>
  getMonthlyTrends(months: number): Promise<MonthlyTrend[]>
  getDepartmentDistribution(): Promise<DepartmentStats[]>
  getStaffProductivity(): Promise<StaffProductivityMetric[]>
  getPatientFlow(date: string): Promise<PatientFlowData[]>
  getBedOccupancy(): Promise<BedOccupancyData[]>
  
  // Patient Analytics
  getPatientMetrics(): Promise<PatientMetrics>
  getPatientTrends(weeks: number): Promise<PatientTrendData[]>
  getAgeDistribution(): Promise<AgeDistributionData[]>
  
  // Clinical Analytics
  getClinicalMetrics(): Promise<ClinicalMetrics>
  getTreatmentOutcomes(months: number): Promise<TreatmentOutcomeData[]>
  getDepartmentPerformance(): Promise<DepartmentPerformanceData[]>
  
  // Financial Analytics
  getFinancialMetrics(): Promise<FinancialMetrics>
  getRevenueData(months: number): Promise<RevenueData[]>
  getRevenueByDepartment(): Promise<DepartmentRevenueData[]>
  
  // Operational Reports
  getOperationalMetrics(): Promise<OperationalMetrics>
  getOperationalTrends(weeks: number): Promise<OperationalTrendData[]>
  getDepartmentOperations(): Promise<DepartmentOperationsData[]>
  
  // Custom Reports
  createCustomReport(definition: ReportDefinition): Promise<CustomReport>
  runCustomReport(reportId: string, params: ReportParams): Promise<ReportResult>
  getCustomReports(): Promise<CustomReport[]>
  deleteCustomReport(reportId: string): Promise<void>
}
```


#### 2. Analytics Hooks (`hooks/useAnalytics.ts`)

```typescript
// Dashboard Analytics Hook
export function useDashboardAnalytics() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null)
  const [trends, setTrends] = useState<MonthlyTrend[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [kpiData, trendData] = await Promise.all([
        analyticsClient.getDashboardKPIs(),
        analyticsClient.getMonthlyTrends(6)
      ])
      setKpis(kpiData)
      setTrends(trendData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchDashboardData()
  }, [])
  
  return { kpis, trends, loading, error, refetch: fetchDashboardData }
}

// Similar hooks for other analytics modules
export function usePatientAnalytics() { /* ... */ }
export function useClinicalAnalytics() { /* ... */ }
export function useFinancialAnalytics() { /* ... */ }
export function useOperationalAnalytics() { /* ... */ }
```

### Backend Components

#### 1. Analytics Routes (`backend/src/routes/analytics.ts`)

```typescript
// Dashboard Analytics Endpoints
router.get('/dashboard/kpis', authMiddleware, getDashboardKPIs)
router.get('/dashboard/trends', authMiddleware, getMonthlyTrends)
router.get('/dashboard/departments', authMiddleware, getDepartmentDistribution)
router.get('/dashboard/staff-productivity', authMiddleware, getStaffProductivity)
router.get('/dashboard/patient-flow', authMiddleware, getPatientFlow)
router.get('/dashboard/bed-occupancy', authMiddleware, getBedOccupancy)

// Patient Analytics Endpoints
router.get('/patients/metrics', authMiddleware, getPatientMetrics)
router.get('/patients/trends', authMiddleware, getPatientTrends)
router.get('/patients/age-distribution', authMiddleware, getAgeDistribution)

// Clinical Analytics Endpoints
router.get('/clinical/metrics', authMiddleware, getClinicalMetrics)
router.get('/clinical/treatment-outcomes', authMiddleware, getTreatmentOutcomes)
router.get('/clinical/department-performance', authMiddleware, getDepartmentPerformance)

// Financial Analytics Endpoints
router.get('/financial/metrics', authMiddleware, getFinancialMetrics)
router.get('/financial/revenue-data', authMiddleware, getRevenueData)
router.get('/financial/revenue-by-department', authMiddleware, getRevenueByDepartment)

// Operational Analytics Endpoints
router.get('/operational/metrics', authMiddleware, getOperationalMetrics)
router.get('/operational/trends', authMiddleware, getOperationalTrends)
router.get('/operational/department-operations', authMiddleware, getDepartmentOperations)

// Custom Reports Endpoints
router.post('/custom-reports', authMiddleware, createCustomReport)
router.get('/custom-reports', authMiddleware, getCustomReports)
router.get('/custom-reports/:id', authMiddleware, getCustomReport)
router.post('/custom-reports/:id/run', authMiddleware, runCustomReport)
router.delete('/custom-reports/:id', authMiddleware, deleteCustomReport)
router.get('/custom-reports/:id/export', authMiddleware, exportCustomReport)
```

#### 2. Analytics Services

**Dashboard Analytics Service** (`backend/src/services/analytics/dashboard.ts`)

```typescript
export class DashboardAnalyticsService {
  async getKPIs(tenantId: string): Promise<DashboardKPIs> {
    const client = await pool.connect()
    try {
      await client.query(`SET search_path TO "${tenantId}"`)
      
      // Fetch total patients
      const patientsResult = await client.query(`
        SELECT COUNT(*) as total,
               COUNT(*) FILTER (WHERE status = 'active') as active
        FROM patients
      `)
      
      // Fetch appointments
      const appointmentsResult = await client.query(`
        SELECT COUNT(*) as total,
               COUNT(*) FILTER (WHERE status = 'scheduled' AND appointment_date >= CURRENT_DATE) as upcoming
        FROM appointments
      `)
      
      // Fetch revenue (current month)
      const revenueResult = await client.query(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM invoices
        WHERE status = 'paid'
        AND EXTRACT(MONTH FROM paid_at) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM paid_at) = EXTRACT(YEAR FROM CURRENT_DATE)
      `)
      
      // Fetch bed occupancy
      const occupancyResult = await client.query(`
        SELECT 
          COUNT(*) FILTER (WHERE status = 'occupied') as occupied,
          COUNT(*) as total
        FROM beds
      `)
      
      // Calculate changes from previous month
      const previousMonthPatients = await this.getPreviousMonthPatients(client)
      const previousMonthAppointments = await this.getPreviousMonthAppointments(client)
      const previousMonthRevenue = await this.getPreviousMonthRevenue(client)
      
      return {
        total_patients: parseInt(patientsResult.rows[0].total),
        active_patients: parseInt(patientsResult.rows[0].active),
        patient_change: this.calculatePercentageChange(
          parseInt(patientsResult.rows[0].total),
          previousMonthPatients
        ),
        total_appointments: parseInt(appointmentsResult.rows[0].total),
        upcoming_appointments: parseInt(appointmentsResult.rows[0].upcoming),
        appointment_change: this.calculatePercentageChange(
          parseInt(appointmentsResult.rows[0].total),
          previousMonthAppointments
        ),
        revenue: parseFloat(revenueResult.rows[0].total),
        revenue_change: this.calculatePercentageChange(
          parseFloat(revenueResult.rows[0].total),
          previousMonthRevenue
        ),
        occupancy_rate: (parseInt(occupancyResult.rows[0].occupied) / 
                        parseInt(occupancyResult.rows[0].total) * 100).toFixed(1),
        occupancy_change: '+5%' // Calculate from historical data
      }
    } finally {
      client.release()
    }
  }
  
  async getMonthlyTrends(tenantId: string, months: number): Promise<MonthlyTrend[]> {
    const client = await pool.connect()
    try {
      await client.query(`SET search_path TO "${tenantId}"`)
      
      const result = await client.query(`
        WITH monthly_data AS (
          SELECT 
            TO_CHAR(created_at, 'Mon') as month,
            EXTRACT(MONTH FROM created_at) as month_num,
            COUNT(*) as patients
          FROM patients
          WHERE created_at >= CURRENT_DATE - INTERVAL '${months} months'
          GROUP BY TO_CHAR(created_at, 'Mon'), EXTRACT(MONTH FROM created_at)
        ),
        monthly_revenue AS (
          SELECT 
            TO_CHAR(paid_at, 'Mon') as month,
            EXTRACT(MONTH FROM paid_at) as month_num,
            SUM(amount) as revenue
          FROM invoices
          WHERE status = 'paid'
          AND paid_at >= CURRENT_DATE - INTERVAL '${months} months'
          GROUP BY TO_CHAR(paid_at, 'Mon'), EXTRACT(MONTH FROM paid_at)
        )
        SELECT 
          COALESCE(md.month, mr.month) as month,
          COALESCE(md.patients, 0) as patients,
          COALESCE(mr.revenue, 0) as revenue
        FROM monthly_data md
        FULL OUTER JOIN monthly_revenue mr ON md.month_num = mr.month_num
        ORDER BY COALESCE(md.month_num, mr.month_num)
      `)
      
      return result.rows
    } finally {
      client.release()
    }
  }
  
  // Additional methods for other dashboard metrics...
}
```


**Patient Analytics Service** (`backend/src/services/analytics/patients.ts`)

```typescript
export class PatientAnalyticsService {
  async getPatientMetrics(tenantId: string): Promise<PatientMetrics> {
    const client = await pool.connect()
    try {
      await client.query(`SET search_path TO "${tenantId}"`)
      
      // Total active patients
      const activeResult = await client.query(`
        SELECT COUNT(*) as total
        FROM patients
        WHERE status = 'active'
      `)
      
      // New patients this month
      const newPatientsResult = await client.query(`
        SELECT COUNT(*) as total
        FROM patients
        WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
      `)
      
      // Readmission rate
      const readmissionResult = await client.query(`
        SELECT 
          COUNT(DISTINCT patient_id) FILTER (WHERE admission_count > 1) * 100.0 / 
          NULLIF(COUNT(DISTINCT patient_id), 0) as rate
        FROM (
          SELECT patient_id, COUNT(*) as admission_count
          FROM appointments
          WHERE appointment_date >= CURRENT_DATE - INTERVAL '30 days'
          GROUP BY patient_id
        ) subquery
      `)
      
      // Average length of stay
      const losResult = await client.query(`
        SELECT AVG(EXTRACT(DAY FROM discharge_date - admission_date)) as avg_los
        FROM medical_records
        WHERE discharge_date IS NOT NULL
        AND admission_date >= CURRENT_DATE - INTERVAL '30 days'
      `)
      
      return {
        total_active_patients: parseInt(activeResult.rows[0].total),
        new_patients_this_month: parseInt(newPatientsResult.rows[0].total),
        readmission_rate: parseFloat(readmissionResult.rows[0].rate || 0).toFixed(1),
        average_length_of_stay: parseFloat(losResult.rows[0].avg_los || 0).toFixed(1)
      }
    } finally {
      client.release()
    }
  }
  
  async getAgeDistribution(tenantId: string): Promise<AgeDistributionData[]> {
    const client = await pool.connect()
    try {
      await client.query(`SET search_path TO "${tenantId}"`)
      
      const result = await client.query(`
        SELECT 
          CASE 
            WHEN age < 19 THEN '0-18'
            WHEN age BETWEEN 19 AND 35 THEN '19-35'
            WHEN age BETWEEN 36 AND 50 THEN '36-50'
            WHEN age BETWEEN 51 AND 65 THEN '51-65'
            ELSE '65+'
          END as range,
          COUNT(*) as count
        FROM (
          SELECT EXTRACT(YEAR FROM AGE(date_of_birth)) as age
          FROM patients
          WHERE status = 'active'
        ) age_data
        GROUP BY range
        ORDER BY 
          CASE range
            WHEN '0-18' THEN 1
            WHEN '19-35' THEN 2
            WHEN '36-50' THEN 3
            WHEN '51-65' THEN 4
            ELSE 5
          END
      `)
      
      return result.rows
    } finally {
      client.release()
    }
  }
}
```

**Clinical Analytics Service** (`backend/src/services/analytics/clinical.ts`)

```typescript
export class ClinicalAnalyticsService {
  async getClinicalMetrics(tenantId: string): Promise<ClinicalMetrics> {
    const client = await pool.connect()
    try {
      await client.query(`SET search_path TO "${tenantId}"`)
      
      // Treatment success rate
      const successResult = await client.query(`
        SELECT 
          COUNT(*) FILTER (WHERE outcome = 'successful') * 100.0 / 
          NULLIF(COUNT(*), 0) as rate
        FROM medical_records
        WHERE visit_date >= CURRENT_DATE - INTERVAL '30 days'
      `)
      
      // Readmission rate
      const readmissionResult = await client.query(`
        SELECT 
          COUNT(DISTINCT patient_id) FILTER (WHERE visit_count > 1) * 100.0 / 
          NULLIF(COUNT(DISTINCT patient_id), 0) as rate
        FROM (
          SELECT patient_id, COUNT(*) as visit_count
          FROM medical_records
          WHERE visit_date >= CURRENT_DATE - INTERVAL '30 days'
          GROUP BY patient_id
        ) subquery
      `)
      
      // Patient satisfaction (from surveys or ratings)
      const satisfactionResult = await client.query(`
        SELECT AVG(rating) as avg_rating
        FROM patient_feedback
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      `)
      
      // Complication rate
      const complicationResult = await client.query(`
        SELECT 
          COUNT(*) FILTER (WHERE complications IS NOT NULL AND complications != '') * 100.0 / 
          NULLIF(COUNT(*), 0) as rate
        FROM medical_records
        WHERE visit_date >= CURRENT_DATE - INTERVAL '30 days'
      `)
      
      return {
        treatment_success_rate: parseFloat(successResult.rows[0].rate || 0).toFixed(1),
        readmission_rate: parseFloat(readmissionResult.rows[0].rate || 0).toFixed(1),
        patient_satisfaction: parseFloat(satisfactionResult.rows[0].avg_rating || 0).toFixed(2),
        complication_rate: parseFloat(complicationResult.rows[0].rate || 0).toFixed(1)
      }
    } finally {
      client.release()
    }
  }
  
  async getTreatmentOutcomes(tenantId: string, months: number): Promise<TreatmentOutcomeData[]> {
    const client = await pool.connect()
    try {
      await client.query(`SET search_path TO "${tenantId}"`)
      
      const result = await client.query(`
        SELECT 
          TO_CHAR(visit_date, 'Mon') as month,
          COUNT(*) FILTER (WHERE outcome = 'successful') * 100.0 / NULLIF(COUNT(*), 0) as successful,
          COUNT(*) FILTER (WHERE outcome = 'partial') * 100.0 / NULLIF(COUNT(*), 0) as partial,
          COUNT(*) FILTER (WHERE outcome = 'unsuccessful') * 100.0 / NULLIF(COUNT(*), 0) as unsuccessful
        FROM medical_records
        WHERE visit_date >= CURRENT_DATE - INTERVAL '${months} months'
        GROUP BY TO_CHAR(visit_date, 'Mon'), EXTRACT(MONTH FROM visit_date)
        ORDER BY EXTRACT(MONTH FROM visit_date)
      `)
      
      return result.rows
    } finally {
      client.release()
    }
  }
}
```

**Financial Analytics Service** (`backend/src/services/analytics/financial.ts`)

```typescript
export class FinancialAnalyticsService {
  async getFinancialMetrics(tenantId: string): Promise<FinancialMetrics> {
    const client = await pool.connect()
    try {
      await client.query(`SET search_path TO "${tenantId}"`)
      
      // Year-to-date revenue
      const revenueResult = await client.query(`
        SELECT SUM(amount) as total
        FROM invoices
        WHERE status = 'paid'
        AND EXTRACT(YEAR FROM paid_at) = EXTRACT(YEAR FROM CURRENT_DATE)
      `)
      
      // Year-to-date expenses (if expense tracking exists)
      const expensesResult = await client.query(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM expenses
        WHERE EXTRACT(YEAR FROM expense_date) = EXTRACT(YEAR FROM CURRENT_DATE)
      `)
      
      const revenue = parseFloat(revenueResult.rows[0].total || 0)
      const expenses = parseFloat(expensesResult.rows[0].total || 0)
      const profit = revenue - expenses
      const profitMargin = revenue > 0 ? (profit / revenue * 100).toFixed(1) : '0.0'
      
      return {
        total_revenue_ytd: revenue,
        total_expenses_ytd: expenses,
        net_profit_ytd: profit,
        profit_margin: profitMargin
      }
    } finally {
      client.release()
    }
  }
  
  async getRevenueByDepartment(tenantId: string): Promise<DepartmentRevenueData[]> {
    const client = await pool.connect()
    try {
      await client.query(`SET search_path TO "${tenantId}"`)
      
      const result = await client.query(`
        SELECT 
          d.name as department,
          SUM(i.amount) as revenue
        FROM invoices i
        JOIN appointments a ON i.appointment_id = a.id
        JOIN departments d ON a.department_id = d.id
        WHERE i.status = 'paid'
        AND i.paid_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY d.name
        ORDER BY revenue DESC
      `)
      
      return result.rows
    } finally {
      client.release()
    }
  }
}
```


**Operational Analytics Service** (`backend/src/services/analytics/operational.ts`)

```typescript
export class OperationalAnalyticsService {
  async getOperationalMetrics(tenantId: string): Promise<OperationalMetrics> {
    const client = await pool.connect()
    try {
      await client.query(`SET search_path TO "${tenantId}"`)
      
      // Bed occupancy rate
      const occupancyResult = await client.query(`
        SELECT 
          COUNT(*) FILTER (WHERE status = 'occupied') * 100.0 / 
          NULLIF(COUNT(*), 0) as rate
        FROM beds
      `)
      
      // Staff utilization (appointments per staff member)
      const staffUtilResult = await client.query(`
        SELECT 
          COUNT(a.id) * 100.0 / 
          (SELECT COUNT(*) * 8 FROM users WHERE role = 'doctor') as utilization
        FROM appointments a
        WHERE a.appointment_date >= CURRENT_DATE - INTERVAL '7 days'
      `)
      
      // Equipment uptime (if equipment tracking exists)
      const equipmentResult = await client.query(`
        SELECT 
          COUNT(*) FILTER (WHERE status = 'operational') * 100.0 / 
          NULLIF(COUNT(*), 0) as uptime
        FROM equipment
      `)
      
      // Average wait time
      const waitTimeResult = await client.query(`
        SELECT AVG(wait_time_minutes) as avg_wait
        FROM appointments
        WHERE appointment_date >= CURRENT_DATE - INTERVAL '7 days'
        AND wait_time_minutes IS NOT NULL
      `)
      
      return {
        bed_occupancy_rate: parseFloat(occupancyResult.rows[0].rate || 0).toFixed(1),
        staff_utilization: parseFloat(staffUtilResult.rows[0].utilization || 0).toFixed(1),
        equipment_uptime: parseFloat(equipmentResult.rows[0].uptime || 0).toFixed(1),
        average_wait_time: parseFloat(waitTimeResult.rows[0].avg_wait || 0).toFixed(1)
      }
    } finally {
      client.release()
    }
  }
  
  async getDepartmentOperations(tenantId: string): Promise<DepartmentOperationsData[]> {
    const client = await pool.connect()
    try {
      await client.query(`SET search_path TO "${tenantId}"`)
      
      const result = await client.query(`
        SELECT 
          d.name as department,
          AVG(a.wait_time_minutes) as avg_wait_time,
          COUNT(a.id) as throughput,
          COUNT(a.id) * 100.0 / 
            (SELECT COUNT(*) FROM appointments WHERE department_id = d.id) as efficiency
        FROM departments d
        LEFT JOIN appointments a ON d.id = a.department_id
        WHERE a.appointment_date >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY d.id, d.name
        ORDER BY throughput DESC
      `)
      
      return result.rows
    } finally {
      client.release()
    }
  }
}
```

## Data Models

### Dashboard Analytics Models

```typescript
interface DashboardKPIs {
  total_patients: number
  active_patients: number
  patient_change: string  // e.g., "+12%"
  total_appointments: number
  upcoming_appointments: number
  appointment_change: string
  revenue: number
  revenue_change: string
  occupancy_rate: string
  occupancy_change: string
}

interface MonthlyTrend {
  month: string  // e.g., "Jan", "Feb"
  patients: number
  revenue: number
}

interface DepartmentStats {
  name: string
  value: number  // percentage
}

interface StaffProductivityMetric {
  department: string
  productivity: number  // percentage
  satisfaction: number  // rating out of 5
  patients: number
}

interface PatientFlowData {
  hour: string  // e.g., "08:00"
  arrivals: number
  departures: number
  waitTime: number  // minutes
}

interface BedOccupancyData {
  ward: string
  occupied: number
  total: number
  rate: number  // percentage
}
```

### Patient Analytics Models

```typescript
interface PatientMetrics {
  total_active_patients: number
  new_patients_this_month: number
  readmission_rate: string
  average_length_of_stay: string
}

interface PatientTrendData {
  week: string
  newPatients: number
  returning: number
  discharged: number
}

interface AgeDistributionData {
  range: string  // e.g., "0-18", "19-35"
  count: number
}
```

### Clinical Analytics Models

```typescript
interface ClinicalMetrics {
  treatment_success_rate: string
  readmission_rate: string
  patient_satisfaction: string
  complication_rate: string
}

interface TreatmentOutcomeData {
  month: string
  successful: number  // percentage
  partial: number
  unsuccessful: number
}

interface DepartmentPerformanceData {
  department: string
  avgLOS: number  // average length of stay in days
  readmission: number  // percentage
  satisfaction: number  // rating out of 5
}
```

### Financial Analytics Models

```typescript
interface FinancialMetrics {
  total_revenue_ytd: number
  total_expenses_ytd: number
  net_profit_ytd: number
  profit_margin: string
}

interface RevenueData {
  month: string
  revenue: number
  expenses: number
  profit: number
}

interface DepartmentRevenueData {
  name: string
  value: number  // revenue amount
}
```

### Operational Analytics Models

```typescript
interface OperationalMetrics {
  bed_occupancy_rate: string
  staff_utilization: string
  equipment_uptime: string
  average_wait_time: string
}

interface OperationalTrendData {
  week: string
  occupancy: number  // percentage
  staffUtilization: number
  equipmentUptime: number
}

interface DepartmentOperationsData {
  department: string
  avgWaitTime: number  // minutes
  throughput: number  // number of patients
  efficiency: number  // percentage
}
```

### Custom Reports Models

```typescript
interface ReportDefinition {
  name: string
  description: string
  data_sources: string[]  // e.g., ["patients", "appointments"]
  filters: ReportFilter[]
  columns: ReportColumn[]
  aggregations: ReportAggregation[]
}

interface ReportFilter {
  field: string
  operator: string  // e.g., "equals", "greater_than", "between"
  value: any
}

interface ReportColumn {
  field: string
  label: string
  type: string  // e.g., "string", "number", "date"
}

interface ReportAggregation {
  field: string
  function: string  // e.g., "sum", "avg", "count"
  label: string
}

interface CustomReport {
  id: string
  tenant_id: string
  name: string
  description: string
  definition: ReportDefinition
  created_at: string
  updated_at: string
}

interface ReportResult {
  columns: ReportColumn[]
  rows: any[]
  total_rows: number
  generated_at: string
}
```

## Error Handling

### Error Response Format

```typescript
interface ErrorResponse {
  error: string  // Human-readable error message
  code: string  // Error code for programmatic handling
  details?: any  // Additional error details
  timestamp: string
}
```

### Common Error Scenarios

1. **Authentication Errors**
   - Missing JWT token → 401 Unauthorized
   - Invalid JWT token → 401 Unauthorized
   - Expired JWT token → 401 Unauthorized

2. **Authorization Errors**
   - Missing X-Tenant-ID header → 400 Bad Request
   - Invalid tenant ID → 404 Not Found
   - User lacks permission → 403 Forbidden

3. **Data Errors**
   - No data available → Return empty arrays with success status
   - Invalid query parameters → 400 Bad Request
   - Database query errors → 500 Internal Server Error

4. **Performance Errors**
   - Query timeout → 504 Gateway Timeout
   - Rate limit exceeded → 429 Too Many Requests

### Frontend Error Handling

```typescript
try {
  const data = await analyticsClient.getDashboardKPIs()
  setKpis(data)
} catch (error) {
  if (error.code === 'UNAUTHORIZED') {
    // Redirect to login
    router.push('/auth/login')
  } else if (error.code === 'FORBIDDEN') {
    // Show permission error
    setError('You do not have permission to view this data')
  } else if (error.code === 'NETWORK_ERROR') {
    // Show retry option
    setError('Network error. Please try again.')
  } else {
    // Generic error
    setError('Failed to load analytics data')
  }
}
```


## Testing Strategy

### Unit Tests

1. **Service Layer Tests**
   - Test each analytics service method with mock database responses
   - Verify correct SQL queries are generated
   - Test calculation logic for metrics and percentages
   - Test error handling for database failures

2. **API Route Tests**
   - Test authentication and authorization middleware
   - Test tenant validation and schema context setting
   - Test response formatting and error handling
   - Test query parameter validation

### Integration Tests

1. **End-to-End Analytics Flow**
   - Create test tenant with sample data
   - Call analytics endpoints and verify responses
   - Test multi-tenant isolation (verify tenant A cannot see tenant B's data)
   - Test data consistency across related endpoints

2. **Performance Tests**
   - Test response times for analytics queries
   - Test with large datasets (1000+ patients, 10000+ appointments)
   - Test concurrent requests from multiple users
   - Test caching effectiveness

### Frontend Tests

1. **Component Tests**
   - Test analytics pages render correctly with data
   - Test loading states and error states
   - Test chart rendering with various data shapes
   - Test user interactions (filters, exports, refresh)

2. **Hook Tests**
   - Test custom hooks fetch data correctly
   - Test error handling in hooks
   - Test refetch functionality
   - Test loading state management

### Test Data Setup

```sql
-- Create test tenant schema
CREATE SCHEMA IF NOT EXISTS test_tenant_123;
SET search_path TO test_tenant_123;

-- Insert test patients
INSERT INTO patients (patient_number, first_name, last_name, date_of_birth, status)
VALUES 
  ('P001', 'John', 'Doe', '1985-01-15', 'active'),
  ('P002', 'Jane', 'Smith', '1990-05-20', 'active'),
  ('P003', 'Bob', 'Johnson', '1975-08-10', 'active');

-- Insert test appointments
INSERT INTO appointments (patient_id, doctor_id, appointment_date, status)
VALUES 
  (1, 1, CURRENT_DATE, 'scheduled'),
  (2, 1, CURRENT_DATE + INTERVAL '1 day', 'scheduled'),
  (3, 2, CURRENT_DATE + INTERVAL '2 days', 'scheduled');

-- Insert test invoices
INSERT INTO invoices (invoice_number, tenant_id, amount, status, paid_at)
VALUES 
  ('INV001', 'test_tenant_123', 5000, 'paid', CURRENT_DATE),
  ('INV002', 'test_tenant_123', 7500, 'paid', CURRENT_DATE - INTERVAL '1 month');
```

## Performance Optimization

### Database Optimization

1. **Indexes**
   ```sql
   -- Patient analytics indexes
   CREATE INDEX idx_patients_status ON patients(status);
   CREATE INDEX idx_patients_created_at ON patients(created_at);
   CREATE INDEX idx_patients_date_of_birth ON patients(date_of_birth);
   
   -- Appointment analytics indexes
   CREATE INDEX idx_appointments_date ON appointments(appointment_date);
   CREATE INDEX idx_appointments_status ON appointments(status);
   CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
   
   -- Financial analytics indexes
   CREATE INDEX idx_invoices_status_paid_at ON invoices(status, paid_at);
   CREATE INDEX idx_invoices_tenant_id ON invoices(tenant_id);
   
   -- Medical records indexes
   CREATE INDEX idx_medical_records_visit_date ON medical_records(visit_date);
   CREATE INDEX idx_medical_records_patient_id ON medical_records(patient_id);
   ```

2. **Query Optimization**
   - Use `EXPLAIN ANALYZE` to identify slow queries
   - Avoid N+1 queries by using JOINs
   - Use CTEs (Common Table Expressions) for complex queries
   - Limit result sets with pagination

3. **Materialized Views** (for frequently accessed aggregations)
   ```sql
   CREATE MATERIALIZED VIEW daily_analytics AS
   SELECT 
     CURRENT_DATE as date,
     COUNT(*) as total_patients,
     COUNT(*) FILTER (WHERE status = 'active') as active_patients,
     (SELECT COUNT(*) FROM appointments WHERE appointment_date = CURRENT_DATE) as appointments_today
   FROM patients;
   
   -- Refresh daily
   REFRESH MATERIALIZED VIEW daily_analytics;
   ```

### Caching Strategy

1. **Redis Caching** (for frequently accessed metrics)
   ```typescript
   async getDashboardKPIs(tenantId: string): Promise<DashboardKPIs> {
     const cacheKey = `analytics:dashboard:kpis:${tenantId}`
     
     // Try cache first
     const cached = await redis.get(cacheKey)
     if (cached) {
       return JSON.parse(cached)
     }
     
     // Fetch from database
     const kpis = await this.fetchKPIsFromDatabase(tenantId)
     
     // Cache for 5 minutes
     await redis.setex(cacheKey, 300, JSON.stringify(kpis))
     
     return kpis
   }
   ```

2. **Cache Invalidation**
   - Invalidate cache when relevant data changes
   - Use TTL (Time To Live) for automatic expiration
   - Provide manual refresh option in frontend

3. **Frontend Caching**
   - Use React Query or SWR for client-side caching
   - Cache analytics data for 5-10 minutes
   - Implement stale-while-revalidate pattern

### Pagination

```typescript
interface PaginationParams {
  page: number
  limit: number
}

interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

async getPatientList(
  tenantId: string, 
  params: PaginationParams
): Promise<PaginatedResponse<Patient>> {
  const offset = (params.page - 1) * params.limit
  
  const [dataResult, countResult] = await Promise.all([
    client.query(`
      SELECT * FROM patients
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `, [params.limit, offset]),
    client.query('SELECT COUNT(*) FROM patients')
  ])
  
  return {
    data: dataResult.rows,
    pagination: {
      page: params.page,
      limit: params.limit,
      total: parseInt(countResult.rows[0].count),
      pages: Math.ceil(parseInt(countResult.rows[0].count) / params.limit)
    }
  }
}
```

## Security Considerations

### Authentication and Authorization

1. **JWT Validation**
   - Verify JWT signature using JWKS from AWS Cognito
   - Check token expiration
   - Extract user information from token claims

2. **Tenant Validation**
   - Verify tenant exists and is active
   - Ensure user belongs to the tenant
   - Set database schema context before queries

3. **Permission Checks**
   - Verify user has permission to access analytics
   - Check role-based permissions for sensitive data
   - Log access attempts for audit trail

### Data Protection

1. **SQL Injection Prevention**
   - Always use parameterized queries
   - Never concatenate user input into SQL strings
   - Validate and sanitize all input parameters

2. **Sensitive Data Handling**
   - Mask or redact sensitive patient information in analytics
   - Implement field-level permissions for financial data
   - Encrypt data in transit (HTTPS) and at rest

3. **Rate Limiting**
   ```typescript
   import rateLimit from 'express-rate-limit'
   
   const analyticsLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100, // limit each IP to 100 requests per windowMs
     message: 'Too many analytics requests, please try again later'
   })
   
   router.use('/analytics', analyticsLimiter)
   ```

### Audit Logging

```typescript
async logAnalyticsAccess(
  userId: string,
  tenantId: string,
  endpoint: string,
  params: any
) {
  await pool.query(`
    INSERT INTO audit_logs (user_id, tenant_id, action, resource, params, timestamp)
    VALUES ($1, $2, 'VIEW_ANALYTICS', $3, $4, CURRENT_TIMESTAMP)
  `, [userId, tenantId, endpoint, JSON.stringify(params)])
}
```

## Deployment Considerations

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/hospital_db

# Redis (for caching)
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-jwt-secret
COGNITO_USER_POOL_ID=your-pool-id
COGNITO_REGION=us-east-1

# Analytics
ANALYTICS_CACHE_TTL=300  # 5 minutes
ANALYTICS_MAX_RESULTS=1000
ANALYTICS_QUERY_TIMEOUT=30000  # 30 seconds
```

### Monitoring and Alerting

1. **Performance Monitoring**
   - Track API response times
   - Monitor database query performance
   - Alert on slow queries (> 5 seconds)

2. **Error Monitoring**
   - Log all errors with context
   - Alert on error rate spikes
   - Track error types and frequencies

3. **Usage Monitoring**
   - Track analytics endpoint usage
   - Monitor cache hit rates
   - Track most accessed analytics pages

### Scalability

1. **Database Scaling**
   - Use read replicas for analytics queries
   - Implement connection pooling
   - Consider database sharding for large tenants

2. **API Scaling**
   - Deploy multiple API instances behind load balancer
   - Use horizontal scaling for increased load
   - Implement circuit breakers for database failures

3. **Caching Scaling**
   - Use Redis cluster for distributed caching
   - Implement cache warming for frequently accessed data
   - Use CDN for static analytics assets

## Migration Plan

### Phase 1: Backend API Development (Week 1-2)
1. Create analytics service classes
2. Implement database queries with proper indexes
3. Create API routes with authentication/authorization
4. Write unit tests for services
5. Test with Postman/curl

### Phase 2: Frontend Integration (Week 3)
1. Create analytics API client
2. Implement custom hooks for data fetching
3. Update analytics pages to use real data
4. Remove mock data
5. Test with real backend

### Phase 3: Testing and Optimization (Week 4)
1. Run integration tests
2. Perform load testing
3. Optimize slow queries
4. Implement caching
5. Fix bugs and issues

### Phase 4: Deployment (Week 5)
1. Deploy to staging environment
2. Conduct user acceptance testing
3. Deploy to production
4. Monitor performance and errors
5. Gather user feedback

## Success Metrics

1. **Performance**
   - Analytics pages load in < 2 seconds
   - API response times < 500ms for 95th percentile
   - Cache hit rate > 70%

2. **Reliability**
   - 99.9% uptime for analytics endpoints
   - Error rate < 0.1%
   - Zero data leakage incidents

3. **User Satisfaction**
   - Positive user feedback on analytics accuracy
   - Increased usage of analytics features
   - Reduced support tickets related to analytics

4. **Data Accuracy**
   - 100% match between analytics and source data
   - Real-time data updates within 5 minutes
   - Consistent metrics across all analytics pages
