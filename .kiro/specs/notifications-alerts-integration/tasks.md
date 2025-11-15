# Implementation Plan

## Overview

This implementation plan breaks down the Notification and Alert integration into discrete, manageable coding tasks. Each task builds incrementally on previous tasks and includes specific requirements references.

## Task Organization

Tasks are organized into the following categories:
1. Backend Infrastructure (Database, Services, Routes)
2. AWS Integration (SES, SNS)
3. WebSocket Implementation (Real-time delivery)
4. Frontend Integration (API Client, Hooks, Components)
5. Page Updates (Replace Mock Data)
6. Testing and Validation
7. Performance Optimization
8. Documentation and Deployment

---

## Backend Infrastructure Tasks

### - [ ] 1. Set up notification database schema

Create database tables for notifications in tenant schemas.

- [ ] 1.1 Create notifications table migration
  - Create `backend/migrations/create-notifications-schema.sql`
  - Define notifications table with all required fields
  - Add indexes for user_id, type, read, created_at, severity
  - Add foreign key constraints
  - _Requirements: 1.1, 6.1, 6.6_

- [ ] 1.2 Create notification_settings table migration
  - Create notification_settings table for user preferences
  - Add indexes for user_id
  - Define default settings structure
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 1.3 Create notification_delivery_log table migration
  - Create delivery log table for tracking
  - Add indexes for notification_id, status, attempted_at
  - Define delivery status enum
  - _Requirements: 10.1, 10.2, 10.3_

- [ ] 1.4 Run migrations on all tenant schemas
  - Apply migrations to existing tenant schemas
  - Verify tables created successfully
  - Test with sample data
  - _Requirements: 6.1, 6.6_

### - [ ] 2. Implement Notification Service

Build the core notification service with CRUD operations.

- [ ] 2.1 Create Notification Service class
  - Create `backend/src/services/notifications/notificationService.ts`
  - Implement `createNotification()` method
  - Implement `getUserNotifications()` method with pagination and filtering
  - Implement `getNotificationById()` method
  - Implement `markAsRead()` and `markAllAsRead()` methods
  - Implement `archiveNotification()` method
  - Implement `deleteNotification()` method (soft delete)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [ ] 2.2 Implement notification delivery logic
  - Create `deliverNotification()` method for multi-channel delivery
  - Implement quiet hours checking
  - Implement channel selection based on user settings
  - Add delivery status tracking
  - _Requirements: 5.1, 5.2, 5.3, 8.1, 8.2_

- [ ] 2.3 Implement Critical Alerts functionality
  - Create `createCriticalAlert()` method
  - Create `getCriticalAlerts()` method
  - Create `acknowledgeCriticalAlert()` method
  - Create `dismissCriticalAlert()` method
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 2.4 Implement System Alerts functionality
  - Create `createSystemAlert()` method
  - Create `getSystemAlerts()` method
  - Create `clearSystemAlert()` method
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 2.5 Implement Notification Settings management
  - Create `getNotificationSettings()` method
  - Create `updateNotificationSettings()` method
  - Create `createDefaultSettings()` method
  - Create `resetNotificationSettings()` method
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [ ] 2.6 Write unit tests for Notification Service
  - Test notification CRUD operations
  - Test filtering and pagination
  - Test quiet hours logic
  - Test multi-tenant isolation
  - _Requirements: 6.1-6.7, 14.1-14.7_


### - [ ] 3. Implement AWS SES Email Service

Integrate AWS SES for email notifications.

- [ ] 3.1 Set up AWS SES client
  - Create `backend/src/services/notifications/emailService.ts`
  - Initialize AWS SES client with credentials
  - Configure SES region and from email
  - _Requirements: 8.2, 8.6_

- [ ] 3.2 Implement email sending functionality
  - Create `sendNotificationEmail()` method
  - Implement email template rendering
  - Add user email lookup
  - Add tenant branding (logo, name)
  - _Requirements: 8.2, 9.3, 9.5_

