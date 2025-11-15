# Notification System - Quick Start Guide 🚀

**Last Updated**: November 15, 2025  
**Status**: Production Ready  
**Version**: 1.0

---

## 🎯 Overview

The Notification System provides real-time, multi-channel notification delivery for the hospital management platform. This guide will help you get started quickly.

---

## 🚀 Quick Start

### 1. Access the Notification Center

Navigate to: `http://localhost:3001/notifications`

**Features**:
- View all notifications
- Filter by type, priority, status
- Search notifications
- Mark as read/archive/delete
- Bulk actions
- Auto-refresh every 30 seconds

### 2. View Critical Alerts

Navigate to: `http://localhost:3001/notifications/critical`

**Features**:
- View only critical alerts
- Acknowledge alerts
- Auto-refresh every 15 seconds
- Pulse animation for unacknowledged alerts

### 3. View System Alerts

Navigate to: `http://localhost:3001/notifications/system`

**Features**:
- View system health alerts
- Filter by type (errors, warnings, info)
- Dismiss alerts
- Auto-refresh every 30 seconds

### 4. Configure Settings

Navigate to: `http://localhost:3001/notifications/settings`

**Features**:
- Configure notification preferences per type
- Toggle email, SMS, push, in-app channels
- Set quiet hours
- Enable digest mode

---

## 📡 API Usage

### Create a Notification

```bash
curl -X POST http://localhost:3000/api/notifications \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Tenant-ID: YOUR_TENANT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "type": "appointment_reminder",
    "priority": "high",
    "title": "Appointment Tomorrow",
    "message": "You have an appointment with Dr. Smith tomorrow at 10:00 AM",
    "data": {
      "appointment_id": 123,
      "doctor_name": "Dr. Smith",
      "appointment_time": "2025-11-16T10:00:00Z"
    }
  }'
```

### List Notifications

```bash
curl -X GET "http://localhost:3000/api/notifications?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Tenant-ID: YOUR_TENANT_ID"
```

### Mark as Read

```bash
curl -X PUT http://localhost:3000/api/notifications/1/read \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Tenant-ID: YOUR_TENANT_ID"
```

### Get Statistics

```bash
curl -X GET http://localhost:3000/api/notifications/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Tenant-ID: YOUR_TENANT_ID"
```

---

## 🔔 Notification Types

### Available Types

1. **appointment_reminder** 📅 - Appointment reminders
2. **lab_result** 🔬 - Lab test results available
3. **prescription_ready** 💊 - Prescription ready for pickup
4. **critical_alert** 🚨 - Critical patient alerts
5. **system_alert** ⚙️ - System notifications
6. **system_error** ❌ - System errors
7. **system_warning** ⚠️ - System warnings
8. **billing_reminder** 💰 - Billing and payment reminders

### Priority Levels

1. **critical** 🔴 - Requires immediate attention
2. **high** 🟡 - Important, should be addressed soon
3. **medium** 🔵 - Normal priority
4. **low** ⚪ - Informational

---

## 📧 Delivery Channels

### In-App Notifications 🔔
- Real-time delivery via WebSocket
- Fallback to SSE for compatibility
- Instant browser notifications
- Auto-refresh support

### Email Notifications 📧
- Delivered via AWS SES
- HTML templates supported
- Configurable per notification type
- Respects quiet hours

### SMS Notifications 📱
- Delivered via AWS SNS
- Short message format
- Configurable per notification type
- Rate limiting applied

### Push Notifications 📲
- Web Push API support
- Mobile app ready
- Configurable per notification type
- Background delivery

---

## ⚙️ Configuration

### User Settings

Each user can configure:
- **Channel Preferences**: Enable/disable email, SMS, push, in-app
- **Quiet Hours**: Set do-not-disturb hours (e.g., 10 PM - 8 AM)
- **Digest Mode**: Batch notifications instead of real-time
- **Digest Frequency**: Hourly, daily, or weekly batches

### System Settings

Administrators can configure:
- **Notification Templates**: Customize message templates
- **Delivery Channels**: Enable/disable channels globally
- **Rate Limits**: Control notification frequency
- **Retry Logic**: Configure delivery retry attempts

---

## 🔧 Integration Examples

### Patient Appointment Reminder

```typescript
// When appointment is created/updated
await notificationService.createNotification({
  user_id: patient.user_id,
  type: 'appointment_reminder',
  priority: 'high',
  title: 'Appointment Reminder',
  message: `You have an appointment with ${doctor.name} on ${appointmentDate}`,
  data: {
    appointment_id: appointment.id,
    doctor_name: doctor.name,
    appointment_time: appointment.date,
    location: appointment.location
  }
});
```

### Lab Result Available

```typescript
// When lab results are ready
await notificationService.createNotification({
  user_id: patient.user_id,
  type: 'lab_result',
  priority: 'medium',
  title: 'Lab Results Available',
  message: 'Your lab test results are now available',
  data: {
    lab_test_id: labTest.id,
    test_name: labTest.name,
    result_date: labTest.completed_at
  }
});
```

