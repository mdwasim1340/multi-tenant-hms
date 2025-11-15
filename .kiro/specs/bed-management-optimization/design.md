# Design Document: Intelligent Bed Management & Patient Flow Optimization

## Overview

This document outlines the technical design for implementing an AI-powered Intelligent Bed Management & Patient Flow Optimization system. The system provides length of stay prediction, optimal bed assignment, discharge readiness prediction, ED-to-ward transfer optimization, and capacity forecasting within a multi-tenant hospital management environment.

**Design Goals:**
- Achieve LOS prediction accuracy within ±1 day for 70% of cases
- Process bed recommendations within 2 seconds
- Reduce ED boarding time by 30%
- Improve bed utilization by 25-35%
- Forecast capacity 24-72 hours ahead with >80% accuracy
- Support 200+ concurrent bed management requests
- Maintain complete tenant data isolation

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Bed Status  │  │  Capacity    │  │  Discharge   │         │
│  │  Dashboard   │  │  Forecast    │  │  Planning    │         │
│  │              │  │  Dashboard   │  │  Dashboard   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Auth Middleware │ Tenant Middleware │ Rate Limiting     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Application Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  LOS         │  │  Bed         │  │  Discharge   │         │
│  │  Prediction  │  │  Assignment  │  │  Readiness   │         │
│  │  Service     │  │  Optimizer   │  │  Predictor   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Transfer    │  │  Capacity    │  │  AI Feature  │         │
│  │  Optimizer   │  │  Forecaster  │  │  Manager     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ML Model Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  LOS         │  │  Discharge   │  │  Capacity    │         │
│  │  Predictor   │  │  Predictor   │  │  Forecaster  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Data Layer                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  PostgreSQL  │  │    Redis     │  │   S3 Model   │         │
│  │  (Tenant DB) │  │   (Cache)    │  │   Storage    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

**Bed Assignment Flow:**
1. Bed request submitted → API Gateway
2. Auth/Tenant middleware validates request
3. AI Feature Manager checks if bed optimization is enabled
4. Bed Assignment Optimizer retrieves patient requirements
5. Queries available beds with required features
6. Scores each bed based on multiple factors
7. Returns top 3 recommendations with reasoning
8. Logs assignment decision

**LOS Prediction Flow:**
1. Patient admitted → Trigger LOS prediction
2. LOS Prediction Service retrieves patient data
3. ML Model processes diagnosis, severity, demographics
4. Calculates predicted LOS with confidence interval
5. Stores prediction in database
6. Updates prediction daily as condition changes
7. Tracks actual LOS vs. predicted for accuracy metrics

**Capacity Forecasting Flow:**
1. Scheduled job runs every 6 hours
2. Capacity Forecaster retrieves current census
3. Analyzes historical admission patterns
4. Considers seasonal factors and day-of-week
5. Predicts admissions for next 24-72 hours
6. Calculates bed availability by unit
7. Generates staffing recommendations
8. Alerts if surge capacity needed

## Components and Interfaces

### 1. LOS Prediction Service

**Responsibilities:**
- Predict patient length of stay
- Update predictions daily
- Track prediction accuracy
- Provide confidence intervals

**Key Methods:**
```typescript
predictLOS(patientData: PatientAdmission): Promise<LOSPrediction>
updatePrediction(admissionId: string): Promise<LOSPrediction>
getPredictionHistory(admissionId: string): Promise<LOSPrediction[]>
getAccuracyMetrics(dateRange: DateRange): Promise<AccuracyMetrics>
```

### 2. Bed Assignment Optimizer Service

**Responsibilities:**
- Recommend optimal bed assignments
- Enforce infection control requirements
- Consider patient needs and unit capacity
- Score bed options

**Key Methods:**
```typescript
recommendBeds(patientRequirements: BedRequirements): Promise<BedRecommendation[]>
scoreBed(bedId: string, patientRequirements: BedRequirements): Promise<number>
checkIsolationRequirements(patientId: string): Promise<IsolationRequirement>
assignBed(patientId: string, bedId: string, assignedBy: string): Promise<void>
```

