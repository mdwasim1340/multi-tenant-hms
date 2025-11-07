# Week 2, Day 4, Task 3: GET /api/appointments/availability - Check Doctor Availability

## 🎯 Task Objective
Implement endpoint to check doctor availability for scheduling.

## ⏱️ Estimated Time: 2 hours

## 📝 Step 1: Add Availability Controller

Update `backend/src/controllers/appointment.controller.ts`:

```typescript
export const getDoctorAvailability = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const { doctor_id, date, duration_minutes } = req.query;
  
  // Validate required parameters
  if (!doctor_id || !date) {
    throw new ValidationError('doctor_id and date are required');
  }
  
  const doctorId = parseInt(doctor_id as string);
  const dateStr = date as string;
  const duration = duration_minutes ? parseInt(duration_minutes as string) : 30;
  
  if (isNaN(doctorId)) {
    throw new ValidationError('Invalid doctor_id');
  }
  
  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) {
    throw new ValidationError('Invalid date format. Use YYYY-MM-DD');
  }
  
  // Get availability
  const availability = await schedulingService.getDoctorAvailability(
    doctorId,
    dateStr,
    duration,
    tenantId
  );
  
  res.json({
    success: true,
    data: { availability }
  });
});

export const getWeeklyAvailability = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const { doctor_id, start_date } = req.query;
  
  if (!doctor_id || !start_date) {
    throw new ValidationError('doctor_id and start_date are required');
  }
  
  const doctorId = parseInt(doctor_id as string);
  const startDateStr = start_date as string;
  
  if (isNaN(doctorId)) {
    throw new ValidationError('Invalid doctor_id');
  }
  
  // Get weekly availability
  const availability = await schedulingService.getWeeklyAvailability(
    doctorId,
    startDateStr,
    tenantId
  );
  
  res.json({
    success: true,
    data: { availability }
  });
});
```

## 📝 Step 2: Add Routes

Update `backend/src/routes/appointments.routes.ts`:

```typescript
import { 
  getAppointments, 
  createAppointment, 
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
  getDoctorAvailability,
  getWeeklyAvailability
} from '../controllers/appointment.controller';

// Availability routes (before :id route to avoid conflicts)
router.get('/availability/daily', getDoctorAvailability);
router.get('/availability/weekly', getWeeklyAvailability);

// Standard CRUD routes
router.get('/', getAppointments);
router.post('/', createAppointment);
router.get('/:id', getAppointmentById);
router.put('/:id', updateAppointment);
router.delete('/:id', cancelAppointment);
```

## ✅ Verification

```bash
# Test daily availability
curl "http://localhost:3000/api/appointments/availability/daily?doctor_id=1&date=2025-11-10" \
  -H "X-Tenant-ID: demo_hospital_001"

# Expected: 200 OK
# {
#   "success": true,
#   "data": {
#     "availability": {
#       "date": "2025-11-10",
#       "doctor_id": 1,
#       "available_slots": [
#         {
#           "start_time": "2025-11-10T09:00:00.000Z",
#           "end_time": "2025-11-10T09:30:00.000Z",
#           "available": true
#         },
#         {
#           "start_time": "2025-11-10T09:30:00.000Z",
#           "end_time": "2025-11-10T10:00:00.000Z",
#           "available": false,
#           "reason": "Already booked"
#         }
#       ],
#       "total_slots": 16,
#       "available_count": 15
#     }
#   }
# }

# Test weekly availability
curl "http://localhost:3000/api/appointments/availability/weekly?doctor_id=1&start_date=2025-11-10" \
  -H "X-Tenant-ID: demo_hospital_001"

# Expected: 200 OK with 7 days of availability

# Test with custom duration
curl "http://localhost:3000/api/appointments/availability/daily?doctor_id=1&date=2025-11-10&duration_minutes=60" \
  -H "X-Tenant-ID: demo_hospital_001"

# Expected: 200 OK with slots for 60-minute appointments

# Test missing parameters
curl "http://localhost:3000/api/appointments/availability/daily?doctor_id=1" \
  -H "X-Tenant-ID: demo_hospital_001"

# Expected: 400 Bad Request
```

## 📄 Commit

```bash
git add src/controllers/appointment.controller.ts src/routes/appointments.routes.ts
git commit -m "feat(appointment): Add availability checking endpoints"
```