- [ ] 3.3 Implement email delivery tracking
  - Create `logEmailDelivery()` method
  - Create `logEmailFailure()` method
  - Track AWS SES message IDs
  - _Requirements: 10.2, 10.6_

- [ ] 3.4 Implement email retry logic
  - Create `retryEmailDelivery()` method with exponential backoff
  - Implement max retry attempts (3)
  - Log retry attempts
  - _Requirements: 8.6, 14.1, 14.2_

- [ ] 3.5 Write unit tests for Email Service
  - Test email sending with mock AWS SES
  - Test delivery logging
  - Test retry logic
  - Test error handling
  - _Requirements: 8.6, 14.1-14.7_

### - [ ] 4. Implement AWS SNS SMS Service

Integrate AWS SNS for SMS notifications.

- [ ] 4.1 Set up AWS SNS client
  - Create `backend/src/services/notifications/smsService.ts`
  - Initialize AWS SNS client with credentials
  - Configure SNS region
  - _Requirements: 8.3, 8.6_

- [ ] 4.2 Implement SMS sending functionality
  - Create `sendNotificationSMS()` method
  - Implement SMS template rendering (concise text)
  - Add user phone number lookup
  - Set SMS type based on severity (Transactional vs Promotional)
  - _Requirements: 8.3, 9.4, 9.5_

- [ ] 4.3 Implement SMS delivery tracking
  - Create `logSMSDelivery()` method
  - Create `logSMSFailure()` method
  - Track AWS SNS message IDs
  - _Requirements: 10.2, 10.6_

- [ ] 4.4 Implement SMS retry logic
  - Create `retrySMSDelivery()` method with exponential backoff
  - Implement max retry attempts (3)
  - Log retry attempts
  - _Requirements: 8.6, 14.1, 14.2_

- [ ] 4.5 Write unit tests for SMS Service
  - Test SMS sending with mock AWS SNS
  - Test delivery logging
  - Test retry logic
  - Test error handling
  - _Requirements: 8.6, 14.1-14.7_

### - [ ] 5. Implement Template Service

Create notification templates for email and SMS.

- [ ] 5.1 Create Template Service class
  - Create `backend/src/services/notifications/templateService.ts`
  - Define template structure for each notification type
  - Implement variable substitution
  - _Requirements: 9.1, 9.2_

- [ ] 5.2 Create email templates
  - Create HTML email templates for each notification type
  - Add hospital branding placeholders
  - Implement responsive email design
  - _Requirements: 9.3, 9.5_

- [ ] 5.3 Create SMS templates
  - Create concise SMS templates for each notification type
  - Optimize for character limits
  - Include essential information only
  - _Requirements: 9.4, 9.5_

- [ ] 5.4 Implement template rendering
  - Create `renderEmailTemplate()` method
  - Create `renderSMSTemplate()` method
  - Implement variable substitution logic
  - _Requirements: 9.2, 9.5_

- [ ] 5.5 Write unit tests for Template Service
  - Test template rendering with various data
  - Test variable substitution
  - Test missing variable handling
  - _Requirements: 9.1-9.7_

---

## WebSocket Implementation Tasks

### - [ ] 6. Implement WebSocket Server

Build WebSocket server for real-time notification delivery.

- [ ] 6.1 Create WebSocket Service class
  - Create `backend/src/services/websocket.ts`
  - Initialize WebSocket server
  - Implement connection management
  - _Requirements: 5.1, 5.2, 5.6_

- [ ] 6.2 Implement WebSocket authentication
  - Create `handleUpgrade()` method to verify JWT tokens
  - Extract user ID and tenant ID from token
  - Reject unauthorized connections
  - _Requirements: 15.1, 15.2_

- [ ] 6.3 Implement client management
  - Create `addClient()` method to track connections
  - Create `removeClient()` method for cleanup
  - Organize clients by tenant and user
  - _Requirements: 5.2, 6.1, 6.3_

