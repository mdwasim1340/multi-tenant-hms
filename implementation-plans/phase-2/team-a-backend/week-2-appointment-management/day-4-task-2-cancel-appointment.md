# Week 2, Day 4, Task 2: DELETE /api/appointments/:id - Cancel Appointment

## 🎯 Task Objective
Implement endpoint to cancel appointments with reason tracking.

## ⏱️ Estimated Time: 1.5 hours

## 📝 Step 1: Add Cancel Controller

Update `backend/src/controllers/appointment.controller.ts`:

```typescript
export const cancelAppointment = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const appointmentId = parseInt(req.params.id);
  const userId = (req as any).user?.id;
  const { reason } = req.body;
  
  if (isNaN(appointmentId)) {
    throw new ValidationError('Invalid appointment ID');
  }
  
  if (!reason || typeof reason !== 'string') {
    throw new ValidationError('Cancellation reason is required');
  }
  
  // Cancel appointment
  const appointment = await appointmentService.cancelAppointment(
    appointmentId,
    reason,
    tenantId,
    userId
  );
  
  res.json({
    success: true,
    data: { appointment },
    message: 'Appointment cancelled successfully'
  });
});
```

## 📝 Step 2: Add Route

Update `backend/src/routes/appointments.routes.ts`:

```typescript
import { 
  getAppointments, 
  createAppointment, 
  getAppointmentById,
  updateAppointment,
  cancelAppointment 
} from '../controllers/appointment.controller';

router.get('/', getAppointments);
router.post('/', createAppointment);
router.get('/:id', getAppointmentById);
router.put('/:id', updateAppointment);
router.delete('/:id', cancelAppointment);  // Add this
```

## ✅ Verification

```bash
# Test cancel appointment
curl -X DELETE http://localhost:3000/api/appointments/1 \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: demo_hospital_001" \
  -d '{"reason": "Patient requested cancellation"}'

# Expected: 200 OK
# {
#   "success": true,
#   "data": {
#     "appointment": {
#       "id": 1,
#       "status": "cancelled",
#       "cancellation_reason": "Patient requested cancellation",
#       "cancelled_at": "2025-11-06T...",
#       "cancelled_by": 1
#     }
#   },
#   "message": "Appointment cancelled successfully"
# }

# Test cancel without reason
curl -X DELETE http://localhost:3000/api/appointments/1 \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: demo_hospital_001" \
  -d '{}'

# Expected: 400 Bad Request
# {
#   "success": false,
#   "error": "Cancellation reason is required",
#   "code": "VALIDATION_ERROR"
# }

# Test cancel non-existent appointment
curl -X DELETE http://localhost:3000/api/appointments/99999 \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: demo_hospital_001" \
  -d '{"reason": "Test"}'

# Expected: 404 Not Found
```

## 📄 Commit

```bash
git add src/controllers/appointment.controller.ts src/routes/appointments.routes.ts
git commit -m "feat(appointment): Add DELETE /api/appointments/:id endpoint for cancellation"
```
