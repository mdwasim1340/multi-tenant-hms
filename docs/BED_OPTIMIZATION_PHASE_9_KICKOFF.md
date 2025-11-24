# Bed Management Optimization - Phase 9 Kickoff

## 🎯 Phase 9: Frontend - Bed Management Interface

**Status**: 🚀 READY TO START  
**Estimated Duration**: 4-5 weeks  
**Team Size**: 1-2 frontend developers  
**Prerequisites**: ✅ All backend phases complete (Phases 1-8)

---

## 📋 Overview

Phase 9 implements the user-facing interfaces for all bed management features. This phase connects the powerful backend AI services to intuitive, real-time dashboards that enable hospital staff to optimize bed utilization, manage patient flow, and improve operational efficiency.

---

## 🎯 Objectives

### Primary Goals
1. **Real-Time Visibility**: Display current bed status across all units
2. **AI-Powered Recommendations**: Show bed assignment suggestions with reasoning
3. **Proactive Planning**: Display discharge readiness and capacity forecasts
4. **Transfer Optimization**: Prioritize ED-to-ward transfers effectively
5. **Data-Driven Decisions**: Provide actionable insights through visualizations

### Success Criteria
- All 5 dashboards fully functional
- Real-time data updates (polling or WebSocket)
- Responsive design (desktop, tablet, mobile)
- Intuitive user experience
- Performance: Page load < 2 seconds
- Zero data leakage between tenants

---

## 📊 Deliverables (5 Dashboards)

### 1. Bed Status Dashboard (Task 22)
**File**: `hospital-management-system/app/bed-management/status/page.tsx`

**Features**:
- Real-time bed availability by unit
- Bed features display (telemetry, oxygen, isolation)
- Estimated availability times
- Filtering by unit, status, features
- Color-coded status indicators
- Auto-refresh every 30 seconds

**API Integration**:
- `GET /api/bed-management/status/:unit` - Get unit status
- `GET /api/bed-management/turnover-metrics` - Get turnover times

**Components**:
- `BedStatusCard` - Individual bed display
- `UnitFilter` - Unit selection dropdown
- `StatusLegend` - Color code explanation
- `AvailabilityTimeline` - Predicted availability

**Requirements**: 6.1, 6.2, 6.3, 6.4

---

### 2. Bed Assignment Interface (Task 23)
**File**: `hospital-management-system/app/bed-management/assign/page.tsx`

**Features**:
- Patient selection dropdown
- Requirements input form (isolation, telemetry, etc.)
- Top 3 bed recommendations with scores
- Reasoning display for each recommendation
- Assignment confirmation workflow
- Isolation alerts and warnings

**API Integration**:
- `POST /api/bed-management/recommend-beds` - Get recommendations
- `POST /api/bed-management/assign-bed` - Confirm assignment
- `GET /api/bed-management/beds/available` - Get available beds
- `GET /api/bed-management/isolation-rooms` - Get isolation rooms

**Components**:
- `PatientSelector` - Patient search/select
- `RequirementsForm` - Bed requirements input
- `BedRecommendationCard` - Recommendation display
- `AssignmentConfirmation` - Confirmation dialog
- `IsolationAlert` - Isolation warnings

**Requirements**: 2.1, 2.2, 2.3, 2.4, 2.5, 14.1, 14.2

---

### 3. Discharge Planning Dashboard (Task 24)
**File**: `hospital-management-system/app/bed-management/discharge/page.tsx`

**Features**:
- List of discharge-ready patients
- Medical and social readiness scores
- Discharge barriers display
- Recommended interventions
- Progress tracking
- Filtering and sorting

**API Integration**:
- `GET /api/bed-management/discharge-ready-patients` - Get ready patients
- `GET /api/bed-management/discharge-readiness/:patientId` - Get details
- `POST /api/bed-management/discharge-barriers/:admissionId` - Update barriers

**Components**:
- `DischargeReadyList` - Patient list
- `ReadinessScoreCard` - Score display
- `BarriersList` - Barriers display
- `InterventionsList` - Interventions display
- `ProgressTracker` - Progress indicator

**Requirements**: 3.1, 3.2, 3.3, 3.4, 3.5, 17.1, 17.2, 17.3

---

### 4. Transfer Priority Dashboard (Task 25)
**File**: `hospital-management-system/app/bed-management/transfers/page.tsx`

**Features**:
- ED patient queue with priority scores
- Transfer urgency indicators
- Predicted bed availability
- Transfer coordination workflow
- ED boarding time tracking
- Real-time updates

**API Integration**:
- `GET /api/bed-management/ed-patients` - Get ED patients
- `POST /api/bed-management/optimize-transfer/:patientId` - Optimize transfer
- `GET /api/bed-management/bed-availability/:unit` - Get availability
- `POST /api/bed-management/notify-transfer/:admissionId` - Notify transfer