- [ ] 6.4 Implement message delivery
  - Create `sendToUser()` method for user-specific messages
  - Create `broadcastToTenant()` method for tenant-wide messages
  - Handle WebSocket send errors
  - _Requirements: 5.1, 5.2, 5.4, 6.3_

- [ ] 6.5 Implement heartbeat mechanism
  - Create `startHeartbeat()` method with ping/pong
  - Detect and remove dead connections
  - Implement 30-second heartbeat interval
  - _Requirements: 5.6, 14.3_

- [ ] 6.6 Integrate WebSocket with HTTP server
  - Add WebSocket upgrade handler to Express server
  - Configure WebSocket path (/notifications)
  - Test WebSocket connection from frontend
  - _Requirements: 5.1, 5.6_

- [ ] 6.7 Write unit tests for WebSocket Service
  - Test connection authentication
  - Test message delivery
  - Test client management
  - Test heartbeat mechanism
  - _Requirements: 5.1-5.7, 14.3_

---

## API Routes Tasks

### - [ ] 7. Create Notification API Routes

Build REST API endpoints for notification management.

- [ ] 7.1 Create notification routes file
  - Create `backend/src/routes/notifications.ts`
  - Apply auth and tenant middleware
  - _Requirements: 15.1, 15.2_

- [ ] 7.2 Implement notification CRUD endpoints
  - Add `GET /api/notifications` endpoint (list with pagination)
  - Add `GET /api/notifications/:id` endpoint (get by ID)
  - Add `PUT /api/notifications/:id/read` endpoint (mark as read)
  - Add `PUT /api/notifications/read-all` endpoint (mark all as read)
  - Add `PUT /api/notifications/:id/archive` endpoint (archive)
  - Add `DELETE /api/notifications/:id` endpoint (delete)
  - _Requirements: 1.1-1.6, 6.1-6.4_

- [ ] 7.3 Implement critical alerts endpoints
  - Add `GET /api/notifications/critical/alerts` endpoint
  - Add `POST /api/notifications/critical/:id/acknowledge` endpoint
  - Add `POST /api/notifications/critical/:id/dismiss` endpoint
  - _Requirements: 2.1-2.7_

- [ ] 7.4 Implement system alerts endpoints
  - Add `GET /api/notifications/system/alerts` endpoint
  - Add `PUT /api/notifications/system/:id/clear` endpoint
  - _Requirements: 3.1-3.7_

- [ ] 7.5 Implement notification settings endpoints
  - Add `GET /api/notifications/settings/preferences` endpoint
  - Add `PUT /api/notifications/settings/preferences` endpoint
  - Add `POST /api/notifications/settings/reset` endpoint
  - _Requirements: 4.1-4.7_

- [ ] 7.6 Add input validation and error handling
  - Validate request parameters
  - Return consistent error responses
  - Log errors for debugging
  - _Requirements: 14.1-14.7, 15.1-15.7_

- [ ] 7.7 Write integration tests for API routes
  - Test all endpoints with valid data
  - Test error scenarios
  - Test multi-tenant isolation
  - Test authentication and authorization
  - _Requirements: 6.1-6.7, 15.1-15.7_

---

## Frontend Development Tasks

### - [ ] 8. Create Notification API Client

Build the frontend API client for notifications.

- [ ] 8.1 Create notification API client module
  - Create `hospital-management-system/lib/api/notifications.ts`
  - Implement axios instance with auth headers
  - Create methods for all notification endpoints
  - Add error handling and retry logic
  - _Requirements: 1.1-1.7, 2.1-2.7, 3.1-3.7, 4.1-4.7_

- [ ] 8.2 Create TypeScript interfaces
  - Create `hospital-management-system/types/notification.ts`
  - Define interfaces matching backend data models
  - Export all notification-related types
  - _Requirements: All requirements_

- [ ] 8.3 Write unit tests for API client
  - Test API client methods with mock responses
  - Test error handling
  - Test retry logic
  - _Requirements: 14.1-14.7_

### - [ ] 9. Implement WebSocket Client