### 3. Discharge Readiness Predictor Service

**Responsibilities:**
- Predict discharge readiness timing
- Identify discharge barriers
- Suggest interventions
- Track discharge planning progress

**Key Methods:**
```typescript
predictDischargeReadiness(patientId: string): Promise<DischargeReadiness>
identifyBarriers(patientId: string): Promise<DischargeBarrier[]>
suggestInterventions(barriers: DischargeBarrier[]): Promise<Intervention[]>
trackDischargeProgress(patientId: string): Promise<DischargeProgress>
```

### 4. Transfer Optimizer Service

**Responsibilities:**
- Prioritize ED patients for transfer
- Predict bed availability timing
- Optimize transfer scheduling
- Minimize ED boarding time

**Key Methods:**
```typescript
prioritizeEDPatients(edPatients: EDPatient[]): Promise<TransferPriority[]>
predictBedAvailability(unit: string, hours: number): Promise<BedAvailability>
optimizeTransferTiming(patientId: string): Promise<TransferRecommendation>
notifyReceivingUnit(transfer: Transfer): Promise<void>
```

### 5. Capacity Forecaster Service

**Responsibilities:**
- Forecast bed demand 24-72 hours ahead
- Recognize seasonal patterns
- Recommend staffing levels
- Alert for surge capacity needs

**Key Methods:**
```typescript
forecastCapacity(unit: string, hours: number): Promise<CapacityForecast>
recognizePatterns(historicalData: CensusData[]): Promise<Pattern[]>
recommendStaffing(forecast: CapacityForecast): Promise<StaffingRecommendation>
assessSurgeNeed(forecast: CapacityForecast): Promise<SurgeAssessment>
```

### 6. Bed Status Tracker Service

**Responsibilities:**
- Track real-time bed status
- Monitor bed turnover times
- Coordinate with housekeeping
- Alert on delays

**Key Methods:**
```typescript
getBedStatus(unit: string): Promise<BedStatus[]>
updateBedStatus(bedId: string, status: BedStatusType): Promise<void>
trackTurnoverTime(bedId: string): Promise<TurnoverMetrics>
alertOnDelay(bedId: string, targetTime: number): Promise<void>
```

## Data Models

### Database Schema

#### los_predictions (tenant-specific)
```sql
CREATE TABLE los_predictions (
  id SERIAL PRIMARY KEY,
  admission_id INTEGER NOT NULL REFERENCES admissions(id),
  patient_id INTEGER NOT NULL REFERENCES patients(id),
  diagnosis VARCHAR(255),
  severity_score INTEGER,
  age INTEGER,
  comorbidities TEXT[],
  admission_source VARCHAR(50), -- 'ED', 'transfer', 'elective'
  predicted_los_days DECIMAL(4,1),
  confidence_interval_lower DECIMAL(4,1),
  confidence_interval_upper DECIMAL(4,1),
  predicted_discharge_date DATE,
  actual_los_days DECIMAL(4,1),
  actual_discharge_date DATE,
  prediction_error DECIMAL(4,1),
  predicted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_los_predictions_admission ON los_predictions(admission_id);
CREATE INDEX idx_los_predictions_patient ON los_predictions(patient_id);
CREATE INDEX idx_los_predictions_date ON los_predictions(predicted_discharge_date);
```

