# Implementation Plan: Intelligent Patient Triage & Risk Stratification

This implementation plan breaks down the development of the AI-powered triage system into discrete, manageable tasks. Each task builds incrementally on previous work and includes specific requirements references.

## Task Organization

Tasks are organized into major phases with clear dependencies. Optional tasks (marked with *) focus on testing and optimization that can be deferred for MVP.

---

## Phase 1: Foundation and Database Setup

### - [ ] 1. Database Schema Implementation

Create the database tables and indexes required for AI triage functionality.

- Create migration file for AI feature configuration tables
- Implement `ai_feature_config` table with tenant isolation
- Implement `ai_feature_audit_log` table for compliance tracking
- Create `triage_assessments` table with patient references
- Create `risk_scores` table with time-series support
- Create `early_warning_predictions` table
- Create `alerts` table with status tracking
- Create `model_performance_metrics` table
- Add appropriate indexes for query performance
- Add foreign key constraints and validation rules
- _Requirements: 1.1, 1.2, 6.1, 6.2, 6.3_

### - [ ] 2. TypeScript Type Definitions

Define TypeScript interfaces and types for the AI triage system.

- Create `backend/src/types/ai-triage.ts` with core interfaces
- Define `TriageInput`, `TriageResult`, `VitalSigns` interfaces
- Define `RiskScore`, `RiskFactor`, `RiskTrend` interfaces
- Define `SepsisPrediction`, `CardiacPrediction`, `RespiratoryPrediction` interfaces
- Define `AIFeatureConfig`, `AIFeature` enum, `FeatureAuditEntry` interfaces
- Define `Alert` and alert-related interfaces
- Create Zod validation schemas for API inputs
- Export all types for use across backend and frontend
- _Requirements: 1.1, 2.1, 3.1, 15.1_

### - [ ] 3. AI Feature Manager Service

Implement the service for managing AI feature enable/disable functionality.

- Create `backend/src/services/ai-feature-manager.ts`
- Implement `isFeatureEnabled(tenantId, feature)` method
- Implement `enableFeature(tenantId, feature, adminId, reason)` method
- Implement `disableFeature(tenantId, feature, adminId, reason)` method
- Implement `getFeatureStatus(tenantId)` method
- Implement `getAuditLog(tenantId, dateRange)` method
- Add database queries with tenant isolation
- Implement audit logging for all configuration changes
- Add caching layer for feature status (Redis)
- _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 16.1, 16.2_

---

## Phase 2: Core Triage Functionality

### - [ ] 4. Triage Service Implementation

Implement the core triage assessment service.

- Create `backend/src/services/triage-service.ts`
- Implement `assessPatient(patientData)` method
- Integrate with AI Feature Manager to check if triage is enabled
- Implement priority level classification logic (rule-based for MVP)
- Calculate confidence scores based on data completeness
- Generate recommended actions based on symptoms and vital signs
- Estimate wait times based on current ED capacity
- Store triage assessments in database
- _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 4.1, 4.2, 4.3_

### - [ ] 5. Triage API Endpoints

Create REST API endpoints for triage functionality.

- Create `backend/src/routes/ai-triage.ts`
- Implement `POST /api/ai/triage/assess` endpoint
- Implement `GET /api/ai/triage/history/:patientId` endpoint
- Implement `PUT /api/ai/triage/:assessmentId/outcome` endpoint
- Implement `GET /api/ai/triage/metrics` endpoint
- Add authentication and tenant middleware
- Add input validation using Zod schemas
- Add rate limiting (100 requests/minute per tenant)
- Implement error handling and logging
- _Requirements: 1.1, 1.2, 11.1, 11.2_

### - [ ] 6. Risk Score Service Implementation

Implement the risk scoring service for patient deterioration prediction.

- Create `backend/src/services/risk-score-service.ts`
- Implement `calculateRiskScore(patientId)` method
- Implement risk factor identification logic
- Implement `updateRiskScores(patientIds)` batch method
- Implement `getRiskTrend(patientId, hours)` method
- Calculate risk levels (low/moderate/high/severe) based on score
- Store risk scores with timestamps in database
- Implement caching for frequently accessed scores
- _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