Build WebSocket client for real-time notifications.

- [ ] 9.1 Create WebSocket client class
  - Create `hospital-management-system/lib/websocket/notificationSocket.ts`
  - Implement connection management
  - Implement reconnection logic with exponential backoff
  - _Requirements: 5.1, 5.6, 14.3_

- [ ] 9.2 Implement message handling
  - Create `handleNotification()` method
  - Implement event subscription system
  - Support multiple listeners per event type
  - _Requirements: 5.1, 5.2, 5.4_

- [ ] 9.3 Implement connection lifecycle
  - Create `connect()` method with JWT token
  - Create `disconnect()` method
  - Handle connection errors
  - _Requirements: 5.6, 14.3, 14.4_

- [ ] 9.4 Add browser notification support
  - Request notification permissions
  - Show browser notifications for critical alerts
  - Handle notification clicks
  - _Requirements: 5.5, 8.4_

- [ ] 9.5 Add audio alert support
  - Load alert sound files
  - Play audio for critical notifications
  - Respect user preferences
  - _Requirements: 5.5_

- [ ] 9.6 Write unit tests for WebSocket client
  - Test connection and reconnection
  - Test message handling
  - Test event subscription
  - _Requirements: 5.1-5.7, 14.3_

### - [ ] 10. Create Notification Hooks

Build React hooks for notification state management.

- [ ] 10.1 Create main notifications hook
  - Create `hospital-management-system/hooks/useNotifications.ts`
  - Implement `useNotifications()` hook with pagination and filtering
  - Subscribe to real-time notifications via WebSocket
  - Implement mark as read, archive, delete functions
  - _Requirements: 1.1-1.7, 5.1-5.7_

- [ ] 10.2 Create critical alerts hook
  - Implement `useCriticalAlerts()` hook
  - Subscribe to critical alert events
  - Trigger audio and browser notifications
  - _Requirements: 2.1-2.7, 5.5_

- [ ] 10.3 Create system alerts hook
  - Implement `useSystemAlerts()` hook
  - Fetch and display system alerts
  - _Requirements: 3.1-3.7_

- [ ] 10.4 Create notification settings hook
  - Implement `useNotificationSettings()` hook
  - Fetch and update user preferences
  - _Requirements: 4.1-4.7_

- [ ] 10.5 Create unread count hook
  - Implement `useUnreadCount()` hook
  - Subscribe to real-time count updates
  - Display badge in navigation
  - _Requirements: 1.1, 5.1, 5.2_

- [ ] 10.6 Write unit tests for hooks
  - Test hooks with mock API responses
  - Test real-time updates
  - Test error handling
  - _Requirements: 14.1-14.7_

---

## Page Update Tasks

### - [ ] 11. Update Notification Center page

Replace mock data with real API integration.

- [ ] 11.1 Integrate Notification Center with backend
  - Update `hospital-management-system/app/notifications/page.tsx`
  - Replace mock `notifications` with `useNotifications()` hook
  - Implement search and filtering
  - Add loading states with skeleton loaders
  - Add error handling with error messages
  - Implement mark as read functionality
  - Implement archive and delete functionality
  - _Requirements: 1.1-1.7, 5.1-5.7_

- [ ] 11.2 Add real-time notification updates
  - Subscribe to WebSocket notifications
  - Display new notifications immediately
  - Show visual indicators for new notifications
  - Play audio for critical notifications
  - _Requirements: 5.1-5.7_

- [ ] 11.3 Test Notification Center page
  - Test page loads with real data
  - Test filtering and search
  - Test real-time updates
  - Test mark as read, archive, delete
  - _Requirements: 1.7, 5.7, 14.1-14.7_

### - [ ] 12. Update Critical Alerts page

Replace mock data with real API integration.

- [ ] 12.1 Integrate Critical Alerts with backend
  - Update `hospital-management-system/app/notifications/critical/page.tsx`
  - Replace mock `criticalAlerts` with `useCriticalAlerts()` hook
  - Add loading states
  - Add error handling
  - Implement acknowledge functionality
  - Implement dismiss functionality
  - _Requirements: 2.1-2.7_