#### bed_assignments (tenant-specific)
```sql
CREATE TABLE bed_assignments (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id),
  bed_id INTEGER NOT NULL REFERENCES beds(id),
  unit VARCHAR(100) NOT NULL,
  room VARCHAR(50),
  assignment_score INTEGER, -- 0-100
  assignment_reasoning JSONB,
  isolation_required BOOLEAN DEFAULT false,
  isolation_type VARCHAR(50), -- 'contact', 'droplet', 'airborne'
  special_requirements TEXT[],
  assigned_by INTEGER REFERENCES public.users(id),
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  discharged_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bed_assignments_patient ON bed_assignments(patient_id);
CREATE INDEX idx_bed_assignments_bed ON bed_assignments(bed_id);
CREATE INDEX idx_bed_assignments_unit ON bed_assignments(unit);
CREATE INDEX idx_bed_assignments_active ON bed_assignments(discharged_at) WHERE discharged_at IS NULL;
```

#### discharge_readiness_predictions (tenant-specific)
```sql
CREATE TABLE discharge_readiness_predictions (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id),
  admission_id INTEGER NOT NULL REFERENCES admissions(id),
  predicted_ready_date DATE,
  predicted_ready_hours INTEGER, -- Hours from now
  medical_readiness_score INTEGER, -- 0-100
  social_readiness_score INTEGER, -- 0-100
  barriers JSONB, -- Array of {type, description, severity}
  recommended_interventions JSONB,
  actual_discharge_date DATE,
  discharge_delay_hours INTEGER,
  predicted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_discharge_predictions_patient ON discharge_readiness_predictions(patient_id);
CREATE INDEX idx_discharge_predictions_ready_date ON discharge_readiness_predictions(predicted_ready_date);
```

#### transfer_priorities (tenant-specific)
```sql
CREATE TABLE transfer_priorities (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id),
  current_location VARCHAR(100) NOT NULL, -- 'ED', 'ICU', etc.
  target_unit VARCHAR(100) NOT NULL,
  priority_score INTEGER NOT NULL, -- 0-100
  acuity_level INTEGER,
  wait_time_hours DECIMAL(4,1),
  predicted_bed_available_at TIMESTAMP,
  transfer_urgency VARCHAR(20), -- 'immediate', 'urgent', 'routine'
  transfer_completed BOOLEAN DEFAULT false,
  transfer_completed_at TIMESTAMP,
  calculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transfer_priorities_patient ON transfer_priorities(patient_id);
CREATE INDEX idx_transfer_priorities_location ON transfer_priorities(current_location);
CREATE INDEX idx_transfer_priorities_score ON transfer_priorities(priority_score DESC);
CREATE INDEX idx_transfer_priorities_pending ON transfer_priorities(transfer_completed) WHERE transfer_completed = false;
```

#### capacity_forecasts (tenant-specific)
```sql
CREATE TABLE capacity_forecasts (
  id SERIAL PRIMARY KEY,
  unit VARCHAR(100) NOT NULL,
  forecast_date DATE NOT NULL,
  forecast_hour INTEGER, -- 0-23
  predicted_census INTEGER,
  predicted_admissions INTEGER,
  predicted_discharges INTEGER,
  available_beds INTEGER,
  utilization_percentage DECIMAL(5,2),
  surge_capacity_needed BOOLEAN DEFAULT false,
  recommended_staffing JSONB,
  confidence_score DECIMAL(3,2),
  forecast_horizon_hours INTEGER, -- 24, 48, 72
  forecasted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(unit, forecast_date, forecast_hour, forecast_horizon_hours)
);

CREATE INDEX idx_capacity_forecasts_unit_date ON capacity_forecasts(unit, forecast_date);
CREATE INDEX idx_capacity_forecasts_surge ON capacity_forecasts(surge_capacity_needed) WHERE surge_capacity_needed = true;
```

#### bed_turnover_metrics (tenant-specific)
```sql
CREATE TABLE bed_turnover_metrics (
  id SERIAL PRIMARY KEY,
  bed_id INTEGER NOT NULL REFERENCES beds(id),
  unit VARCHAR(100) NOT NULL,
  patient_discharged_at TIMESTAMP NOT NULL,
  cleaning_started_at TIMESTAMP,
  cleaning_completed_at TIMESTAMP,
  bed_available_at TIMESTAMP,
  turnover_time_minutes INTEGER,
  target_turnover_minutes INTEGER,
  exceeded_target BOOLEAN,
  priority_cleaning BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bed_turnover_bed ON bed_turnover_metrics(bed_id);
CREATE INDEX idx_bed_turnover_unit ON bed_turnover_metrics(unit);
CREATE INDEX idx_bed_turnover_date ON bed_turnover_metrics(patient_discharged_at);
```

