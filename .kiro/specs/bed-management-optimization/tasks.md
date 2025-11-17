# Implementation Plan: Intelligent Bed Management & Patient Flow Optimization

This implementation plan breaks down the development of the AI-powered bed management system into discrete, manageable tasks. Each task builds incrementally on previous work and includes specific requirements references.

## Task Organization

Tasks are organized into major phases with clear dependencies. Optional tasks (marked with *) focus on testing and optimization that can be deferred for MVP.

---

## Phase 1: Foundation and Database Setup

### - [ ] 1. Database Schema Implementation

Create the database tables and indexes required for bed management functionality.

- Create migration file for bed management tables
- Implement `los_predictions` table with admission references
- Implement `bed_assignments` table with isolation tracking
- Implement `discharge_readiness_predictions` table with barrier tracking
- Create `transfer_priorities` table with ED patient prioritization
- Create `capacity_forecasts` table with unit-level forecasting
- Create `bed_turnover_metrics` table for housekeeping coordination
- Create `bed_management_performance` table for metrics tracking
- Add appropriate indexes for query performance
- Add foreign key constraints and validation rules
- _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 8.1, 8.2, 8.3_

### - [ ] 2. TypeScript Type Definitions

Define TypeScript interfaces and types for the bed management system.

- Create `backend/src/types/bed-management.ts` with core interfaces
- Define `PatientAdmission`, `LOSPrediction` interfaces
- Define `BedRequirements`, `BedRecommendation`, `BedStatus` interfaces
- Define `DischargeReadiness`, `DischargeBarrier`, `Intervention` interfaces
- Define `TransferPriority`, `CapacityForecast`, `StaffingRecommendation` interfaces
- Define `BedManagementFeature` enum for feature management
- Create Zod validation schemas for API inputs
- Export all types for use across backend and frontend
- _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 11.3_

### - [ ] 3. AI Feature Manager Service (Shared/Extended)

Implement or extend the AI feature manager for bed management features.

- Extend `backend/src/services/ai-feature-manager.ts` for bed management
- Add support for bed management features (los_prediction, bed_assignment_optimization, discharge_readiness, transfer_optimization, capacity_forecasting)
- Implement feature status checking with caching
- Implement enable/disable methods with audit logging
- Add database queries with tenant isolation
- Add Redis caching for feature status
- _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 12.1, 12.2_

---

## Phase 2: Length of Stay (LOS) Prediction

### - [ ] 4. LOS Prediction Service Implementation

Implement the core length of stay prediction service.

- Create `backend/src/services/los-prediction-service.ts`
- Implement `predictLOS(patientData)` method with rule-based logic for MVP
- Calculate based on diagnosis, severity, age, comorbidities, admission source
- Implement `updatePrediction(admissionId)` method for daily updates
- Provide confidence intervals for predictions
- Store predictions in database with timestamps
- Track actual LOS vs. predicted for accuracy metrics
- _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

### - [ ] 5. LOS Prediction API Endpoints

Create REST API endpoints for LOS prediction functionality.

- Create `backend/src/routes/bed-management.ts`
- Implement `POST /api/bed-management/predict-los` endpoint
- Implement `GET /api/bed-management/los/:admissionId` endpoint
- Implement `PUT /api/bed-management/los/:admissionId/actual` endpoint
- Implement `GET /api/bed-management/los/accuracy-metrics` endpoint
- Add authentication and tenant middleware
- Add input validation using Zod schemas
- Add rate limiting (200 requests/minute per tenant)
- _Requirements: 1.1, 1.2, 1.5, 16.1, 16.2_

### - [ ] 6. Daily LOS Update Job

Implement scheduled job for updating LOS predictions daily.

- Create `backend/src/jobs/los-updater.ts`
- Implement job scheduler using node-cron
- Retrieve all active admissions per tenant
- Call LOS Prediction Service for batch updates
- Update predictions as patient condition changes
- Log job execution and performance metrics
- Handle errors gracefully
- _Requirements: 1.4, 16.3_

---

## Phase 3: Bed Assignment Optimization

### - [ ] 7. Bed Assignment Optimizer Service Implementation

Implement the optimal bed assignment service.

- Create `backend/src/services/bed-assignment-optimizer.ts`
- Implement `recommendBeds(patientRequirements)` method
- Implement `scoreBed(bedId, requirements)` method
- Consider patient needs (isolation, telemetry, oxygen, proximity)
- Enforce infection control requirements
- Consider specialty unit requirements and staff ratios
- Return top 3 bed recommendations with reasoning
- Store assignment decisions in database
- _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 14.1, 14.2, 14.3_

### - [ ] 8. Isolation Requirements Checker

Implement service for checking and enforcing isolation requirements.