- [ ] 12.2 Add real-time critical alert updates
  - Subscribe to critical alert events
  - Display new alerts immediately with visual/audio indicators
  - Show browser notifications
  - _Requirements: 2.3, 5.5, 8.4_

- [ ] 12.3 Test Critical Alerts page
  - Test page loads with real data
  - Test real-time alerts
  - Test acknowledge and dismiss
  - Test audio and browser notifications
  - _Requirements: 2.7, 5.7, 14.1-14.7_

### - [ ] 13. Update System Alerts page

Replace mock data with real API integration.

- [ ] 13.1 Integrate System Alerts with backend
  - Update `hospital-management-system/app/notifications/system/page.tsx`
  - Replace mock `systemAlerts` with `useSystemAlerts()` hook
  - Add loading states
  - Add error handling
  - Implement clear functionality
  - _Requirements: 3.1-3.7_

- [ ] 13.2 Test System Alerts page
  - Test page loads with real data
  - Test clear functionality
  - Test error handling
  - _Requirements: 3.7, 14.1-14.7_

### - [ ] 14. Update Notification Settings page

Replace mock data with real API integration.

- [ ] 14.1 Integrate Notification Settings with backend
  - Update `hospital-management-system/app/notifications/settings/page.tsx`
  - Replace mock `settings` with `useNotificationSettings()` hook
  - Add loading states
  - Add error handling
  - Implement save settings functionality
  - Implement reset to defaults functionality
  - _Requirements: 4.1-4.7_

- [ ] 14.2 Test Notification Settings page
  - Test page loads with real settings
  - Test save functionality
  - Test reset functionality
  - Test settings apply immediately
  - _Requirements: 4.7, 14.1-14.7_

### - [ ] 15. Add notification badge to navigation

Display unread notification count in navigation bar.

- [ ] 15.1 Update TopBar component
  - Add unread count badge to notification icon
  - Use `useUnreadCount()` hook
  - Update count in real-time
  - Add click handler to navigate to Notification Center
  - _Requirements: 1.1, 2.7, 5.1, 5.2_

- [ ] 15.2 Test notification badge
  - Test badge displays correct count
  - Test real-time count updates
  - Test navigation on click
  - _Requirements: 5.7_

---

## Testing and Validation Tasks

### - [ ] 16. Integration testing

Test complete notification flow from backend to frontend.

- [ ] 16.1 Create integration test suite
  - Set up test tenant with sample data
  - Create test scripts for each notification endpoint
  - Test authentication and authorization flow
  - Test multi-tenant isolation
  - Test error scenarios
  - _Requirements: 6.1-6.7, 15.1-15.7_

- [ ] 16.2 Test real-time delivery
  - Test WebSocket connection and authentication
  - Test notification delivery via WebSocket
  - Test reconnection after disconnect
  - Test message synchronization across tabs
  - _Requirements: 5.1-5.7, 14.3_

- [ ] 16.3 Test multi-channel delivery
  - Test email delivery via AWS SES
  - Test SMS delivery via AWS SNS
  - Test in-app delivery via WebSocket
  - Test delivery tracking and logging
  - _Requirements: 8.1-8.7, 10.1-10.7_

- [ ] 16.4 Performance testing
  - Test WebSocket scalability (1000+ connections)
  - Test notification delivery latency
  - Test database query performance
  - Test message queue throughput
  - _Requirements: 13.1-13.7_

### - [ ] 17. Security testing

Validate security measures are properly implemented.

- [ ] 17.1 Test authentication and authorization
  - Test endpoints reject requests without JWT token
  - Test endpoints reject requests without X-Tenant-ID header
  - Test WebSocket rejects unauthorized connections
  - Test permission checks for notification operations
  - _Requirements: 15.1-15.7_

