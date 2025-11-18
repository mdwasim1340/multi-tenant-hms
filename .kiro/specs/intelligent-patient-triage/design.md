# Design Document: Intelligent Patient Triage & Risk Stratification

## Overview

This document outlines the technical design for implementing an ML-based Intelligent Patient Triage & Risk Stratification system. The system provides automated patient assessment, real-time risk scoring, early warning detection, and administrative control over AI features within a multi-tenant hospital management environment.

**Design Goals:**
- Achieve >95% accuracy for critical case identification
- Process triage assessments within 2 seconds
- Update risk scores every 15 minutes for all monitored patients
- Support 100+ concurrent triage assessments
- Maintain complete tenant data isolation
- Provide granular administrative control over AI features

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Triage UI  │  │  Risk Score  │  │  AI Settings │         │
│  │   Dashboard  │  │   Monitor    │  │    Admin     │         │
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
│  │   Triage     │  │  Risk Score  │  │  AI Feature  │         │
│  │   Service    │  │   Service    │  │   Manager    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Early Warning│  │  Alert       │  │  Model       │         │
│  │   Service    │  │  Service     │  │  Service     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ML Model Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Triage      │  │  Risk Score  │  │   Sepsis     │         │
│  │  Classifier  │  │  Predictor   │  │  Predictor   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │   Cardiac    │  │ Respiratory  │                            │
│  │  Predictor   │  │  Predictor   │                            │
│  └──────────────┘  └──────────────┘                            │
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

**Triage Assessment Flow:**
1. Frontend submits patient data → API Gateway
2. Auth/Tenant middleware validates request
3. AI Feature Manager checks if triage is enabled
4. Triage Service retrieves patient history
5. ML Model processes data and returns prediction
6. Risk Score Service calculates deterioration risk
7. Alert Service generates notifications if needed
8. Results stored in tenant database
9. Response returned to frontend

**Risk Score Update Flow (Background Job):**
1. Scheduled job runs every 15 minutes
2. Retrieves all monitored patients per tenant
3. Fetches latest vital signs and lab values
4. Risk Score Service recalculates scores
5. Compares with previous scores for trends
6. Alert Service triggers notifications for high-risk changes
7. Updates stored in database

## Components and Interfaces

### 1. Triage Service

**Responsibilities:**
- Process triage assessment requests
- Coordinate with ML models
- Generate triage recommendations
- Track triage performance metrics

**Key Methods:**
```typescript
assessPatient(patientData: TriageInput): Promise<TriageResult>
getTriageHistory(patientId: string): Promise<TriageAssessment[]>
updateTriageOutcome(assessmentId: string, outcome: Outcome): Promise<void>
getPerformanceMetrics(dateRange: DateRange): Promise<Metrics>
```

### 2. Risk Score Service

**Responsibilities:**
- Calculate patient deterioration risk scores
- Track risk score trends over time
- Identify contributing risk factors
- Trigger alerts for high-risk patients

**Key Methods:**
```typescript
calculateRiskScore(patientId: string): Promise<RiskScore>
updateRiskScores(patientIds: string[]): Promise<void>
getRiskTrend(patientId: string, hours: number): Promise<RiskTrend>
identifyRiskFactors(patientId: string): Promise<RiskFactor[]>
```

### 3. Early Warning Service

**Responsibilities:**
- Predict sepsis, cardiac events, respiratory failure
- Monitor for multi-organ failure risk
- Generate early warning alerts
- Track prediction accuracy

**Key Methods:**
```typescript
predictSepsis(patientId: string): Promise<SepsisPrediction>
predictCardiacEvent(patientId: string): Promise<CardiacPrediction>
predictRespiratoryFailure(patientId: string): Promise<RespiratoryPrediction>
assessMultiOrganFailure(patientId: string): Promise<MOFAssessment>
```

### 4. AI Feature Manager

**Responsibilities:**
- Manage AI feature enable/disable states
- Enforce feature access control
- Log configuration changes
- Provide feature status information

**Key Methods:**
```typescript
isFeatureEnabled(tenantId: string, feature: AIFeature): Promise<boolean>
enableFeature(tenantId: string, feature: AIFeature, adminId: string, reason: string): Promise<void>
disableFeature(tenantId: string, feature: AIFeature, adminId: string, reason: string): Promise<void>
getFeatureStatus(tenantId: string): Promise<FeatureStatus[]>
getAuditLog(tenantId: string, dateRange: DateRange): Promise<AuditEntry[]>
```

