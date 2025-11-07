# Week 2, Day 5, Task 3: API Documentation

## 🎯 Task Objective
Create comprehensive API documentation for appointment endpoints.

## ⏱️ Estimated Time: 1.5 hours

## 📝 Step 1: Create API Documentation

Create file: `backend/docs/APPOINTMENT_API.md`

```markdown
# Appointment Management API Documentation

## Overview
Complete API documentation for appointment management endpoints including scheduling, availability checking, and appointment lifecycle management.

## Base URL
```
http://localhost:3000/api/appointments
```

## Authentication
All endpoints require:
- `X-Tenant-ID` header with valid tenant ID
- `Authorization` header with valid JWT token (for protected routes)

## Endpoints

### 1. List Appointments
Get paginated list of appointments with filtering options.

**Endpoint:** `GET /api/appointments`

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10, max: 100)
- `patient_id` (number, optional): Filter by patient ID
- `doctor_id` (number, optional): Filter by doctor ID
- `status` (string, optional): Filter by status (scheduled, confirmed, completed, cancelled, no_show)
- `appointment_type` (string, optional): Filter by type
- `date_from` (string, optional): Start date (YYYY-MM-DD)
- `date_to` (string, optional): End date (YYYY-MM-DD)
- `sort_by` (string, optional): Sort field (default: appointment_date)
- `sort_order` (string, optional): Sort order (asc, desc, default: asc)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "appointments": [
      {
        "id": 1,
        "appointment_number": "APT1730000000001",
        "patient_id": 1,
        "doctor_id": 1,
        "appointment_date": "2025-11-10T10:00:00.000Z",
        "appointment_end_time": "2025-11-10T10:30:00.000Z",
        "duration_minutes": 30,
        "status": "scheduled",
        "appointment_type": "consultation",
        "chief_complaint": "Annual checkup",
        "notes": null,
        "patient": {
          "id": 1,
          "first_name": "John",
          "last_name": "Doe",
          "patient_number": "P001",
          "phone": "555-0101",
          "email": "john.doe@email.com"
        },
        "doctor": {
          "id": 1,
          "name": "Dr. Smith",
          "email": "dr.smith@hospital.com"
        },
        "created_at": "2025-11-06T10:00:00.000Z",
        "updated_at": "2025-11-06T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

### 2. Create Appointment
Schedule a new appointment with conflict detection.

**Endpoint:** `POST /api/appointments`

**Request Body:**
```json
{
  "patient_id": 1,
  "doctor_id": 1,
  "appointment_date": "2025-11-10T10:00:00.000Z",
  "duration_minutes": 30,
  "appointment_type": "consultation",
  "chief_complaint": "Annual checkup",
  "notes": "Patient prefers morning appointments"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "appointment": {
      "id": 1,
      "appointment_number": "APT1730000000001",
      "patient_id": 1,
      "doctor_id": 1,
      "appointment_date": "2025-11-10T10:00:00.000Z",
      "appointment_end_time": "2025-11-10T10:30:00.000Z",
      "duration_minutes": 30,
      "status": "scheduled",
      "appointment_type": "consultation",
      "chief_complaint": "Annual checkup",
      "notes": "Patient prefers morning appointments",
      "patient": {...},
      "doctor": {...},
      "created_at": "2025-11-06T10:00:00.000Z",
      "updated_at": "2025-11-06T10:00:00.000Z"
    }
  },
  "message": "Appointment created successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Validation error or appointment conflict
- `404 Not Found`: Patient or doctor not found

### 3. Get Appointment by ID
Retrieve detailed information about a specific appointment.

**Endpoint:** `GET /api/appointments/:id`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "appointment": {
      "id": 1,
      "appointment_number": "APT1730000000001",
      "patient_id": 1,
      "doctor_id": 1,
      "appointment_date": "2025-11-10T10:00:00.000Z",
      "appointment_end_time": "2025-11-10T10:30:00.000Z",
      "duration_minutes": 30,
      "status": "scheduled",
      "appointment_type": "consultation",
      "chief_complaint": "Annual checkup",
      "notes": null,
      "patient": {...},
      "doctor": {...},
      "created_at": "2025-11-06T10:00:00.000Z",
      "updated_at": "2025-11-06T10:00:00.000Z"
    }
  }
}
```

**Error Responses:**
- `404 Not Found`: Appointment not found

### 4. Update Appointment
Update appointment details or reschedule.

**Endpoint:** `PUT /api/appointments/:id`

**Request Body:**
```json
{
  "appointment_date": "2025-11-11T14:00:00.000Z",
  "duration_minutes": 45,
  "status": "confirmed",
  "notes": "Rescheduled to afternoon"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "appointment": {...}
  },
  "message": "Appointment updated successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Validation error or conflict
