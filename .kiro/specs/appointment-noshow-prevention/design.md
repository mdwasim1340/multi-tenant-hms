# Design Document: Predictive Appointment No-Show Prevention

## Overview

This document outlines the technical design for implementing an ML-based Predictive Appointment No-Show Prevention system. The system provides no-show probability prediction, reminder optimization, dynamic overbooking, patient engagement scoring, and administrative control over AI features within a multi-tenant hospital management environment.

**Design Goals:**
- Achieve >80% precision for high-risk no-show predictions
- Reduce no-show rates by 30-40%
- Process predictions within 2 seconds
- Support 200+ concurrent prediction requests
- Improve appointment utilization by 25%
- Maintain complete tenant data isolation

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Appointment  │  │  Reminder    │  │  AI Settings │         │
│  │  Scheduler   │  │  Campaign    │  │    Admin     │         │
│  │  with Risk   │  │  Manager     │  │              │         │
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
│  │  No-Show     │  │  Reminder    │  │  AI Feature  │         │
│  │  Prediction  │  │  Optimizer   │  │   Manager    │         │
│  │  Service     │  │  Service     │  │              │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Overbooking  │  │  Patient     │  │  Campaign    │         │
│  │  Manager     │  │  Engagement  │  │  Manager     │         │
│  │              │  │  Service     │  │              │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ML Model Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  No-Show     │  │  Reminder    │  │  Engagement  │         │
│  │  Predictor   │  │  Optimizer   │  │  Scorer      │         │
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
│  ┌──────────────┐  ┌──────────────┐                            │
│  │   Weather    │  │  Notification│                            │
│  │     API      │  │   Service    │                            │
│  └──────────────┘  └──────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

**No-Show Prediction Flow:**
1. Appointment scheduled → API Gateway
2. Auth/Tenant middleware validates request
3. AI Feature Manager checks if prediction is enabled
4. No-Show Prediction Service retrieves patient history
5. ML Model processes data and returns probability
6. Patient Engagement Service updates engagement score
7. Reminder Optimizer determines optimal reminder strategy
8. Results stored in tenant database
9. Response returned to frontend

**Reminder Optimization Flow:**
1. Scheduled job runs daily for upcoming appointments
2. Retrieves appointments 1-7 days out per tenant
3. No-Show Prediction Service calculates current probability
4. Reminder Optimizer determines timing and channels
5. Campaign Manager schedules reminders
6. Notifications Module delivers reminders
7. Tracks delivery status and patient responses

**Dynamic Overbooking Flow:**
1. Scheduler requests available slots
2. Overbooking Manager calculates safe overbooking percentage
3. Considers historical no-show rates for provider/time
4. Adjusts based on real-time same-day patterns
5. Returns adjusted slot availability
6. Updates recommendations every 2 hours

## Components and Interfaces

### 1. No-Show Prediction Service

**Responsibilities:**
- Calculate no-show probability for appointments
- Classify risk levels (Low, Medium, High)
- Track prediction accuracy
- Update predictions as appointment date approaches

**Key Methods:**
```typescript
predictNoShow(appointmentData: AppointmentInput): Promise<NoShowPrediction>
updatePredictions(appointmentIds: string[]): Promise<void>
getPredictionHistory(appointmentId: string): Promise<Prediction[]>
getPerformanceMetrics(dateRange: DateRange): Promise<Metrics>
```

### 2. Reminder Optimizer Service

**Responsibilities:**
- Determine optimal reminder timing
- Select best communication channels
- Personalize message content
- Implement A/B testing for reminders

**Key Methods:**
```typescript
optimizeReminders(appointmentId: string): Promise<ReminderStrategy>
selectChannel(patientId: string, appointmentType: string): Promise<Channel>
personalizeMessage(patientId: string, template: string): Promise<string>
trackReminderEffectiveness(reminderId: string, outcome: Outcome): Promise<void>
```

### 3. Overbooking Manager Service

**Responsibilities:**
- Calculate safe overbooking percentages
- Adjust recommendations in real-time
- Balance utilization vs. wait time
- Track overbooking effectiveness