- Create `backend/src/services/isolation-checker.ts`
- Implement `checkIsolationRequirements(patientId)` method
- Identify patients requiring isolation based on diagnoses and lab results
- Determine isolation type (contact, droplet, airborne)
- Track isolation room availability by type
- Prevent inappropriate bed assignments
- _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

### - [ ] 9. Bed Assignment API Endpoints

Create REST API endpoints for bed assignment.

- Create routes in `backend/src/routes/bed-management.ts`
- Implement `POST /api/bed-management/recommend-beds` endpoint
- Implement `POST /api/bed-management/assign-bed` endpoint
- Implement `GET /api/bed-management/beds/available` endpoint
- Implement `GET /api/bed-management/isolation-rooms` endpoint
- Add authentication and tenant middleware
- Add input validation
- _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 14.1, 14.2_

---

## Phase 4: Bed Status Tracking

### - [ ] 10. Bed Status Tracker Service Implementation

Implement real-time bed status tracking service.

- Create `backend/src/services/bed-status-tracker.ts`
- Implement `getBedStatus(unit)` method for real-time status
- Implement `updateBedStatus(bedId, status)` method
- Track bed turnover times
- Coordinate with housekeeping for cleaning status
- Alert when turnover exceeds target times
- _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 15.1, 15.2, 15.3_

### - [ ] 11. Bed Status API Endpoints

Create REST API endpoints for bed status management.

- Create routes in `backend/src/routes/bed-management.ts`
- Implement `GET /api/bed-management/status/:unit` endpoint
- Implement `PUT /api/bed-management/status/:bedId` endpoint
- Implement `GET /api/bed-management/turnover-metrics` endpoint
- Implement WebSocket endpoint for real-time status updates
- Add authentication and tenant middleware
- _Requirements: 6.1, 6.2, 6.3, 15.1, 15.2_

### - [ ] 12. Bed Turnover Optimization

Implement bed turnover optimization and housekeeping coordination.

- Extend bed status tracker with turnover optimization
- Implement `prioritizeCleaning(beds)` method
- Predict which beds will become available based on discharge predictions
- Alert housekeeping for expedited cleaning
- Track actual vs. target turnover times
- Optimize housekeeping staff allocation
- _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

---

## Phase 5: Discharge Readiness Prediction

### - [ ] 13. Discharge Readiness Predictor Service Implementation

Implement the discharge readiness prediction service.

- Create `backend/src/services/discharge-readiness-predictor.ts`
- Implement `predictDischargeReadiness(patientId)` method
- Calculate medical and social readiness scores
- Implement `identifyBarriers(patientId)` method
- Implement `suggestInterventions(barriers)` method
- Track discharge planning progress
- Store predictions in database
- _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 17.1, 17.2, 17.3_

### - [ ] 14. Discharge Readiness API Endpoints

Create REST API endpoints for discharge readiness.

- Create routes in `backend/src/routes/bed-management.ts`
- Implement `GET /api/bed-management/discharge-readiness/:patientId` endpoint
- Implement `GET /api/bed-management/discharge-ready-patients` endpoint
- Implement `POST /api/bed-management/discharge-barriers/:patientId` endpoint
- Implement `GET /api/bed-management/discharge-metrics` endpoint
- Add authentication and tenant middleware
- _Requirements: 3.1, 3.2, 3.3, 17.1, 17.2, 17.4, 17.5_

---

## Phase 6: Transfer Optimization

### - [ ] 15. Transfer Optimizer Service Implementation

Implement the ED-to-ward transfer optimization service.

- Create `backend/src/services/transfer-optimizer.ts`
- Implement `prioritizeEDPatients(edPatients)` method
- Score patients based on acuity and wait time
- Implement `predictBedAvailability(unit, hours)` method
- Implement `optimizeTransferTiming(patientId)` method
- Notify receiving units of incoming transfers
- Track transfer completion and boarding time
- _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

### - [ ] 16. Transfer Optimizer API Endpoints

Create REST API endpoints for transfer optimization.

- Create routes in `backend/src/routes/bed-management.ts`
- Implement `GET /api/bed-management/transfer-priorities` endpoint
- Implement `POST /api/bed-management/optimize-transfer` endpoint
- Implement `GET /api/bed-management/bed-availability/:unit` endpoint
- Implement `POST /api/bed-management/notify-transfer` endpoint
- Add authentication and tenant middleware
- _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

---

## Phase 7: Capacity Forecasting

### - [ ] 17. Capacity Forecaster Service Implementation

Implement the capacity forecasting service.

