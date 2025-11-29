# Phase 9: Frontend Bed Management - Quick Reference

**Last Updated**: November 20, 2025  
**Status**: 40% Complete (2/5 tasks)  
**Next Task**: Task 24 - Discharge Planning Dashboard

---

## 🎯 Quick Navigation

### Completed Interfaces

1. **Bed Status Dashboard** ✅
   - URL: `/bed-management/status`
   - File: `hospital-management-system/app/bed-management/status/page.tsx`
   - Features: Real-time status, unit filtering, auto-refresh, metrics

2. **Smart Bed Assignment** ✅
   - URL: `/bed-management/assignment/smart-assign`
   - File: `hospital-management-system/app/bed-management/assignment/smart-assign/page.tsx`
   - Features: AI recommendations, patient requirements, assignment workflow

### Pending Interfaces

3. **Discharge Planning Dashboard** 📋 NEXT
   - URL: `/bed-management/discharge-planning`
   - Features: Readiness scores, barriers, predictions, interventions

4. **Transfer Priority Dashboard** 📋
   - URL: `/bed-management/transfer-priority`
   - Features: ED patients, transfer optimization, bed availability

5. **Capacity Forecast Dashboard** 📋
   - URL: `/bed-management/capacity-forecast`
   - Features: 24/48/72h forecasts, surge assessment, staffing recommendations

---

## 🚀 Quick Start

### Running the Application

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd hospital-management-system
npm run dev

# Access: http://localhost:3001/bed-management
```

### Testing Completed Features

#### Bed Status Dashboard
1. Navigate to `/bed-management/status`
2. Select unit filter (ICU, Medical, etc.)
3. Observe real-time bed status
4. Toggle auto-refresh
5. View unit metrics table

#### Smart Bed Assignment
1. Navigate to `/bed-management/assignment/smart-assign`
2. Select a patient
3. Check medical requirements
4. Click "Get Recommendations"
5. Review AI recommendations
6. Select a bed
7. Click "Confirm Assignment"

---

## 📊 Progress Tracking

| Task | Status | Lines | Time | Completion |
|------|--------|-------|------|------------|
| 22. Bed Status Dashboard | ✅ | 400+ | 2h | 100% |
| 23. Smart Bed Assignment | ✅ | 600+ | 2h | 100% |
| 24. Discharge Planning | 📋 | - | 3-4d | 0% |
| 25. Transfer Priority | 📋 | - | 3-4d | 0% |
| 26. Capacity Forecast | 📋 | - | 3-4d | 0% |

**Total Progress**: 40% (2/5 tasks complete)

---

## 🔌 API Endpoints Used

### Task 22: Bed Status Dashboard
- `GET /api/bed-management/status/all`
- `GET /api/bed-management/status/:unit`
- `GET /api/bed-management/turnover-metrics`

### Task 23: Smart Bed Assignment
- `GET /api/patients?status=active`
- `POST /api/bed-management/recommend-beds`
- `POST /api/bed-management/assign-bed`

### Task 24: Discharge Planning (Pending)
- `GET /api/bed-management/discharge-readiness/:patientId`
- `GET /api/bed-management/discharge-ready-patients`
- `POST /api/bed-management/discharge-barriers/:admissionId`

### Task 25: Transfer Priority (Pending)
- `GET /api/bed-management/ed-patients`
- `POST /api/bed-management/optimize-transfer/:patientId`
- `GET /api/bed-management/bed-availability/:unit`

### Task 26: Capacity Forecast (Pending)
- `GET /api/bed-management/capacity-forecast/:unit`
- `GET /api/bed-management/capacity-forecast-all`
- `GET /api/bed-management/surge-assessment`
- `GET /api/bed-management/staffing-recommendations/:unit`

---

## 📁 File Structure

```
hospital-management-system/
├── app/
│   └── bed-management/
│       ├── page.tsx                          # Main hub
│       ├── status/
│       │   └── page.tsx                      # ✅ Task 22
│       ├── assignment/
│       │   ├── page.tsx                      # Existing manual assignment
│       │   └── smart-assign/
│       │       └── page.tsx                  # ✅ Task 23
│       ├── discharge-planning/
│       │   └── page.tsx                      # 📋 Task 24
│       ├── transfer-priority/
│       │   └── page.tsx                      # 📋 Task 25
│       └── capacity-forecast/
│           └── page.tsx                      # 📋 Task 26
├── lib/
│   └── api/
│       └── bed-management.ts                 # API client (800+ lines)
└── hooks/
    └── use-bed-status.ts                     # Custom hook