### - [ ] 7. Risk Score API Endpoints

Create REST API endpoints for risk score functionality.

- Create routes in `backend/src/routes/ai-triage.ts`
- Implement `POST /api/ai/risk-score/calculate` endpoint
- Implement `GET /api/ai/risk-score/:patientId` endpoint
- Implement `GET /api/ai/risk-score/:patientId/trend` endpoint
- Implement `GET /api/ai/risk-score/:patientId/factors` endpoint
- Add authentication and tenant middleware
- Add input validation
- Implement error handling
- _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

---

## Phase 3: Early Warning System

### - [ ] 8. Early Warning Service Implementation

Implement the early warning prediction service.

- Create `backend/src/services/early-warning-service.ts`
- Implement `predictSepsis(patientId)` method with rule-based logic
- Implement `predictCardiacEvent(patientId)` method
- Implement `predictRespiratoryFailure(patientId)` method
- Implement `assessMultiOrganFailure(patientId)` method
- Calculate prediction confidence scores
- Identify contributing factors for each prediction
- Store predictions in database with timestamps
- _Requirements: 3.1, 3.2, 3.3, 3.4_

### - [ ] 9. Early Warning API Endpoints

Create REST API endpoints for early warning predictions.

- Create routes in `backend/src/routes/ai-triage.ts`
- Implement `POST /api/ai/early-warning/sepsis` endpoint
- Implement `POST /api/ai/early-warning/cardiac` endpoint
- Implement `POST /api/ai/early-warning/respiratory` endpoint
- Implement `POST /api/ai/early-warning/multi-organ` endpoint
- Implement `GET /api/ai/early-warning/:patientId/all` endpoint
- Add authentication and tenant middleware
- Add input validation
- Implement error handling
- _Requirements: 3.1, 3.2, 3.3, 3.4_

### - [ ] 10. Alert Service Implementation

Implement the alert generation and management service.

- Create `backend/src/services/alert-service.ts`
- Implement `createAlert(alertData)` method
- Implement `acknowledgeAlert(alertId, userId)` method
- Implement `escalateAlert(alertId)` method
- Implement `getActiveAlerts(tenantId)` method
- Integrate with Notifications Module for multi-channel delivery
- Implement alert escalation logic (5-minute timeout)
- Implement alert history tracking
- Add alert deduplication to prevent spam
- _Requirements: 3.5, 9.1, 9.2, 9.3, 9.4, 9.5_

### - [ ] 11. Alert API Endpoints

Create REST API endpoints for alert management.

- Create routes in `backend/src/routes/ai-triage.ts`
- Implement `POST /api/ai/alerts` endpoint
- Implement `PUT /api/ai/alerts/:alertId/acknowledge` endpoint
- Implement `PUT /api/ai/alerts/:alertId/escalate` endpoint
- Implement `GET /api/ai/alerts/active` endpoint
- Implement `GET /api/ai/alerts/history` endpoint
- Add authentication and tenant middleware
- Add input validation
- Implement error handling
- _Requirements: 9.1, 9.2, 9.3, 9.4_

---

## Phase 4: Background Jobs and Automation

### - [ ] 12. Risk Score Update Job

Implement scheduled job for updating risk scores every 15 minutes.

- Create `backend/src/jobs/risk-score-updater.ts`
- Implement job scheduler using node-cron or similar
- Retrieve all monitored patients per tenant
- Fetch latest vital signs and lab values
- Call Risk Score Service for batch updates
- Compare with previous scores to detect trends
- Trigger alerts for significant risk increases
- Log job execution and performance metrics
- Handle errors gracefully without stopping job
- _Requirements: 2.2, 11.3_

### - [ ] 13. Model Performance Tracking Job

Implement scheduled job for tracking ML model performance.