### Critical Patient Alert

```typescript
// When critical condition detected
await notificationService.createNotification({
  user_id: doctor.user_id,
  type: 'critical_alert',
  priority: 'critical',
  title: 'Critical Patient Alert',
  message: `Patient ${patient.name} requires immediate attention`,
  data: {
    patient_id: patient.id,
    patient_name: patient.name,
    vital_signs: vitalSigns,
    location: patient.room_number,
    reason: 'Abnormal vital signs detected'
  }
});
```

### System Error Alert

```typescript
// When system error occurs
await notificationService.createNotification({
  user_id: admin.user_id,
  type: 'system_error',
  priority: 'high',
  title: 'System Error Detected',
  message: 'Database connection failed',
  data: {
    error_code: 'DB_CONNECTION_FAILED',
    service: 'PostgreSQL',
    component: 'Database Connection Pool',
    affected_users: 25,
    resolution: 'Attempting automatic reconnection'
  }
});
```

---

## 🧪 Testing

### Test Notification Creation

```bash
# Create test notification
curl -X POST http://localhost:3000/api/notifications \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Tenant-ID: YOUR_TENANT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "type": "general",
    "priority": "medium",
    "title": "Test Notification",
    "message": "This is a test notification"
  }'
```

### Test WebSocket Connection

```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:3000/ws/notifications');

ws.onopen = () => {
  console.log('WebSocket connected');
  // Send authentication
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'YOUR_JWT_TOKEN',
    tenantId: 'YOUR_TENANT_ID'
  }));
};

ws.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  console.log('Received notification:', notification);
};
```

### Test Email Delivery

```bash
# Create notification with email delivery
curl -X POST http://localhost:3000/api/notifications \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Tenant-ID: YOUR_TENANT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "type": "appointment_reminder",
    "priority": "high",
    "title": "Test Email",
    "message": "This notification will be sent via email",
    "channels": ["email", "in_app"]
  }'
```

---

## 📊 Monitoring

### Check Notification Statistics

```bash
curl -X GET http://localhost:3000/api/notifications/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Tenant-ID: YOUR_TENANT_ID"
```

**Response**:
```json
{
  "total": 150,
  "unread": 25,
  "by_type": {
    "appointment_reminder": 50,
    "lab_result": 30,
    "critical_alert": 10
  },
  "by_priority": {
    "critical": 10,
    "high": 40,
    "medium": 80,
    "low": 20
  }
}
```

### Check Delivery History

```bash
curl -X GET http://localhost:3000/api/notifications/1/history \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Tenant-ID: YOUR_TENANT_ID"
```

---

## 🐛 Troubleshooting

### Notifications Not Appearing

1. **Check WebSocket Connection**: Ensure WebSocket is connected
2. **Check User Settings**: Verify in-app notifications are enabled
3. **Check Quiet Hours**: Ensure current time is not in quiet hours
4. **Check Browser Console**: Look for JavaScript errors

### Email Not Received

1. **Check Email Settings**: Verify email is enabled for notification type
2. **Check AWS SES**: Ensure SES is configured and verified
3. **Check Spam Folder**: Email might be in spam
4. **Check Delivery History**: Check notification delivery status

### SMS Not Received

1. **Check SMS Settings**: Verify SMS is enabled for notification type
2. **Check AWS SNS**: Ensure SNS is configured correctly
3. **Check Phone Number**: Verify phone number is correct
4. **Check Rate Limits**: Ensure rate limits not exceeded

---

## 📚 Additional Resources

### Documentation
- **API Reference**: See `backend/src/routes/notifications.ts`
- **Service Layer**: See `backend/src/services/notification.ts`
- **Frontend Hooks**: See `hospital-management-system/hooks/use-notifications.ts`
- **Components**: See `hospital-management-system/components/notifications/`

### Examples
- **Integration Examples**: See code examples above
- **Test Scripts**: See `backend/tests/` directory
- **Frontend Pages**: See `hospital-management-system/app/notifications/`

### Support
- **Issues**: Check `TROUBLESHOOTING_GUIDE.md`
- **Status**: Check `TEAM_EPSILON_COMPLETE_SUMMARY.md`
- **Updates**: Check git commit history

---

## 🎉 Quick Tips

1. **Use Bulk Actions**: Select multiple notifications for efficient management
2. **Configure Quiet Hours**: Set do-not-disturb hours for better work-life balance
3. **Enable Digest Mode**: Batch notifications to reduce interruptions
4. **Use Filters**: Quickly find specific notifications with filters
5. **Acknowledge Critical Alerts**: Always acknowledge critical alerts promptly
6. **Monitor System Alerts**: Keep an eye on system health alerts
7. **Customize Settings**: Configure preferences per notification type
8. **Use Auto-refresh**: Let the system automatically update notifications

---

**The Notification System is ready to use! Start receiving and managing notifications today! 🔔✨**