### 5. Alert Service

**Responsibilities:**
- Generate and send alerts for critical conditions
- Manage alert escalation
- Track alert acknowledgments
- Prevent alert fatigue

**Key Methods:**
```typescript
createAlert(alert: AlertData): Promise<Alert>
acknowledgeAlert(alertId: string, userId: string): Promise<void>
escalateAlert(alertId: string): Promise<void>
getActiveAlerts(tenantId: string): Promise<Alert[]>
```

### 6. Model Service

**Responsibilities:**
- Load and manage ML models
- Execute model predictions
- Track model performance
- Handle model versioning

**Key Methods:**
```typescript
loadModel(modelType: ModelType, version: string): Promise<Model>
predict(model: Model, input: ModelInput): Promise<ModelOutput>
getModelMetrics(modelType: ModelType): Promise<ModelMetrics>
updateModel(modelType: ModelType, newVersion: string): Promise<void>
```

## Data Models

### Database Schema

#### ai_feature_config (tenant-specific)
```sql
CREATE TABLE ai_feature_config (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  feature_name VARCHAR(100) NOT NULL,
  enabled BOOLEAN DEFAULT false,
  enabled_at TIMESTAMP,
  enabled_by INTEGER REFERENCES public.users(id),
  disabled_at TIMESTAMP,
  disabled_by INTEGER REFERENCES public.users(id),
  configuration JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, feature_name)
);
```

#### ai_feature_audit_log (tenant-specific)
```sql
CREATE TABLE ai_feature_audit_log (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  feature_name VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'enabled', 'disabled', 'config_changed'
  admin_id INTEGER NOT NULL REFERENCES public.users(id),
  admin_name VARCHAR(255),
  reason TEXT,
  previous_state JSONB,
  new_state JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### triage_assessments (tenant-specific)
```sql
CREATE TABLE triage_assessments (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id),
  assessment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  priority_level VARCHAR(20) NOT NULL, -- 'critical', 'urgent', 'standard', 'non_urgent'
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  symptoms TEXT[],
  vital_signs JSONB,
  medical_history TEXT[],
  recommended_actions TEXT[],
  estimated_wait_time INTEGER, -- minutes
  assessed_by INTEGER REFERENCES public.users(id),
  ai_generated BOOLEAN DEFAULT true,
  actual_outcome VARCHAR(50), -- 'admission', 'discharge', 'icu_transfer', etc.
  outcome_recorded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### risk_scores (tenant-specific)
```sql
CREATE TABLE risk_scores (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id),
  score INTEGER NOT NULL, -- 0-100
  risk_level VARCHAR(20) NOT NULL, -- 'low', 'moderate', 'high', 'severe'
  contributing_factors JSONB,
  vital_signs JSONB,
  lab_values JSONB,
  calculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  alert_generated BOOLEAN DEFAULT false,
  alert_id INTEGER REFERENCES alerts(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### early_warning_predictions (tenant-specific)
```sql
CREATE TABLE early_warning_predictions (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id),
  prediction_type VARCHAR(50) NOT NULL, -- 'sepsis', 'cardiac', 'respiratory', 'mof'
  probability DECIMAL(5,2) NOT NULL, -- 0.00 to 100.00
  risk_level VARCHAR(20) NOT NULL,
  predicted_onset_hours INTEGER, -- hours until predicted event
  contributing_factors JSONB,
  recommendations TEXT[],
  confidence_score DECIMAL(3,2),
  actual_outcome VARCHAR(50), -- 'true_positive', 'false_positive', 'true_negative', 'false_negative'
  outcome_recorded_at TIMESTAMP,
  predicted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### alerts (tenant-specific)