#### bed_management_performance (tenant-specific)
```sql
CREATE TABLE bed_management_performance (
  id SERIAL PRIMARY KEY,
  metric_type VARCHAR(50) NOT NULL, -- 'los_accuracy', 'bed_utilization', 'ed_boarding', 'capacity_forecast'
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL(10,4),
  sample_size INTEGER,
  calculation_period VARCHAR(20), -- 'daily', 'weekly', 'monthly'
  calculation_date DATE NOT NULL,
  unit VARCHAR(100),
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bed_performance_type ON bed_management_performance(metric_type);
CREATE INDEX idx_bed_performance_date ON bed_management_performance(calculation_date);
CREATE INDEX idx_bed_performance_unit ON bed_management_performance(unit);
```

### TypeScript Interfaces

```typescript
// LOS Prediction
interface PatientAdmission {
  admissionId: string;
  patientId: string;
  diagnosis: string;
  severityScore: number;
  age: number;
  comorbidities: string[];
  admissionSource: 'ED' | 'transfer' | 'elective';
}

interface LOSPrediction {
  admissionId: string;
  predictedLOSDays: number;
  confidenceInterval: { lower: number; upper: number };
  predictedDischargeDate: string;
  confidence: number;
  factors: Factor[];
}

// Bed Assignment
interface BedRequirements {
  patientId: string;
  requiredFeatures: string[]; // ['isolation', 'telemetry', 'oxygen']
  isolationType?: 'contact' | 'droplet' | 'airborne';
  acuityLevel: number;
  preferredUnit?: string;
  urgency: 'immediate' | 'urgent' | 'routine';
}

interface BedRecommendation {
  bedId: string;
  unit: string;
  room: string;
  score: number; // 0-100
  reasons: string[];
  availability: 'now' | 'in_2h' | 'in_4h';
  features: string[];
}

// Discharge Readiness
interface DischargeReadiness {
  patientId: string;
  predictedReadyDate: string;
  predictedReadyHours: number;
  medicalReadinessScore: number;
  socialReadinessScore: number;
  barriers: DischargeBarrier[];
  recommendedInterventions: Intervention[];
}

interface DischargeBarrier {
  type: 'home_health' | 'dme' | 'transportation' | 'medication' | 'follow_up';
  description: string;
  severity: 'minor' | 'moderate' | 'major';
  estimatedResolutionTime: number; // hours
}

interface Intervention {
  barrierType: string;
  action: string;
  responsible: string;
  estimatedImpact: number; // hours saved
}

// Transfer Optimization
interface TransferPriority {
  patientId: string;
  currentLocation: string;
  targetUnit: string;
  priorityScore: number;
  acuityLevel: number;
  waitTimeHours: number;
  transferUrgency: 'immediate' | 'urgent' | 'routine';
  predictedBedAvailableAt: string;
}

// Capacity Forecasting
interface CapacityForecast {
  unit: string;
  forecastDate: string;
  forecastHour: number;
  predictedCensus: number;
  predictedAdmissions: number;
  predictedDischarges: number;
  availableBeds: number;
  utilizationPercentage: number;
  surgeCapacityNeeded: boolean;
  recommendedStaffing: StaffingRecommendation;
  confidence: number;
}

interface StaffingRecommendation {
  nurses: number;
  aides: number;
  physicians: number;
  rationale: string;
}

// Bed Status
interface BedStatus {
  bedId: string;
  unit: string;
  room: string;
  status: 'occupied' | 'available' | 'cleaning' | 'blocked' | 'maintenance';
  patientId?: string;
  estimatedAvailableAt?: string;
  features: string[];
  isolationCapable: boolean;
}

// AI Feature Management
type BedManagementFeature = 
  | 'los_prediction'
  | 'bed_assignment_optimization'
  | 'discharge_readiness'
  | 'transfer_optimization'
  | 'capacity_forecasting';
```