**Components**:
- `EDPatientQueue` - Patient list with priorities
- `UrgencyIndicator` - Visual urgency display
- `BedAvailabilityPredictor` - Availability timeline
- `TransferWorkflow` - Transfer coordination
- `BoardingTimeTracker` - Time tracking

**Requirements**: 4.1, 4.2, 4.3, 4.4, 4.5

---

### 5. Capacity Forecast Dashboard (Task 26)
**File**: `hospital-management-system/app/bed-management/capacity/page.tsx`

**Features**:
- Multi-timeframe forecasts (24h, 48h, 72h)
- Predicted census by unit
- Bed utilization trends (charts)
- Staffing recommendations
- Surge capacity alerts
- Date range selection

**API Integration**:
- `GET /api/bed-management/capacity-forecast/:unit` - Get unit forecast
- `GET /api/bed-management/capacity-forecast-all` - Get all units
- `GET /api/bed-management/surge-assessment` - Get surge status
- `GET /api/bed-management/staffing-recommendations/:unit` - Get staffing

**Components**:
- `ForecastChart` - Capacity visualization
- `UnitForecastCard` - Unit-specific forecast
- `StaffingRecommendations` - Staffing display
- `SurgeAlert` - Surge warnings
- `DateRangeSelector` - Date picker

**Requirements**: 5.1, 5.2, 5.3, 5.4, 5.5, 18.1, 18.2

---

## 🛠️ Technical Stack

### Frontend Framework
- **Next.js 16**: App Router with React 19
- **TypeScript**: Strict mode for type safety
- **Tailwind CSS 4**: Utility-first styling
- **Radix UI**: Accessible component primitives

### State Management
- **React Hooks**: useState, useEffect, useContext
- **Custom Hooks**: Reusable data fetching logic
- **SWR or React Query**: Data fetching and caching

### Data Visualization
- **Recharts**: Charts and graphs
- **Lucide Icons**: Icon library
- **Framer Motion**: Animations (optional)

### Real-Time Updates
- **Polling**: Every 30-60 seconds
- **WebSocket**: Future enhancement
- **SWR**: Automatic revalidation

---

## 📁 File Structure

```
hospital-management-system/
├── app/
│   └── bed-management/
│       ├── status/
│       │   └── page.tsx (Task 22)
│       ├── assign/
│       │   └── page.tsx (Task 23)
│       ├── discharge/
│       │   └── page.tsx (Task 24)
│       ├── transfers/
│       │   └── page.tsx (Task 25 - already exists, needs update)
│       └── capacity/
│           └── page.tsx (Task 26)
├── components/
│   └── bed-management/
│       ├── bed-status-card.tsx
│       ├── bed-recommendation-card.tsx
│       ├── discharge-ready-list.tsx
│       ├── ed-patient-queue.tsx
│       ├── forecast-chart.tsx
│       ├── unit-filter.tsx
│       ├── status-legend.tsx
│       ├── patient-selector.tsx
│       ├── requirements-form.tsx
│       ├── readiness-score-card.tsx
│       ├── barriers-list.tsx
│       ├── urgency-indicator.tsx
│       ├── staffing-recommendations.tsx
│       └── surge-alert.tsx
├── hooks/
│   └── use-bed-management.ts (already exists, needs extension)
└── lib/
    └── api/
        └── bed-management.ts (new API client)
```

---

## 🔄 Development Workflow

### Week 1: Bed Status Dashboard
**Days 1-2**: Setup and API integration
- Create API client functions
- Set up custom hooks
- Test API connectivity

**Days 3-5**: UI implementation
- Build BedStatusCard component
- Implement filtering
- Add real-time updates
- Test responsiveness

### Week 2: Bed Assignment Interface
**Days 1-2**: Form and patient selection
- Build PatientSelector
- Create RequirementsForm
- Implement validation

**Days 3-5**: Recommendations display
- Build BedRecommendationCard
- Implement assignment workflow
- Add confirmation dialogs
- Test isolation alerts

### Week 3: Discharge & Transfer Dashboards
**Days 1-2**: Discharge Planning
- Build DischargeReadyList
- Create ReadinessScoreCard
- Implement barriers display

**Days 3-5**: Transfer Priority
- Update existing transfers page
- Add priority queue
- Implement urgency indicators
- Add boarding time tracking

### Week 4: Capacity Forecast Dashboard
**Days 1-3**: Charts and forecasts
- Build ForecastChart
- Create UnitForecastCard
- Implement date range selection

**Days 4-5**: Staffing and alerts
- Build StaffingRecommendations
- Create SurgeAlert
- Test all visualizations

### Week 5: Integration & Polish
**Days 1-2**: Integration testing
- Test all dashboards together
- Verify data consistency
- Test multi-tenant isolation

**Days 3-5**: Polish and optimization
- Improve performance
- Enhance UX
- Fix bugs
- Update documentation

---

## 🎨 Design Guidelines