- Create `backend/src/services/capacity-forecaster.ts`
- Implement `forecastCapacity(unit, hours)` method
- Analyze historical admission patterns
- Recognize seasonal patterns and day-of-week trends
- Implement `recommendStaffing(forecast)` method
- Implement `assessSurgeNeed(forecast)` method
- Store forecasts in database
- _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 18.1, 18.2, 18.3_

### - [ ] 18. Capacity Forecasting API Endpoints

Create REST API endpoints for capacity forecasting.

- Create routes in `backend/src/routes/bed-management.ts`
- Implement `GET /api/bed-management/capacity-forecast/:unit` endpoint
- Implement `GET /api/bed-management/capacity-forecast/all-units` endpoint
- Implement `GET /api/bed-management/surge-assessment` endpoint
- Implement `GET /api/bed-management/staffing-recommendations` endpoint
- Add authentication and tenant middleware
- _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 18.1, 18.2_

### - [ ] 19. Capacity Forecasting Job

Implement scheduled job for generating capacity forecasts.

- Create `backend/src/jobs/capacity-forecaster.ts`
- Implement job running every 6 hours
- Generate forecasts for 24, 48, and 72 hours ahead
- Calculate for all units
- Alert if surge capacity needed
- Log job execution and performance
- _Requirements: 5.1, 5.2, 5.5, 18.1, 18.2_

---

## Phase 8: Admin Interface - Backend

### - [ ] 20. AI Feature Management API Endpoints

Create admin API endpoints for managing bed management features.

- Create `backend/src/routes/bed-management-admin.ts`
- Implement `GET /api/bed-management/admin/features` endpoint
- Implement `POST /api/bed-management/admin/features/:feature/enable` endpoint
- Implement `POST /api/bed-management/admin/features/:feature/disable` endpoint
- Implement `GET /api/bed-management/admin/audit-log` endpoint
- Add admin-only permission checks
- _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 12.1, 12.2, 12.3, 12.4, 12.5_

### - [ ] 21. Performance Metrics API Endpoints

Create admin API endpoints for viewing performance metrics.

- Create routes in `backend/src/routes/bed-management-admin.ts`
- Implement `GET /api/bed-management/admin/metrics/los-accuracy` endpoint
- Implement `GET /api/bed-management/admin/metrics/bed-utilization` endpoint
- Implement `GET /api/bed-management/admin/metrics/ed-boarding` endpoint
- Implement `GET /api/bed-management/admin/metrics/capacity-forecast` endpoint
- Implement `GET /api/bed-management/admin/metrics/export` endpoint
- Add admin-only permission checks
- _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

---

## Phase 9: Frontend - Bed Management Interface

### - [ ] 22. Bed Status Dashboard

Create real-time bed status dashboard.

- Create `hospital-management-system/app/bed-management/status/page.tsx`
- Create `hospital-management-system/components/bed-management/bed-status-card.tsx`
- Display real-time bed status by unit
- Show bed features and isolation capabilities
- Display estimated availability times
- Implement filtering by unit, status, features
- Add real-time updates (WebSocket or polling)
- _Requirements: 6.1, 6.2, 6.3, 6.4_

### - [ ] 23. Bed Assignment Interface

Create interface for bed assignment recommendations.

- Create `hospital-management-system/app/bed-management/assign/page.tsx`
- Create `hospital-management-system/components/bed-management/bed-recommendation-card.tsx`
- Implement patient selection and requirements input
- Display top 3 bed recommendations with scores
- Show reasoning for each recommendation
- Implement bed assignment confirmation
- Display isolation requirements and alerts
- _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 14.1, 14.2_

### - [ ] 24. Discharge Planning Dashboard

Create dashboard for discharge planning and readiness.

- Create `hospital-management-system/app/bed-management/discharge/page.tsx`
- Display patients predicted to be discharge-ready soon
- Show discharge barriers and interventions
- Display medical and social readiness scores
- Implement filtering and sorting
- Track discharge planning progress
- _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 17.1, 17.2, 17.3_

### - [ ] 25. Transfer Priority Dashboard

Create dashboard for ED-to-ward transfer management.

- Create `hospital-management-system/app/bed-management/transfers/page.tsx`
- Display ED patients awaiting transfer with priority scores
- Show predicted bed availability
- Display transfer urgency indicators
- Implement transfer coordination workflow
- Track ED boarding times
- _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

### - [ ] 26. Capacity Forecast Dashboard

Create capacity forecasting dashboard.

- Create `hospital-management-system/app/bed-management/capacity/page.tsx`
- Display capacity forecasts for 24, 48, 72 hours
- Show predicted census by unit
- Display bed utilization trends
- Show staffing recommendations
- Alert for surge capacity needs
- Implement date range selection
- _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 18.1, 18.2_

---

## Phase 10: Frontend - Admin Interface

### - [ ] 27. Bed Management Feature Management UI