- Create `backend/src/jobs/model-performance-tracker.ts`
- Implement daily job to calculate accuracy metrics
- Compare predictions with actual outcomes
- Calculate sensitivity, specificity, AUC for each model
- Store metrics in `model_performance_metrics` table
- Generate alerts if accuracy drops below thresholds
- Create performance reports for administrators
- _Requirements: 8.1, 8.2, 8.3, 18.1, 18.2, 18.4_

---

## Phase 5: Admin Interface - Backend

### - [ ] 14. AI Feature Management API Endpoints

Create admin API endpoints for managing AI features.

- Create `backend/src/routes/ai-admin.ts`
- Implement `GET /api/ai/admin/features` endpoint (get all feature statuses)
- Implement `POST /api/ai/admin/features/:feature/enable` endpoint
- Implement `POST /api/ai/admin/features/:feature/disable` endpoint
- Implement `PUT /api/ai/admin/features/:feature/config` endpoint
- Implement `GET /api/ai/admin/audit-log` endpoint
- Add admin-only permission checks
- Add input validation for feature names and configuration
- Implement error handling
- _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 16.1, 16.2, 16.3, 16.4, 16.5_

### - [ ] 15. AI Performance Metrics API Endpoints

Create admin API endpoints for viewing AI performance metrics.

- Create routes in `backend/src/routes/ai-admin.ts`
- Implement `GET /api/ai/admin/metrics/triage` endpoint
- Implement `GET /api/ai/admin/metrics/risk-score` endpoint
- Implement `GET /api/ai/admin/metrics/early-warning` endpoint
- Implement `GET /api/ai/admin/metrics/usage` endpoint
- Implement `GET /api/ai/admin/metrics/export` endpoint (CSV/JSON)
- Add admin-only permission checks
- Implement date range filtering
- Add caching for expensive metric calculations
- _Requirements: 18.1, 18.2, 18.3, 18.5_

### - [ ] 16. Threshold Configuration API

Create API endpoints for customizing risk thresholds.

- Create routes in `backend/src/routes/ai-admin.ts`
- Implement `GET /api/ai/admin/thresholds` endpoint
- Implement `PUT /api/ai/admin/thresholds/:alertType` endpoint
- Implement threshold validation (0-100 range)
- Support department-specific thresholds
- Apply threshold changes within 1 minute
- Log all threshold changes with admin identification
- _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

---

## Phase 6: Frontend - Triage Interface

### - [ ] 17. Triage Assessment UI Component

Create the patient triage assessment interface.

- Create `hospital-management-system/app/triage/assess/page.tsx`
- Create `hospital-management-system/components/triage/triage-form.tsx`
- Implement form for entering symptoms and vital signs
- Add patient search and selection
- Display medical history and comorbidities
- Implement form validation
- Call triage API endpoint on submission
- Display triage result (priority level, risk score, recommendations)
- Show confidence score and contributing factors
- Add loading states and error handling
- _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 4.1, 4.2, 4.3, 4.4, 4.5_

### - [ ] 18. Risk Score Monitor Dashboard

Create the risk score monitoring dashboard.

- Create `hospital-management-system/app/triage/risk-monitor/page.tsx`
- Create `hospital-management-system/components/triage/risk-score-card.tsx`
- Display list of monitored patients with current risk scores
- Implement color-coding by risk level (green/yellow/orange/red)
- Show risk score trends (sparkline charts)
- Display contributing risk factors
- Implement real-time updates (WebSocket or polling)
- Add filtering by risk level and department
- Add sorting by risk score, patient name, admission date
- _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

### - [ ] 19. Alert Management UI

Create the alert management interface.

- Create `hospital-management-system/app/triage/alerts/page.tsx`
- Create `hospital-management-system/components/triage/alert-card.tsx`
- Display active alerts with severity indicators
- Implement alert acknowledgment functionality
- Show alert history and status changes
- Add filtering by alert type and severity
- Implement real-time alert notifications (toast/banner)
- Add sound notifications for critical alerts
- Show escalation status and timeline
- _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

### - [ ] 20. Triage History View

Create the triage history and outcome tracking interface.