### Color Scheme
- **Available**: Green (#10B981)
- **Occupied**: Blue (#3B82F6)
- **Cleaning**: Yellow (#F59E0B)
- **Maintenance**: Orange (#F97316)
- **Reserved**: Purple (#8B5CF6)
- **Urgent**: Red (#EF4444)

### Status Indicators
- **High Priority**: Red badge
- **Medium Priority**: Yellow badge
- **Low Priority**: Green badge
- **Isolation Required**: Red border + icon

### Typography
- **Headings**: Font weight 600-700
- **Body**: Font weight 400
- **Metrics**: Font weight 500, larger size
- **Labels**: Font weight 500, smaller size

### Spacing
- **Card padding**: 1.5rem (24px)
- **Section spacing**: 2rem (32px)
- **Component gap**: 1rem (16px)
- **Grid gap**: 1.5rem (24px)

---

## 🔐 Security Considerations

### Multi-Tenant Isolation
- Always include `X-Tenant-ID` header
- Validate tenant context on every request
- Never expose other tenants' data
- Test cross-tenant isolation

### Authentication
- Verify user permissions
- Check feature enablement
- Handle unauthorized access gracefully
- Redirect to login if token expired

### Data Validation
- Validate all user inputs
- Sanitize data before display
- Handle API errors gracefully
- Show user-friendly error messages

---

## 🧪 Testing Strategy

### Unit Tests
- Test individual components
- Test custom hooks
- Test utility functions
- Achieve >80% coverage

### Integration Tests
- Test API integration
- Test data flow
- Test user workflows
- Test error scenarios

### E2E Tests
- Test complete user journeys
- Test multi-dashboard navigation
- Test real-time updates
- Test responsive design

### Performance Tests
- Measure page load times
- Test with large datasets
- Monitor memory usage
- Optimize rendering

---

## 📊 Success Metrics

### Functional Metrics
- All 5 dashboards operational
- All API integrations working
- Real-time updates functioning
- Responsive on all devices

### Performance Metrics
- Page load < 2 seconds
- API response < 500ms
- Smooth animations (60fps)
- Memory usage < 100MB

### User Experience Metrics
- Intuitive navigation
- Clear data visualization
- Helpful error messages
- Accessible (WCAG 2.1 AA)

---

## 🚀 Getting Started

### Prerequisites
1. ✅ Backend server running (port 3000)
2. ✅ All Phase 1-8 APIs operational
3. ✅ Database with test data
4. ✅ Frontend development environment

### Setup Steps
```bash
# 1. Navigate to frontend
cd hospital-management-system

# 2. Install dependencies (if needed)
npm install

# 3. Start development server
npm run dev

# 4. Open browser
# http://localhost:3001/bed-management/status
```

### First Task: Bed Status Dashboard
1. Create `app/bed-management/status/page.tsx`
2. Create `components/bed-management/bed-status-card.tsx`
3. Create API client in `lib/api/bed-management.ts`
4. Create custom hook in `hooks/use-bed-status.ts`
5. Test with real backend data

---

## 📚 Resources

### Documentation
- Backend API docs: `docs/BED_OPTIMIZATION_PHASE_*_COMPLETE.md`
- Tasks file: `.kiro/specs/bed-management-optimization/tasks.md`
- Requirements: `.kiro/specs/bed-management-optimization/requirements.md`
- Design: `.kiro/specs/bed-management-optimization/design.md`

### API Endpoints Reference
- Bed Status: `/api/bed-management/status/*`
- Bed Assignment: `/api/bed-management/recommend-beds`
- Discharge: `/api/bed-management/discharge-*`
- Transfer: `/api/bed-management/ed-patients`
- Capacity: `/api/bed-management/capacity-forecast/*`

### Component Libraries
- Radix UI: https://www.radix-ui.com/
- Tailwind CSS: https://tailwindcss.com/
- Recharts: https://recharts.org/
- Lucide Icons: https://lucide.dev/

---

## 🎓 Key Considerations

### Performance
- Use React.memo for expensive components
- Implement virtual scrolling for long lists
- Lazy load charts and heavy components
- Optimize images and assets

### Accessibility
- Use semantic HTML
- Add ARIA labels
- Support keyboard navigation
- Test with screen readers

### Error Handling
- Show loading states
- Display error messages
- Provide retry options
- Log errors for debugging

### Real-Time Updates
- Start with polling (30-60s)
- Plan for WebSocket upgrade
- Handle connection failures
- Show last update time

---

## 🎉 Phase 9 Ready to Start!

All backend services are complete and operational. The foundation is solid, and we're ready to build intuitive, powerful user interfaces that will transform hospital bed management.

**Next Step**: Begin Task 22 - Bed Status Dashboard

---

**Phase 9 Status**: 🚀 READY TO START  
**Backend Status**: ✅ COMPLETE (Phases 1-8)  
**Overall Progress**: 8/12 phases complete (67%)  
**Estimated Completion**: 4-5 weeks from start