## Error Handling

### Error Types

```typescript
class BedManagementFeatureDisabledError extends Error {
  constructor(feature: string) {
    super(`Bed management feature '${feature}' is currently disabled for this tenant`);
    this.name = 'BedManagementFeatureDisabledError';
  }
}

class InsufficientHistoricalDataError extends Error {
  constructor(dataType: string) {
    super(`Insufficient historical data for ${dataType} prediction`);
    this.name = 'InsufficientHistoricalDataError';
  }
}

class NoBedAvailableError extends Error {
  constructor(requirements: string) {
    super(`No beds available matching requirements: ${requirements}`);
    this.name = 'NoBedAvailableError';
  }
}

class PredictionTimeoutError extends Error {
  constructor() {
    super('Bed management prediction exceeded timeout threshold');
    this.name = 'PredictionTimeoutError';
  }
}
```

### Error Handling Strategy

1. **Feature Disabled**: Return graceful response with manual workflow option
2. **Insufficient Data**: Return prediction with low confidence and disclaimer
3. **No Beds Available**: Suggest alternative units or surge capacity options
4. **Prediction Timeout**: Return cached prediction or rule-based recommendation
5. **All Errors**: Log to monitoring system, alert administrators if critical

## Testing Strategy

### Unit Tests
- Test LOS prediction with various patient profiles
- Verify bed scoring algorithm
- Test discharge readiness calculations
- Validate capacity forecasting logic

### Integration Tests
- End-to-end bed assignment workflow
- LOS prediction update cycle
- Transfer prioritization flow
- Capacity forecast generation

### Performance Tests
- 200 concurrent bed assignment requests
- Daily LOS prediction updates for 1000+ patients
- Real-time bed status queries
- Database query performance

### Accuracy Validation Tests
- LOS prediction accuracy (±1 day for 70% of cases)
- Bed assignment appropriateness review
- Discharge readiness prediction validation
- Capacity forecast accuracy tracking

## Deployment Strategy

### Phase 1: Data Collection and Model Training (Month 1-2)
- Collect 3+ years of admission/discharge data
- Label outcomes and validate data quality
- Train initial ML models
- Validate model performance offline

### Phase 2: Core Services Implementation (Month 3-4)
- Implement LOS prediction service
- Implement bed assignment optimizer
- Create database schema and migrations
- Develop admin UI for feature management

### Phase 3: Advanced Features (Month 5-6)
- Implement discharge readiness predictor
- Implement transfer optimizer
- Implement capacity forecaster
- Integrate with bed management module

### Phase 4: Pilot and Validation (Month 7-8)
- Deploy to pilot unit
- Monitor performance and accuracy
- Collect feedback from staff
- Iterate and improve

## Security Considerations

- All patient data encrypted at rest and in transit
- ML models trained on de-identified data
- HIPAA compliance for all bed management operations
- Audit logging of all bed assignments and predictions
- Role-based access to bed management features

## Monitoring and Observability

### Key Metrics
- LOS prediction accuracy (MAE, within ±1 day %)
- Bed utilization rate
- ED boarding time
- Bed turnover time
- Capacity forecast accuracy
- Discharge delay time

### Alerting
- LOS prediction accuracy drops below 65%
- Bed utilization exceeds 95%
- ED boarding time exceeds 4 hours
- Surge capacity needed
- System performance degradation

---

This design provides a comprehensive foundation for implementing the Intelligent Bed Management & Patient Flow Optimization system with full administrative control and multi-tenant support.