- `404 Not Found`: Appointment not found

### 5. Cancel Appointment
Cancel an appointment with reason.

**Endpoint:** `DELETE /api/appointments/:id`

**Request Body:**
```json
{
  "reason": "Patient requested cancellation"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "appointment": {
      "id": 1,
      "status": "cancelled",
      "cancellation_reason": "Patient requested cancellation",
      "cancelled_at": "2025-11-06T10:00:00.000Z",
      "cancelled_by": 1,
      ...
    }
  },
  "message": "Appointment cancelled successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Missing cancellation reason
- `404 Not Found`: Appointment not found

### 6. Check Daily Availability
Get available time slots for a doctor on a specific date.

**Endpoint:** `GET /api/appointments/availability/daily`

**Query Parameters:**
- `doctor_id` (number, required): Doctor ID
- `date` (string, required): Date in YYYY-MM-DD format
- `duration_minutes` (number, optional): Appointment duration (default: 30)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "availability": {
      "date": "2025-11-10",
      "doctor_id": 1,
      "available_slots": [
        {
          "start_time": "2025-11-10T09:00:00.000Z",
          "end_time": "2025-11-10T09:30:00.000Z",
          "available": true
        },
        {
          "start_time": "2025-11-10T09:30:00.000Z",
          "end_time": "2025-11-10T10:00:00.000Z",
          "available": false,
          "reason": "Already booked"
        }
      ],
      "total_slots": 16,
      "available_count": 15
    }
  }
}
```

### 7. Check Weekly Availability
Get availability for a doctor for the next 7 days.

**Endpoint:** `GET /api/appointments/availability/weekly`

**Query Parameters:**
- `doctor_id` (number, required): Doctor ID
- `start_date` (string, required): Start date in YYYY-MM-DD format

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "availability": {
      "2025-11-10": {
        "date": "2025-11-10",
        "doctor_id": 1,
        "available_slots": [...],
        "total_slots": 16,
        "available_count": 15
      },
      "2025-11-11": {...},
      ...
    }
  }
}
```

## Status Values
- `scheduled`: Appointment is scheduled
- `confirmed`: Patient confirmed attendance
- `completed`: Appointment completed
- `cancelled`: Appointment cancelled
- `no_show`: Patient did not show up

## Appointment Types
- `consultation`: General consultation
- `follow_up`: Follow-up visit
- `emergency`: Emergency appointment
- `routine_checkup`: Routine health checkup
- `procedure`: Medical procedure
- `lab_test`: Laboratory test
- `vaccination`: Vaccination appointment

## Error Codes
- `VALIDATION_ERROR`: Input validation failed
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Appointment conflict detected
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions

## Examples

### Schedule an appointment
```bash
curl -X POST http://localhost:3000/api/appointments \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: demo_hospital_001" \
  -d '{
    "patient_id": 1,
    "doctor_id": 1,
    "appointment_date": "2025-11-10T10:00:00.000Z",
    "duration_minutes": 30,
    "appointment_type": "consultation"
  }'
```

### Check availability before scheduling
```bash
curl "http://localhost:3000/api/appointments/availability/daily?doctor_id=1&date=2025-11-10" \
  -H "X-Tenant-ID: demo_hospital_001"
```

### Reschedule an appointment
```bash
curl -X PUT http://localhost:3000/api/appointments/1 \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: demo_hospital_001" \
  -d '{
    "appointment_date": "2025-11-11T14:00:00.000Z",
    "notes": "Rescheduled by patient request"
  }'
```
```

## ✅ Verification

```bash
# Documentation should be clear and complete
cat backend/docs/APPOINTMENT_API.md

# Test all documented endpoints
# (Use examples from documentation)
```

## 📄 Commit

```bash
git add docs/APPOINTMENT_API.md
git commit -m "docs(appointment): Add comprehensive API documentation"
```
