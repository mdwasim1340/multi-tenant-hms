# Appointment Management API Documentation

**Version:** 1.0  
**Last Updated:** November 15, 2025  
**Team:** Alpha  
**Status:** Production Ready

---

## Overview

The Appointment Management API provides comprehensive endpoints for scheduling, managing, and tracking patient appointments. All endpoints support multi-tenant isolation and role-based access control.

**Base URL:** `http://localhost:3000/api/appointments`

**Authentication:** Required (JWT Bearer token)

**Multi-tenant:** Required (`X-Tenant-ID` header)

---

## Table of Contents

1. [Authentication](#authentication)
2. [List Appointments](#list-appointments)
3. [Get Available Slots](#get-available-slots)
4. [Create Appointment](#create-appointment)
5. [Get Appointment Details](#get-appointment-details)
6. [Update Appointment](#update-appointment)
7. [Confirm Appointment](#confirm-appointment)
8. [Complete Appointment](#complete-appointment)
9. [Mark No-Show](#mark-no-show)
10. [Cancel Appointment](#cancel-appointment)
11. [Error Responses](#error-responses)

---

## Authentication

All endpoints require:

```http
Authorization: Bearer {jwt_token}
X-Tenant-ID: {tenant_id}
X-App-ID: hospital_system
X-API-Key: {app_api_key}
```

**Required Permissions:**
- `appointments:read` - View appointments
- `appointments:write` - Create, update, delete appointments

---

## List Appointments

Get a paginated list of appointments with optional filtering.

**Endpoint:** `GET /api/appointments`

**Permission:** `appointments:read`

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | integer | No | 1 | Page number |
| limit | integer | No | 10 | Items per page (max 100) |
| patient_id | integer | No | - | Filter by patient ID |
| doctor_id | integer | No | - | Filter by doctor ID |
| status | string | No | - | Filter by status (scheduled, confirmed, completed, cancelled, no_show) |
| appointment_type | string | No | - | Filter by appointment type |
| date_from | date | No | - | Filter from date (YYYY-MM-DD) |
| date_to | date | No | - | Filter to date (YYYY-MM-DD) |
| sort_by | string | No | appointment_date | Sort field |
| sort_order | string | No | asc | Sort order (asc, desc) |

### Example Request

```bash
curl -X GET "http://localhost:3000/api/appointments?page=1&limit=10&status=scheduled" \
  -H "Authorization: Bearer {token}" \
  -H "X-Tenant-ID: tenant_123"
```

### Example Response

```json
{
  "success": true,
  "data": {
    "appointments": [
      {
        "id": 1,
        "appointment_number": "APT1731672000123",
        "patient_id": 5,
        "doctor_id": 3,
        "appointment_date": "2025-11-18T10:00:00.000Z",
        "appointment_end_time": "2025-11-18T10:30:00.000Z",
        "duration_minutes": 30,
        "appointment_type": "consultation",
        "chief_complaint": "Regular checkup",
        "notes": "Patient reports feeling well",
        "special_instructions": null,
        "estimated_cost": null,
        "status": "scheduled",
        "cancellation_reason": null,
        "cancelled_at": null,
        "cancelled_by": null,
        "created_by": 3,
        "updated_by": 3,
        "created_at": "2025-11-15T10:00:00.000Z",
        "updated_at": "2025-11-15T10:00:00.000Z",
        "patient": {
          "id": 5,
          "first_name": "John",
          "last_name": "Doe",
          "patient_number": "P001",
          "phone": "555-0101",
          "email": "john.doe@email.com"
        },
        "doctor": {
          "id": 3,
          "name": "Dr. Smith",
          "email": "dr.smith@hospital.com"
        }
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

---

## Get Available Slots

Get available time slots for a doctor on a specific date.

**Endpoint:** `GET /api/appointments/available-slots`

**Permission:** `appointments:read`

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| doctor_id | integer | Yes | Doctor's user ID |
| date | date | Yes | Date to check (YYYY-MM-DD) |
| duration_minutes | integer | No | Appointment duration (default: 30) |

### Example Request

```bash
curl -X GET "http://localhost:3000/api/appointments/available-slots?doctor_id=3&date=2025-11-18&duration_minutes=30" \
  -H "Authorization: Bearer {token}" \
  -H "X-Tenant-ID: tenant_123"
```

### Example Response

```json
{
  "success": true,
  "data": {
    "slots": [
      {
        "start_time": "2025-11-18T09:00:00.000Z",
        "end_time": "2025-11-18T09:30:00.000Z",
        "available": true,
        "duration_minutes": 30
      },
      {
        "start_time": "2025-11-18T09:30:00.000Z",
        "end_time": "2025-11-18T10:00:00.000Z",
        "available": false,
        "duration_minutes": 30
      },
      {
        "start_time": "2025-11-18T10:00:00.000Z",
        "end_time": "2025-11-18T10:30:00.000Z",
        "available": true,
        "duration_minutes": 30
      }
    ]
  }
}
```

### Notes

- Returns empty array if doctor has no schedule for that day
- Checks existing appointments for conflicts
- Checks doctor's time off
- Slots marked as unavailable if conflicting with existing appointments or time off

---

## Create Appointment

Create a new appointment with automatic conflict detection.

**Endpoint:** `POST /api/appointments`

**Permission:** `appointments:write`

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| patient_id | integer | Yes | Patient's ID |
| doctor_id | integer | Yes | Doctor's user ID |
| appointment_date | datetime | Yes | Appointment start time (ISO 8601) |
| duration_minutes | integer | No | Duration (default: 30) |
| appointment_type | string | Yes | Type (consultation, follow_up, etc.) |
| chief_complaint | string | No | Patient's main concern |
| notes | string | No | Additional notes |
| special_instructions | string | No | Special instructions |
| estimated_cost | number | No | Estimated cost |

### Example Request

```bash
curl -X POST "http://localhost:3000/api/appointments" \
  -H "Authorization: Bearer {token}" \
  -H "X-Tenant-ID: tenant_123" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": 5,
    "doctor_id": 3,
    "appointment_date": "2025-11-18T10:00:00.000Z",
    "duration_minutes": 30,
    "appointment_type": "consultation",
    "chief_complaint": "Regular checkup",
    "notes": "Patient reports feeling well"
  }'
```

### Example Response

```json
{
  "success": true,
  "data": {
    "appointment": {
      "id": 1,
      "appointment_number": "APT1731672000123",
      "patient_id": 5,
      "doctor_id": 3,
      "appointment_date": "2025-11-18T10:00:00.000Z",
      "appointment_end_time": "2025-11-18T10:30:00.000Z",
      "duration_minutes": 30,
      "appointment_type": "consultation",
      "status": "scheduled",
      "patient": { /* patient details */ },
      "doctor": { /* doctor details */ }
    }
  },
  "message": "Appointment created successfully"
}
```

### Conflict Detection

If a scheduling conflict exists, returns 400 error:

```json
{
  "success": false,
  "error": "Appointment conflict: Doctor has another appointment at this time",
  "details": {
    "conflict": {
      "has_conflict": true,
      "conflict_type": "overlap",
      "conflict_description": "Doctor has another appointment at this time",
      "conflicting_appointment_id": 5
    }
  }
}
```

---

## Get Appointment Details

Get detailed information about a specific appointment.

**Endpoint:** `GET /api/appointments/:id`

**Permission:** `appointments:read`

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | integer | Yes | Appointment ID |

### Example Request

```bash
curl -X GET "http://localhost:3000/api/appointments/1" \
  -H "Authorization: Bearer {token}" \
  -H "X-Tenant-ID: tenant_123"
```

### Example Response

```json
{
  "success": true,
  "data": {
    "appointment": {
      "id": 1,
      "appointment_number": "APT1731672000123",
      "patient_id": 5,
      "doctor_id": 3,
      "appointment_date": "2025-11-18T10:00:00.000Z",
      "appointment_end_time": "2025-11-18T10:30:00.000Z",
      "duration_minutes": 30,
      "appointment_type": "consultation",
      "chief_complaint": "Regular checkup",
      "notes": "Patient reports feeling well",
      "status": "scheduled",
      "patient": {
        "id": 5,
        "first_name": "John",
        "last_name": "Doe",
        "patient_number": "P001",
        "phone": "555-0101",
        "email": "john.doe@email.com"
      },
      "doctor": {
        "id": 3,
        "name": "Dr. Smith",
        "email": "dr.smith@hospital.com"
      }
    }
  }
}
```

---

## Update Appointment

Update an existing appointment (reschedule or modify details).

**Endpoint:** `PUT /api/appointments/:id`

**Permission:** `appointments:write`

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | integer | Yes | Appointment ID |

### Request Body

All fields are optional. Only include fields you want to update.

| Field | Type | Description |
|-------|------|-------------|
| appointment_date | datetime | New appointment time |
| duration_minutes | integer | New duration |
| appointment_type | string | New type |
| chief_complaint | string | Updated complaint |
| notes | string | Updated notes |
| special_instructions | string | Updated instructions |
| estimated_cost | number | Updated cost |

### Example Request

```bash
curl -X PUT "http://localhost:3000/api/appointments/1" \
  -H "Authorization: Bearer {token}" \
  -H "X-Tenant-ID: tenant_123" \
  -H "Content-Type: application/json" \
  -d '{
    "appointment_date": "2025-11-18T11:00:00.000Z",
    "notes": "Rescheduled by patient request"
  }'
```

### Example Response

```json
{
  "success": true,
  "data": {
    "appointment": {
      "id": 1,
      "appointment_date": "2025-11-18T11:00:00.000Z",
      "appointment_end_time": "2025-11-18T11:30:00.000Z",
      "notes": "Rescheduled by patient request",
      /* other fields */
    }
  },
  "message": "Appointment updated successfully"
}
```

### Notes

- Rescheduling triggers conflict detection
- Returns 400 error if new time conflicts with existing appointments

---

## Confirm Appointment

Confirm a scheduled appointment.

**Endpoint:** `POST /api/appointments/:id/confirm`

**Permission:** `appointments:write`

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | integer | Yes | Appointment ID |

### Example Request

```bash
curl -X POST "http://localhost:3000/api/appointments/1/confirm" \
  -H "Authorization: Bearer {token}" \
  -H "X-Tenant-ID: tenant_123"
```

### Example Response

```json
{
  "success": true,
  "data": {
    "appointment": {
      "id": 1,
      "status": "confirmed",
      /* other fields */
    }
  },
  "message": "Appointment confirmed successfully"
}
```

---

## Complete Appointment

Mark an appointment as completed.

**Endpoint:** `POST /api/appointments/:id/complete`

**Permission:** `appointments:write`

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | integer | Yes | Appointment ID |

### Example Request

```bash
curl -X POST "http://localhost:3000/api/appointments/1/complete" \
  -H "Authorization: Bearer {token}" \
  -H "X-Tenant-ID: tenant_123"
```

### Example Response

```json
{
  "success": true,
  "data": {
    "appointment": {
      "id": 1,
      "status": "completed",
      /* other fields */
    }
  },
  "message": "Appointment marked as complete"
}
```

---

## Mark No-Show

Mark an appointment as no-show (patient didn't arrive).

**Endpoint:** `POST /api/appointments/:id/no-show`

**Permission:** `appointments:write`

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | integer | Yes | Appointment ID |

### Example Request

```bash
curl -X POST "http://localhost:3000/api/appointments/1/no-show" \
  -H "Authorization: Bearer {token}" \
  -H "X-Tenant-ID: tenant_123"
```

### Example Response

```json
{
  "success": true,
  "data": {
    "appointment": {
      "id": 1,
      "status": "no_show",
      /* other fields */
    }
  },
  "message": "Appointment marked as no-show"
}
```

---

## Cancel Appointment

Cancel an appointment with a reason.

**Endpoint:** `DELETE /api/appointments/:id`

**Permission:** `appointments:write`

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | integer | Yes | Appointment ID |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| reason | string | Yes | Cancellation reason |

### Example Request

```bash
curl -X DELETE "http://localhost:3000/api/appointments/1" \
  -H "Authorization: Bearer {token}" \
  -H "X-Tenant-ID: tenant_123" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Patient requested cancellation"
  }'
```

### Example Response

```json
{
  "success": true,
  "data": {
    "appointment": {
      "id": 1,
      "status": "cancelled",
      "cancellation_reason": "Patient requested cancellation",
      "cancelled_at": "2025-11-15T14:30:00.000Z",
      "cancelled_by": 3,
      /* other fields */
    }
  },
  "message": "Appointment cancelled successfully"
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "error": "Validation error message",
  "details": {
    /* validation details */
  }
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "error": "Forbidden",
  "message": "Insufficient permissions"
}
```

### 404 Not Found

```json
{
  "success": false,
  "error": "Appointment not found"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

---

## Status Flow

```
scheduled → confirmed → completed
         ↘ no_show
         ↘ cancelled
```

**Status Descriptions:**
- `scheduled` - Initial status when appointment is created
- `confirmed` - Patient or staff confirmed the appointment
- `completed` - Appointment finished successfully
- `no_show` - Patient didn't show up
- `cancelled` - Appointment was cancelled

---

## Multi-Tenant Isolation

All endpoints enforce multi-tenant isolation:

1. **Required Header:** `X-Tenant-ID` must be provided
2. **Schema Isolation:** Queries execute in tenant-specific schema
3. **Data Separation:** No cross-tenant data access possible
4. **Validation:** Tenant existence verified before operations

---

## Rate Limiting

- **Default:** 100 requests per minute per tenant
- **Burst:** 200 requests per minute
- **Headers:** Rate limit info in response headers

---

## Changelog

### Version 1.0 (November 15, 2025)
- Initial release
- 9 endpoints implemented
- Multi-tenant support
- Role-based access control
- Conflict detection
- Available slots calculation

---

## Support

For issues or questions:
- **Team:** Alpha
- **Documentation:** `backend/docs/`
- **Tests:** `backend/tests/`

---

**Last Updated:** November 15, 2025  
**Team Alpha** - Building the future of healthcare scheduling! 🚀