```

---

## 🎨 Design Patterns

### Common Layout Structure
```typescript
<div className="container mx-auto p-6 space-y-6">
  {/* Header */}
  <div>
    <h1 className="text-3xl font-bold">Dashboard Title</h1>
    <p className="text-muted-foreground">Description</p>
  </div>

  {/* Filters/Controls */}
  <Card>
    <CardHeader>
      <CardTitle>Filters</CardTitle>
    </CardHeader>
    <CardContent>
      {/* Filter controls */}
    </CardContent>
  </Card>

  {/* Summary Metrics */}
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {/* Metric cards */}
  </div>

  {/* Main Content */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    {/* Content cards */}
  </div>
</div>
```

### Common Features
- Real-time data fetching
- Auto-refresh capability
- Loading skeletons
- Error handling with alerts
- Empty states
- Responsive design
- Toast notifications

---

## 🧪 Testing Checklist

### For Each Dashboard

- [ ] Page loads without errors
- [ ] Data fetches from backend
- [ ] Loading states display correctly
- [ ] Error states show clear messages
- [ ] Empty states provide guidance
- [ ] Filters work as expected
- [ ] Actions complete successfully
- [ ] Success/error notifications appear
- [ ] Responsive on mobile/tablet/desktop
- [ ] Navigation works correctly

---

## 📝 Development Guidelines

### Adding a New Dashboard

1. **Create Page File**
   ```bash
   mkdir -p hospital-management-system/app/bed-management/new-dashboard
   touch hospital-management-system/app/bed-management/new-dashboard/page.tsx
   ```

2. **Basic Structure**
   ```typescript
   'use client';
   import React, { useState, useEffect } from 'react';
   // Import UI components
   
   const NewDashboard: React.FC = () => {
     const [data, setData] = useState([]);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState<string | null>(null);
     
     useEffect(() => {
       fetchData();
     }, []);
     
     const fetchData = async () => {
       // Fetch logic
     };
     
     return (
       <div className="container mx-auto p-6 space-y-6">
         {/* Dashboard content */}
       </div>
     );
   };
   
   export default NewDashboard;
   ```

3. **Add Navigation**
   - Update main bed management page
   - Add link/button to new dashboard

4. **Test Integration**
   - Verify API calls work
   - Test all user interactions
   - Check responsive design

---

## 🎯 Success Criteria

### Phase 9 Complete When:
- [ ] All 5 dashboards implemented
- [ ] All backend APIs integrated
- [ ] Responsive design verified
- [ ] Error handling comprehensive
- [ ] Loading states implemented
- [ ] User testing completed
- [ ] Documentation updated

### Current Status:
- [x] 2/5 dashboards complete
- [x] Backend APIs ready
- [x] Design patterns established
- [x] Component library utilized
- [ ] 3 dashboards remaining

---

## 📚 Resources

### Documentation
- Main Progress: `docs/BED_OPTIMIZATION_PHASE_9_PROGRESS.md`
- Task 22 Complete: `docs/BED_OPTIMIZATION_PHASE_9_TASK_22_COMPLETE.md`
- Task 23 Complete: `docs/BED_OPTIMIZATION_PHASE_9_TASK_23_COMPLETE.md`

### Backend References
- Phase 1-8 Complete: All backend APIs operational
- API Documentation: `docs/BED_OPTIMIZATION_COMPLETE_JOURNEY.md`
- Testing Scripts: `backend/scripts/test-bed-optimization-phase*.js`

### UI Components
- Shadcn/ui: https://ui.shadcn.com/
- Radix UI: https://www.radix-ui.com/
- Tailwind CSS: https://tailwindcss.com/

---

**Phase 9 Status**: 40% Complete  
**Next Milestone**: Task 24 - Discharge Planning Dashboard  
**Estimated Completion**: Week 5 (on track)