Create admin interface for managing bed management features.

- Create `hospital-management-system/app/admin/bed-management-features/page.tsx`
- Display all bed management features with current status
- Implement toggle switches for each feature
- Add confirmation dialog when disabling features
- Require reason input for feature changes
- Show last modified timestamp and admin name
- _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 12.2, 12.3, 12.4, 12.5_

### - [ ] 28. Bed Management Performance Dashboard

Create performance monitoring dashboard for administrators.

- Create `hospital-management-system/app/admin/bed-management-performance/page.tsx`
- Display LOS prediction accuracy metrics
- Show bed utilization rates and trends
- Display ED boarding time metrics
- Show capacity forecast accuracy
- Display discharge delay metrics
- Implement date range selection
- _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

---

## Phase 11: Integration and Polish

### - [ ] 29. Integration with Bed Management Module

Integrate AI features with existing bed management module.

- Retrieve current bed assignments and status
- Update bed assignments with AI recommendations
- Store predictions in bed management database
- Integrate with housekeeping systems
- _Requirements: 7.1, 7.2, 7.3, 7.4_

### - [ ] 30. Integration with Medical Records Module

Integrate with medical records for clinical data.

- Retrieve patient diagnoses and severity scores
- Access lab results for isolation requirements
- Pull vital signs for acuity assessment
- Store predictions in patient records
- _Requirements: 7.2, 7.3, 14.1_

### - [ ] 31. Integration with Notifications Module

Integrate alerts with notification system.

- Send capacity alerts to administrators
- Notify receiving units of transfers
- Alert housekeeping for priority cleaning
- Send surge capacity warnings
- _Requirements: 7.5, 4.5, 15.4, 18.2_

### - [ ] 32. Mobile Responsive Design

Ensure all bed management interfaces work on mobile devices.

- Make bed status dashboard mobile-friendly
- Optimize bed assignment interface for mobile
- Implement mobile-friendly capacity dashboard
- Test on various screen sizes
- _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

### - [ ] 33. Graceful Degradation Implementation

Implement fallback workflows when AI features are disabled.

- Allow manual LOS estimation when prediction disabled
- Use rule-based bed assignment when optimization disabled
- Display historical averages when forecasting disabled
- Show clear indicators of active/inactive features
- _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

---

## Phase 12: Testing and Validation

### - [ ]* 34. Unit Tests

Write comprehensive unit tests for all services.

- Test LOS Prediction Service methods
- Test Bed Assignment Optimizer methods
- Test Discharge Readiness Predictor methods
- Test Transfer Optimizer methods
- Test Capacity Forecaster methods
- Achieve >80% code coverage
- _Requirements: All_

### - [ ]* 35. Integration Tests

Write integration tests for API endpoints and workflows.

- Test complete bed assignment workflow
- Test LOS prediction update cycle
- Test transfer prioritization flow
- Test capacity forecast generation
- Test multi-tenant isolation
- _Requirements: All_

### - [ ]* 36. Performance Testing

Conduct performance testing under load.

- Test 200 concurrent bed assignment requests
- Test daily LOS updates for 1000+ patients
- Measure API response times
- Test database query performance
- _Requirements: 16.1, 16.2, 16.3, 16.4_

### - [ ]* 37. Accuracy Validation

Validate prediction accuracy with historical data.

- Test LOS prediction accuracy (±1 day for 70%)
- Validate bed assignment appropriateness
- Test discharge readiness prediction accuracy
- Validate capacity forecast accuracy
- _Requirements: 1.2, 10.1, 10.2_

---

## Summary

**Total Tasks**: 37 (33 required, 4 optional)  
**Estimated Timeline**: 6-8 months  
**Team Size**: 3-4 developers (2 backend, 1-2 frontend)

**Phase Breakdown:**
- Phase 1-2: Foundation & LOS Prediction (2-3 weeks)
- Phase 3-4: Bed Assignment & Status (3-4 weeks)
- Phase 5-6: Discharge & Transfer (3-4 weeks)
- Phase 7: Capacity Forecasting (2-3 weeks)
- Phase 8: Admin Backend (2 weeks)
- Phase 9: Bed Management Frontend (4-5 weeks)
- Phase 10: Admin Frontend (2-3 weeks)
- Phase 11: Integration (2-3 weeks)
- Phase 12: Testing (2-3 weeks)

**Dependencies:**
- Bed Management Module (complete)
- Medical Records Module (complete)
- Patient Management Module (complete)
- Notifications Module (complete)

**Expected Impact:**
- 25-35% improvement in bed utilization
- 30% reduction in ED boarding time
- 20% reduction in hospital-acquired infections
- $500,000-$1M annual revenue from increased capacity