**Key Methods:**
```typescript
calculateOverbooking(providerId: string, timeSlot: string): Promise<OverbookingRecommendation>
adjustRealTime(providerId: string, currentNoShowRate: number): Promise<void>
getOverbookingMetrics(providerId: string, dateRange: DateRange): Promise<Metrics>
```

### 4. Patient Engagement Service

**Responsibilities:**
- Calculate patient engagement scores
- Track appointment adherence history
- Identify high-risk patients
- Suggest intervention strategies

**Key Methods:**
```typescript
calculateEngagementScore(patientId: string): Promise<EngagementScore>
updateScore(patientId: string, appointmentOutcome: Outcome): Promise<void>
identifyHighRiskPatients(tenantId: string): Promise<Patient[]>
suggestInterventions(patientId: string): Promise<Intervention[]>
```

### 5. Campaign Manager Service

**Responsibilities:**
- Manage reminder campaigns
- Schedule reminder delivery
- Track campaign effectiveness
- Implement A/B testing

**Key Methods:**
```typescript
createCampaign(campaign: CampaignData): Promise<Campaign>
scheduleReminders(appointmentIds: string[]): Promise<void>
trackDelivery(reminderId: string, status: DeliveryStatus): Promise<void>
measureEffectiveness(campaignId: string): Promise<CampaignMetrics>
```