- Create `hospital-management-system/app/triage/history/page.tsx`
- Display list of past triage assessments
- Show actual outcomes vs. predicted priority
- Implement filtering by date range, priority level, outcome
- Add export functionality (CSV)
- Display accuracy metrics for the department
- Show clinician feedback on triage accuracy
- _Requirements: 1.1, 8.1, 8.2, 13.1, 13.2_

---

## Phase 7: Frontend - Admin Interface

### - [ ] 21. AI Feature Management UI

Create the admin interface for managing AI features.

- Create `hospital-management-system/app/admin/ai-features/page.tsx`
- Create `hospital-management-system/components/admin/feature-toggle-card.tsx`
- Display all AI features with current status (enabled/disabled)
- Implement toggle switches for each feature
- Add confirmation dialog when disabling features
- Require reason input for feature changes
- Show last modified timestamp and admin name
- Display feature descriptions and dependencies
- Add bulk enable/disable functionality
- _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 16.2, 16.3, 16.4, 16.5_

### - [ ] 22. AI Feature Audit Log UI

Create the audit log viewer for AI feature changes.

- Create `hospital-management-system/app/admin/ai-features/audit/page.tsx`
- Display chronological list of feature changes
- Show admin name, action, reason, timestamp
- Implement filtering by feature, admin, date range
- Display before/after states for configuration changes
- Add export functionality (CSV/PDF)
- Implement search functionality
- _Requirements: 16.1, 16.2, 16.5_

### - [ ] 23. AI Performance Dashboard

Create the performance monitoring dashboard for administrators.

- Create `hospital-management-system/app/admin/ai-performance/page.tsx`
- Display triage accuracy metrics (overall and by priority level)
- Show risk score calibration charts
- Display early warning sensitivity/specificity
- Show usage statistics (assessments per day, active features)
- Display alert volume and acknowledgment rates
- Implement date range selection
- Add comparison with previous periods
- Show performance trends over time
- _Requirements: 8.1, 8.2, 8.3, 8.4, 18.1, 18.2, 18.3_

### - [ ] 24. Threshold Configuration UI

Create the interface for customizing alert thresholds.

- Create `hospital-management-system/app/admin/ai-features/thresholds/page.tsx`
- Display current thresholds for each alert type
- Implement slider controls for adjusting thresholds
- Add department-specific threshold configuration
- Show preview of alert volume at different thresholds
- Implement validation (0-100 range)
- Add save confirmation dialog
- Display threshold change history
- _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

---

## Phase 8: Integration and Polish

### - [ ] 25. Integration with Patient Management Module

Integrate triage system with existing patient management.

- Add triage assessment link to patient detail page
- Display current risk score on patient card
- Show active alerts on patient dashboard
- Add triage history to patient timeline
- Integrate with patient search and filtering
- Update patient status based on triage priority
- _Requirements: 5.1, 5.2, 5.4_

### - [ ] 26. Integration with Medical Records Module

Integrate triage system with medical records.

- Retrieve clinical notes for triage assessment
- Pull diagnoses and treatments for risk calculation
- Store triage assessments in patient medical record
- Link early warning predictions to clinical documentation
- _Requirements: 5.2, 5.4_

### - [ ] 27. Integration with Notifications Module

Integrate alert delivery with notification system.

- Send critical alerts via SMS, email, push notifications
- Implement multi-channel alert delivery
- Add alert preferences per user
- Integrate with existing notification settings
- Track notification delivery status
- _Requirements: 5.3, 9.1, 9.5_

### - [ ] 28. Integration with Analytics Module

Integrate triage metrics with analytics dashboard.

- Send triage performance metrics to analytics
- Track AI feature usage statistics
- Monitor alert volume and response times
- Generate reports on triage efficiency
- _Requirements: 5.5, 18.1, 18.2, 18.3_

### - [ ] 29. Mobile Responsive Design

Ensure all triage interfaces work on mobile devices.

- Make triage assessment form mobile-friendly
- Optimize risk score monitor for mobile viewing
- Implement mobile-friendly alert notifications
- Test on various screen sizes and devices
- Add touch-friendly controls
- _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