```sql
CREATE TABLE alerts (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id),
  alert_type VARCHAR(50) NOT NULL, -- 'high_risk', 'sepsis_warning', 'cardiac_warning', etc.
  severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
  message TEXT NOT NULL,
  details JSONB,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'acknowledged', 'resolved', 'escalated'
  acknowledged_by INTEGER REFERENCES public.users(id),
  acknowledged_at TIMESTAMP,
  escalated_at TIMESTAMP,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### model_performance_metrics (tenant-specific)
```sql
CREATE TABLE model_performance_metrics (
  id SERIAL PRIMARY KEY,
  model_type VARCHAR(50) NOT NULL, -- 'triage', 'risk_score', 'sepsis', etc.
  model_version VARCHAR(20) NOT NULL,
  metric_name VARCHAR(50) NOT NULL, -- 'accuracy', 'sensitivity', 'specificity', 'auc'
  metric_value DECIMAL(5,4),
  sample_size INTEGER,
  calculation_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### TypeScript Interfaces

```typescript
// Triage Input/Output
interface TriageInput {
  patientId: string;
  symptoms: string[];
  vitalSigns: VitalSigns;
  medicalHistory: string[];
  age: number;
  comorbidities: string[];
}

interface VitalSigns {
  temperature: number;
  bloodPressure: string;
  heartRate: number;
  respiratoryRate: number;
  oxygenSaturation: number;
  timestamp: string;
}

interface TriageResult {
  priorityLevel: 'critical' | 'urgent' | 'standard' | 'non_urgent';
  riskScore: number;
  recommendedActions: string[];
  estimatedWaitTime: number;
  confidence: number;
  contributingFactors: RiskFactor[];
}

// Risk Score
interface RiskScore {
  patientId: string;
  score: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'severe';
  contributingFactors: RiskFactor[];
  calculatedAt: string;
  trend: 'improving' | 'stable' | 'worsening';
}

interface RiskFactor {
  factor: string;
  value: string | number;
  impact: number;
  modifiable: boolean;
}

// Early Warning
interface SepsisPrediction {
  probability: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'severe';
  predictedOnsetHours: number;
  contributingFactors: RiskFactor[];
  recommendations: string[];
  confidence: number;
}

// AI Feature Management
interface AIFeatureConfig {
  featureName: AIFeature;
  enabled: boolean;
  enabledAt?: string;
  enabledBy?: string;
  configuration?: Record<string, any>;
}

type AIFeature = 
  | 'triage_classification'
  | 'risk_scoring'
  | 'sepsis_prediction'
  | 'cardiac_prediction'
  | 'respiratory_prediction'
  | 'early_warning_system';

interface FeatureAuditEntry {
  id: number;
  featureName: string;
  action: 'enabled' | 'disabled' | 'config_changed';
  adminId: number;
  adminName: string;
  reason: string;
  timestamp: string;
}

// Alerts
interface Alert {
  id: number;
  patientId: string;
  alertType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: Record<string, any>;
  status: 'active' | 'acknowledged' | 'resolved' | 'escalated';
  createdAt: string;
}
```

## Error Handling

### Error Types

```typescript
class AIFeatureDisabledError extends Error {
  constructor(feature: string) {
    super(`AI feature '${feature}' is currently disabled for this tenant`);
    this.name = 'AIFeatureDisabledError';
  }
}

class InsufficientDataError extends Error {
  constructor(message: string) {
    super(`Insufficient data for prediction: ${message}`);
    this.name = 'InsufficientDataError';
  }
}

class ModelLoadError extends Error {
  constructor(modelType: string) {
    super(`Failed to load ML model: ${modelType}`);
    this.name = 'ModelLoadError';
  }
}

class PredictionTimeoutError extends Error {
  constructor() {
    super('ML prediction exceeded timeout threshold');
    this.name = 'PredictionTimeoutError';
  }
}
```

### Error Handling Strategy

1. **Feature Disabled**: Return graceful response indicating manual workflow should be used
2. **Insufficient Data**: Return partial results with confidence score indicating data gaps
3. **Model Errors**: Fall back to rule-based algorithms or return error with manual override option
4. **Timeout**: Return cached prediction if available, otherwise error with retry option
5. **All Errors**: Log to monitoring system, alert administrators if critical

## Testing Strategy

### Unit Tests

**Triage Service Tests:**
- Test priority level assignment for various symptom combinations
- Verify confidence score calculations
- Test recommended action generation
- Validate wait time estimation

**Risk Score Service Tests:**
- Test risk score calculation with different vital sign patterns
- Verify trend detection (improving/stable/worsening)
- Test contributing factor identification
- Validate alert threshold triggering

**AI Feature Manager Tests:**
- Test feature enable/disable functionality
- Verify audit logging
- Test permission enforcement
- Validate graceful degradation

### Integration Tests

**End-to-End Triage Flow:**
- Submit patient data → Receive triage result
- Verify database records created
- Confirm alerts generated for critical cases
- Test multi-tenant isolation

**Risk Score Update Job:**
- Trigger scheduled job
- Verify all monitored patients updated
- Confirm alerts sent for high-risk changes
- Test performance with 1000+ patients

**Feature Toggle Integration:**
- Disable feature → Verify predictions stop
- Enable feature → Verify predictions resume
- Test UI indicators update correctly

### Performance Tests

**Load Testing:**
- 100 concurrent triage assessments
- 1000 risk score updates in 15 minutes
- Alert generation under high load
- Database query performance

**Latency Testing:**
- Triage assessment < 2 seconds (p95)
- Risk score calculation < 1 second (p95)
- Alert delivery < 5 seconds (p95)

### ML Model Tests

**Model Accuracy:**
- Triage classification accuracy > 95% for critical cases
- Sepsis prediction sensitivity > 85%
- Risk score AUC > 0.75
- False positive rate < 10%

**Model Validation:**
- Cross-validation on historical data
- Temporal validation (train on old data, test on recent)
- Subgroup analysis (age, gender, diagnosis)
- Calibration testing

## Deployment Strategy

### Phase 1: Data Collection and Model Training (Month 1-2)
- Collect 50,000+ historical triage cases
- Label outcomes and validate data quality
- Train initial ML models
- Validate model performance offline

### Phase 2: API Development and Integration (Month 3)
- Implement backend services and APIs
- Create database schema and migrations
- Integrate with existing modules
- Develop admin UI for feature management

### Phase 3: Pilot Testing (Month 4)
- Deploy to one department (ED or ICU)
- Shadow mode: AI predictions alongside manual triage
- Collect feedback from clinicians
- Monitor performance and accuracy

### Phase 4: Full Deployment (Month 5-6)
- Roll out to all departments
- Enable real-time alerts
- Train staff on AI features
- Continuous monitoring and improvement

### Rollback Plan
- Feature toggles allow instant disable
- Manual workflows remain available
- Historical data preserved
- Model versioning enables rollback to previous version

## Security Considerations

### Data Privacy
- All patient data encrypted at rest and in transit
- ML models trained on de-identified data
- Predictions logged with patient consent
- HIPAA compliance maintained

### Access Control
- Admin-only access to feature management
- Role-based permissions for viewing predictions
- Audit logging of all configuration changes
- Multi-factor authentication for sensitive operations

### Model Security
- Models stored in secure S3 buckets
- Version control and integrity checks
- Protection against adversarial attacks
- Regular security audits

## Monitoring and Observability

### Key Metrics

**Performance Metrics:**
- API response times (p50, p95, p99)
- Prediction throughput (predictions/minute)
- Alert delivery latency
- Database query performance

**Accuracy Metrics:**
- Triage classification accuracy by priority level
- Risk score calibration
- Early warning sensitivity/specificity
- False positive/negative rates

**Usage Metrics:**
- Number of triage assessments per day
- Active AI features per tenant
- Alert volume and acknowledgment rate
- Feature enable/disable frequency

### Alerting

**Critical Alerts:**
- Model accuracy drops below threshold
- API response time exceeds 5 seconds
- Alert delivery failures
- Database connection issues

**Warning Alerts:**
- High false positive rate
- Unusual prediction patterns
- Feature disabled by admin
- Model performance degradation

### Dashboards

**Operations Dashboard:**
- Real-time API metrics
- Active alerts and acknowledgments
- System health indicators
- Error rates and types

**Clinical Dashboard:**
- Triage accuracy trends
- Risk score distribution
- Early warning performance
- Patient outcome correlations

**Admin Dashboard:**
- Feature status per tenant
- Usage statistics
- Performance metrics
- Audit log summary

---

This design provides a comprehensive, scalable, and secure foundation for implementing the Intelligent Patient Triage & Risk Stratification system with full administrative control and multi-tenant support.