### 6. AI Feature Manager Service

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
```

## Data Models

### Database Schema

#### noshow_predictions (tenant-specific)
```sql
CREATE TABLE noshow_predictions (
  id SERIAL PRIMARY KEY,
  appointment_id INTEGER NOT NULL REFERENCES appointments(id),
  patient_id INTEGER NOT NULL REFERENCES patients(id),
  provider_id INTEGER NOT NULL REFERENCES public.users(id),
  prediction_probability DECIMAL(5,2) NOT NULL, -- 0.00 to 100.00
  risk_level VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high'
  contributing_factors JSONB,
  appointment_date TIMESTAMP NOT NULL,
  appointment_type VARCHAR(100),
  patient_distance_km DECIMAL(6,2),
  weather_conditions VARCHAR(50),
  predicted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actual_outcome VARCHAR(20), -- 'showed', 'no_show', 'cancelled', 'rescheduled'
  outcome_recorded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_noshow_predictions_appointment ON noshow_predictions(appointment_id);
CREATE INDEX idx_noshow_predictions_patient ON noshow_predictions(patient_id);
CREATE INDEX idx_noshow_predictions_date ON noshow_predictions(appointment_date);
CREATE INDEX idx_noshow_predictions_risk ON noshow_predictions(risk_level);
```

#### reminder_campaigns (tenant-specific)
```sql
CREATE TABLE reminder_campaigns (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'paused', 'completed'
  target_risk_levels VARCHAR(20)[], -- ['medium', 'high']
  reminder_timing VARCHAR(50)[], -- ['1_week', '48_hours', '24_hours', '2_hours']
  channels VARCHAR(20)[], -- ['sms', 'email', 'phone', 'app']
  message_template TEXT,
  ab_test_enabled BOOLEAN DEFAULT false,
  ab_test_variant_b TEXT,
  created_by INTEGER REFERENCES public.users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### reminder_deliveries (tenant-specific)
```sql
CREATE TABLE reminder_deliveries (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES reminder_campaigns(id),
  appointment_id INTEGER NOT NULL REFERENCES appointments(id),
  patient_id INTEGER NOT NULL REFERENCES patients(id),
  channel VARCHAR(20) NOT NULL,
  timing VARCHAR(50) NOT NULL,
  message_content TEXT,
  ab_variant VARCHAR(1), -- 'A' or 'B'
  scheduled_at TIMESTAMP NOT NULL,
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'sent', 'delivered', 'failed', 'opened', 'clicked'
  error_message TEXT,
  cost DECIMAL(6,2), -- Cost in dollars
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reminder_deliveries_appointment ON reminder_deliveries(appointment_id);
CREATE INDEX idx_reminder_deliveries_scheduled ON reminder_deliveries(scheduled_at);
CREATE INDEX idx_reminder_deliveries_status ON reminder_deliveries(status);
```

#### patient_engagement_scores (tenant-specific)
```sql
CREATE TABLE patient_engagement_scores (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id),
  engagement_score INTEGER NOT NULL, -- 0-100
  total_appointments INTEGER DEFAULT 0,
  showed_count INTEGER DEFAULT 0,
  no_show_count INTEGER DEFAULT 0,
  cancelled_count INTEGER DEFAULT 0,
  cancelled_with_notice_count INTEGER DEFAULT 0,
  show_rate DECIMAL(5,2), -- Percentage
  cancellation_rate DECIMAL(5,2),
  average_notice_hours DECIMAL(6,2),
  last_appointment_date TIMESTAMP,
  last_no_show_date TIMESTAMP,
  risk_flags TEXT[], -- ['transportation', 'childcare', 'work_schedule']
  recommended_interventions TEXT[],
  calculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(patient_id)
);

CREATE INDEX idx_engagement_scores_patient ON patient_engagement_scores(patient_id);
CREATE INDEX idx_engagement_scores_score ON patient_engagement_scores(engagement_score);
```

#### overbooking_recommendations (tenant-specific)
```sql
CREATE TABLE overbooking_recommendations (
  id SERIAL PRIMARY KEY,
  provider_id INTEGER NOT NULL REFERENCES public.users(id),
  date DATE NOT NULL,
  time_slot TIME NOT NULL,
  base_capacity INTEGER NOT NULL,
  recommended_overbooking_pct DECIMAL(5,2) NOT NULL,
  recommended_total_slots INTEGER NOT NULL,
  historical_noshow_rate DECIMAL(5,2),
  current_day_noshow_rate DECIMAL(5,2),
  weather_factor DECIMAL(3,2),
  confidence_score DECIMAL(3,2),
  calculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider_id, date, time_slot)
);

CREATE INDEX idx_overbooking_provider_date ON overbooking_recommendations(provider_id, date);
```

#### noshow_financial_impact (tenant-specific)
```sql
CREATE TABLE noshow_financial_impact (
  id SERIAL PRIMARY KEY,
  month DATE NOT NULL,
  total_appointments INTEGER,
  predicted_noshows INTEGER,
  actual_noshows INTEGER,
  prevented_noshows INTEGER,
  average_appointment_value DECIMAL(10,2),
  revenue_recovered DECIMAL(10,2),
  reminder_campaign_cost DECIMAL(10,2),
  net_financial_benefit DECIMAL(10,2),
  roi_percentage DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(month)
);
```

### TypeScript Interfaces

```typescript
// No-Show Prediction
interface AppointmentInput {
  appointmentId: string;
  patientId: string;
  providerId: string;
  appointmentDate: string;
  appointmentType: string;
  patientHistory?: AppointmentHistory;
}

interface AppointmentHistory {
  totalAppointments: number;
  showRate: number;
  lastNoShowDate?: string;
  averageCancellationNotice: number;
}

interface NoShowPrediction {
  appointmentId: string;
  noShowProbability: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high';
  contributingFactors: Factor[];
  recommendedActions: Action[];
  confidence: number;
}

interface Factor {
  name: string;
  value: string | number;
  impact: number; // -100 to 100
}

interface Action {
  type: 'confirmation' | 'reminder' | 'reschedule' | 'intervention';
  description: string;
  priority: number;
}

// Reminder Optimization
interface ReminderStrategy {
  timing: string[]; // ['48h', '24h', '2h']
  channels: string[]; // ['sms', 'email']
  messageContent: string;
  requireConfirmation: boolean;
  offerRescheduling: boolean;
  estimatedEffectiveness: number;
}

// Patient Engagement
interface EngagementScore {
  patientId: string;
  score: number; // 0-100
  showRate: number;
  cancellationRate: number;
  riskFlags: string[];
  recommendedInterventions: Intervention[];
  lastUpdated: string;
}

interface Intervention {
  type: 'transportation' | 'flexible_scheduling' | 'reminder_preference' | 'support_services';
  description: string;
  estimatedImpact: number;
}

// Overbooking
interface OverbookingRecommendation {
  providerId: string;
  date: string;
  timeSlot: string;
  baseCapacity: number;
  recommendedOverbookingPct: number;
  recommendedTotalSlots: number;
  confidence: number;
  reasoning: string[];
}

// Campaign Management
interface Campaign {
  id: number;
  name: string;
  targetRiskLevels: string[];
  reminderTiming: string[];
  channels: string[];
  messageTemplate: string;
  abTestEnabled: boolean;
  status: 'active' | 'paused' | 'completed';
}

interface CampaignMetrics {
  campaignId: number;
  totalReminders: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  showRateImprovement: number;
  costPerReminder: number;
  roi: number;
}

// AI Feature Management
type AIFeature = 
  | 'noshow_prediction'
  | 'reminder_optimization'
  | 'dynamic_overbooking'
  | 'engagement_scoring';
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

class InsufficientHistoryError extends Error {
  constructor(patientId: string) {
    super(`Patient ${patientId} has insufficient appointment history for prediction`);
    this.name = 'InsufficientHistoryError';
  }
}

class PredictionTimeoutError extends Error {
  constructor() {
    super('No-show prediction exceeded timeout threshold');
    this.name = 'PredictionTimeoutError';
  }
}

class ReminderDeliveryError extends Error {
  constructor(channel: string, reason: string) {
    super(`Failed to deliver reminder via ${channel}: ${reason}`);
    this.name = 'ReminderDeliveryError';
  }
}
```

### Error Handling Strategy

1. **Feature Disabled**: Return graceful response with manual workflow option
2. **Insufficient History**: Return low-confidence prediction with disclaimer
3. **Prediction Timeout**: Return cached prediction or default risk level
4. **Reminder Delivery Failure**: Retry with alternative channel, log failure
5. **All Errors**: Log to monitoring system, alert administrators if critical

## Testing Strategy

### Unit Tests
- Test no-show probability calculation with various patient histories
- Verify reminder optimization logic
- Test overbooking calculation algorithms
- Validate engagement score calculations

### Integration Tests
- End-to-end prediction flow from appointment creation
- Reminder campaign scheduling and delivery
- Real-time overbooking adjustments
- Multi-tenant isolation verification

### Performance Tests
- 200 concurrent prediction requests
- Daily prediction updates for 10,000+ appointments
- Reminder delivery throughput
- Database query performance

### ML Model Tests
- Prediction accuracy >80% precision for high-risk
- Reminder optimization effectiveness
- Overbooking safety validation
- A/B test statistical significance

## Deployment Strategy

### Phase 1: Data Collection and Model Training (Month 1-2)
- Collect 2+ years of appointment history
- Label outcomes and validate data quality
- Train initial ML models
- Validate model performance offline

### Phase 2: API Development and Integration (Month 3)
- Implement backend services and APIs
- Create database schema and migrations
- Integrate with Appointment Management Module
- Develop admin UI for feature management

### Phase 3: Pilot Testing (Month 4)
- Deploy to one clinic or department
- Shadow mode: predictions alongside current process
- Collect feedback from schedulers
- Monitor prediction accuracy

### Phase 4: Full Deployment (Month 5-6)
- Roll out to all clinics
- Enable automated reminders
- Implement dynamic overbooking
- Continuous monitoring and improvement

## Security Considerations

- All patient data encrypted at rest and in transit
- ML models trained on de-identified data
- HIPAA compliance for reminder communications
- Audit logging of all predictions and interventions

## Monitoring and Observability

### Key Metrics
- Prediction accuracy (precision, recall, F1)
- No-show rate reduction
- Appointment utilization improvement
- Reminder delivery success rate
- Financial impact (revenue recovered)
- Patient satisfaction scores

### Alerting
- Prediction accuracy drops below 75%
- Reminder delivery failures exceed 5%
- Overbooking causes excessive wait times
- System performance degradation

---

This design provides a comprehensive foundation for implementing the Predictive Appointment No-Show Prevention system with full administrative control and multi-tenant support.