### - [ ] 30. Graceful Degradation Implementation

Implement fallback workflows when AI features are disabled.

- Show manual triage form when AI triage is disabled
- Hide risk scores when risk scoring is disabled
- Display clear indicators of active/inactive features
- Preserve historical AI data when features are disabled
- Provide manual override options for all AI predictions
- _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

---

## Phase 9: Testing and Validation

### - [ ]* 31. Unit Tests for Services

Write comprehensive unit tests for all services.

- Test Triage Service methods
- Test Risk Score Service methods
- Test Early Warning Service methods
- Test AI Feature Manager methods
- Test Alert Service methods
- Achieve >80% code coverage
- _Requirements: All_

### - [ ]* 32. Integration Tests

Write integration tests for API endpoints and workflows.

- Test complete triage assessment flow
- Test risk score update job
- Test alert generation and delivery
- Test feature enable/disable functionality
- Test multi-tenant isolation
- _Requirements: All_

### - [ ]* 33. Performance Testing

Conduct performance testing under load.

- Test 100 concurrent triage assessments
- Test 1000 risk score updates in 15 minutes
- Measure API response times (p95 < 2 seconds)
- Test database query performance
- Identify and optimize bottlenecks
- _Requirements: 11.1, 11.2, 11.3, 11.4_

### - [ ]* 34. Security Testing

Conduct security testing and vulnerability assessment.

- Test authentication and authorization
- Verify multi-tenant data isolation
- Test input validation and SQL injection prevention
- Verify audit logging completeness
- Test admin permission enforcement
- _Requirements: 6.1, 6.2, 6.3, 6.5, 16.2_

### - [ ]* 35. User Acceptance Testing

Conduct UAT with clinical staff.

- Test triage assessment workflow with nurses
- Test risk score monitoring with physicians
- Test alert management with care teams
- Test admin interface with administrators
- Collect feedback and iterate
- _Requirements: All_

---

## Phase 10: ML Model Integration (Future Enhancement)

### - [ ] 36. ML Model Service Implementation

Implement the ML model loading and prediction service.

- Create `backend/src/services/model-service.ts`
- Implement model loading from S3
- Implement prediction execution
- Add model versioning support
- Implement model performance tracking
- Add fallback to rule-based logic if model fails
- _Requirements: 1.4, 7.1, 7.2, 7.3, 7.4, 7.5_

### - [ ] 37. Model Training Pipeline

Set up ML model training pipeline.

- Collect and label 50,000+ historical cases
- Implement data preprocessing and feature engineering
- Train triage classification model (XGBoost/Random Forest)
- Train risk score prediction model
- Train sepsis prediction model
- Validate models on holdout test set
- Deploy models to S3
- _Requirements: 7.1, 7.2, 7.3, 7.4_

### - [ ] 38. Model Monitoring and Retraining

Implement continuous model monitoring and retraining.

- Track model predictions vs. actual outcomes
- Calculate accuracy metrics daily
- Implement automated retraining quarterly
- A/B test new model versions
- Implement model rollback capability
- _Requirements: 8.1, 8.2, 8.3, 13.1, 13.2, 13.3, 13.4, 13.5_

---

## Summary

**Total Tasks**: 38 (30 required, 8 optional)  
**Estimated Timeline**: 5-6 months  
**Team Size**: 3-4 developers (2 backend, 1-2 frontend)

**Phase Breakdown:**
- Phase 1-2: Foundation (2-3 weeks)
- Phase 3-4: Core Features (3-4 weeks)
- Phase 5-7: Admin & Frontend (4-5 weeks)
- Phase 8: Integration (2-3 weeks)
- Phase 9: Testing (2-3 weeks)
- Phase 10: ML Models (ongoing, can be done in parallel)

**Dependencies:**
- Patient Management Module (complete)
- Medical Records Module (complete)
- Notifications Module (complete)
- Analytics Module (complete)
- Staff Management Module (complete)