- [ ] 17.2 Test multi-tenant isolation
  - Create two test tenants with different notifications
  - Verify tenant A cannot access tenant B's notifications
  - Verify WebSocket only delivers tenant-specific notifications
  - _Requirements: 6.1-6.7_

- [ ] 17.3 Test data protection
  - Verify sensitive data is encrypted
  - Test PHI handling compliance
  - Verify audit logging works
  - _Requirements: 10.1-10.7, 15.5, 15.7_

---

## Performance Optimization Tasks

### - [ ] 18. Implement caching

Add caching for frequently accessed data.

- [ ] 18.1 Set up Redis caching
  - Install and configure Redis client
  - Create cache utility functions
  - Define cache keys and TTL strategies
  - _Requirements: 13.3_

- [ ] 18.2 Add caching to notification queries
  - Cache unread notification counts (5 min TTL)
  - Cache notification settings (10 min TTL)
  - Implement cache invalidation on updates
  - _Requirements: 13.3, 13.5_

- [ ] 18.3 Monitor cache performance
  - Track cache hit/miss rates
  - Alert on low cache hit rates
  - Optimize cache TTL based on usage patterns
  - _Requirements: 13.3_

### - [ ] 19. Implement message queue

Add message queue for reliable notification delivery.

- [ ] 19.1 Set up message queue (Bull/Redis)
  - Install and configure Bull queue
  - Create notification queue
  - Define queue processing logic
  - _Requirements: 13.3, 14.1, 14.2_

- [ ] 19.2 Integrate queue with notification service
  - Queue notifications for delivery
  - Process queue with retry logic
  - Handle queue failures
  - _Requirements: 14.1, 14.2, 14.6_

- [ ] 19.3 Monitor queue performance
  - Track queue depth
  - Alert on growing backlog
  - Monitor processing throughput
  - _Requirements: 13.3_

---

## Documentation and Deployment Tasks

### - [ ] 20. Create documentation

Document notification system for developers and users.

- [ ] 20.1 Create API documentation
  - Document all notification endpoints
  - Document WebSocket protocol
  - Document AWS SES/SNS integration
  - Add example requests and responses
  - _Requirements: All requirements_

- [ ] 20.2 Create user guide
  - Document notification features
  - Document notification settings
  - Document critical alerts
  - Add screenshots and examples
  - _Requirements: All requirements_

### - [ ] 21. Deploy to production

Deploy notification system to production environment.

- [ ] 21.1 Configure production environment
  - Set up AWS SES in production
  - Set up AWS SNS in production
  - Configure Redis for production
  - Set up WebSocket server
  - _Requirements: All requirements_

- [ ] 21.2 Deploy backend services
  - Deploy notification service
  - Deploy WebSocket server
  - Deploy message queue workers
  - _Requirements: All requirements_

- [ ] 21.3 Deploy frontend updates
  - Deploy updated notification pages
  - Deploy WebSocket client
  - Test in production
  - _Requirements: All requirements_

- [ ] 21.4 Monitor production deployment
  - Monitor WebSocket connections
  - Monitor notification delivery rates
  - Monitor error rates
  - Gather user feedback
  - _Requirements: All requirements_

---

## Summary

This implementation plan provides a comprehensive roadmap for integrating the Notification and Alert system with the backend API using AWS SNS, AWS SES, and WebSocket for real-time delivery.

**Estimated Timeline:**
- Backend Infrastructure: 2 weeks
- AWS Integration: 1 week
- WebSocket Implementation: 1 week
- Frontend Integration: 2 weeks
- Testing and Validation: 1 week
- Performance Optimization: 1 week
- Documentation and Deployment: 1 week

**Total Estimated Time: 9 weeks**

**Key Success Metrics:**
- All notification pages display real data from backend
- Real-time notifications delivered via WebSocket < 500ms
- Email delivery success rate > 99%
- SMS delivery success rate > 99%
- WebSocket supports 1000+ concurrent connections
- Zero data leakage between tenants
- 99.9% uptime for notification system
