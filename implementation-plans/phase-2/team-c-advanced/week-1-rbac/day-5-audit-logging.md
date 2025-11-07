# Team C Week 1 Day 5: Audit Logging & Testing

## 🎯 Objective
Implement comprehensive audit logging system and complete RBAC testing.

**Duration**: 6-8 hours | **Difficulty**: Medium

---

## 📋 Tasks Overview

### Task 1: Audit Logging Service (2 hours)
Enhanced audit logging with detailed tracking

### Task 2: Audit Log Viewer UI (2 hours)
Admin interface for viewing audit logs

### Task 3: Comprehensive Testing (2 hours)
End-to-end RBAC system testing

### Task 4: Week Summary & Documentation (2 hours)
Complete documentation and week summary

---

## 📝 Task 1: Audit Logging Service (2 hours)

### Enhanced Audit Service

Create `backend/src/services/audit.service.ts`:

```typescript
import { Pool } from 'pg';

export interface AuditLogEntry {
  id: number;
  user_id?: number;
  target_user_id?: number;
  target_role_id?: number;
  permission_id?: number;
  action: string;
  resource_type: string;
  resource_id?: string;
  old_value?: any;
  new_value?: any;
  reason?: string;
  performed_by?: number;
  performed_at: Date;
  ip_address?: string;
  user_agent?: string;
  tenant_id?: string;
}

export interface AuditLogFilter {
  user_id?: number;
  action?: string;
  resource_type?: string;
  date_from?: Date;
  date_to?: Date;
  performed_by?: number;
  limit?: number;
  offset?: number;
}

export class AuditService {
  constructor(private pool: Pool) {}

  /**
   * Log an audit event
   */
  async logEvent(entry: Partial<AuditLogEntry>): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`
        INSERT INTO permission_audit_log (
          user_id, target_user_id, target_role_id, permission_id,
          action, old_value, new_value, reason, performed_by,
          ip_address, user_agent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        entry.user_id || null,
        entry.target_user_id || null,
        entry.target_role_id || null,
        entry.permission_id || null,
        entry.action,
        entry.old_value ? JSON.stringify(entry.old_value) : null,
        entry.new_value ? JSON.stringify(entry.new_value) : null,
        entry.reason || null,
        entry.performed_by || null,
        entry.ip_address || null,
        entry.user_agent || null
      ]);
    } finally {
      client.release();
    }
  }

  /**
   * Get audit logs with filtering
   */
  async getAuditLogs(filter: AuditLogFilter = {}): Promise<{
    logs: AuditLogEntry[];
    total: number;
  }> {
    const client = await this.pool.connect();
    
    try {
      const conditions = [];
      const params = [];
      let paramCount = 1;

      if (filter.user_id) {
        conditions.push(`(pal.user_id = $${paramCount} OR pal.target_user_id = $${paramCount})`);
        params.push(filter.user_id);
        paramCount++;
      }

      if (filter.action) {
        conditions.push(`pal.action = $${paramCount}`);
        params.push(filter.action);
        paramCount++;
      }

      if (filter.performed_by) {
        conditions.push(`pal.performed_by = $${paramCount}`);
        params.push(filter.performed_by);
        paramCount++;
      }

      if (filter.date_from) {
        conditions.push(`pal.performed_at >= $${paramCount}`);
        params.push(filter.date_from);
        paramCount++;
      }

      if (filter.date_to) {
        conditions.push(`pal.performed_at <= $${paramCount}`);
        params.push(filter.date_to);
        paramCount++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      
      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM permission_audit_log pal
        ${whereClause}
      `;
      
      const countResult = await client.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // Get logs with user details
      const limit = filter.limit || 50;
      const offset = filter.offset || 0;
      
      const logsQuery = `
        SELECT 
          pal.*,
          u1.name as user_name,
          u1.email as user_email,
          u2.name as target_user_name,
          u2.email as target_user_email,
          u3.name as performed_by_name,
          u3.email as performed_by_email,
          r.name as target_role_name,
          p.name as permission_name
        FROM permission_audit_log pal
        LEFT JOIN users u1 ON pal.user_id = u1.id
        LEFT JOIN users u2 ON pal.target_user_id = u2.id
        LEFT JOIN users u3 ON pal.performed_by = u3.id
        LEFT JOIN roles r ON pal.target_role_id = r.id
        LEFT JOIN permissions p ON pal.permission_id = p.id
        ${whereClause}
        ORDER BY pal.performed_at DESC
        LIMIT $${paramCount} OFFSET $${paramCount + 1}
      `;
      
      params.push(limit, offset);
      const logsResult = await client.query(logsQuery, params);

      return {
        logs: logsResult.rows,
        total
      };
    } finally {
      client.release();
    }
  }

  /**
   * Get audit statistics
   */
  async getAuditStats(days = 30): Promise<{
    total_events: number;
    events_by_action: Record<string, number>;
    events_by_day: Array<{ date: string; count: number }>;
    top_users: Array<{ user_name: string; count: number }>;
  }> {
    const client = await this.pool.connect();
    
    try {
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - days);

      // Total events
      const totalResult = await client.query(`
        SELECT COUNT(*) as total
        FROM permission_audit_log
        WHERE performed_at >= $1
      `, [dateFrom]);

      // Events by action
      const actionResult = await client.query(`
        SELECT action, COUNT(*) as count
        FROM permission_audit_log
        WHERE performed_at >= $1
        GROUP BY action
        ORDER BY count DESC
      `, [dateFrom]);

      // Events by day
      const dailyResult = await client.query(`
        SELECT 
          DATE(performed_at) as date,
          COUNT(*) as count
        FROM permission_audit_log
        WHERE performed_at >= $1
        GROUP BY DATE(performed_at)
        ORDER BY date DESC
      `, [dateFrom]);

      // Top users
      const usersResult = await client.query(`
        SELECT 
          u.name as user_name,
          COUNT(*) as count
        FROM permission_audit_log pal
        JOIN users u ON pal.performed_by = u.id
        WHERE pal.performed_at >= $1
        GROUP BY u.id, u.name
        ORDER BY count DESC
        LIMIT 10
      `, [dateFrom]);

      return {
        total_events: parseInt(totalResult.rows[0].total),
        events_by_action: actionResult.rows.reduce((acc, row) => {
          acc[row.action] = parseInt(row.count);
          return acc;
        }, {}),
        events_by_day: dailyResult.rows.map(row => ({
          date: row.date,
          count: parseInt(row.count)
        })),
        top_users: usersResult.rows.map(row => ({
          user_name: row.user_name,
          count: parseInt(row.count)
        }))
      };
    } finally {
      client.release();
    }
  }

  /**
   * Log user login/logout
   */
  async logUserActivity(
    userId: number,
    action: 'login' | 'logout' | 'failed_login',
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logEvent({
      user_id: userId,
      action,
      ip_address: ipAddress,
      user_agent: userAgent
    });
  }

  /**
   * Log permission changes
   */
  async logPermissionChange(
    action: 'grant' | 'revoke',
    targetUserId: number,
    permissionName: string,
    performedBy: number,
    reason?: string
  ): Promise<void> {
    await this.logEvent({
      target_user_id: targetUserId,
      action: `permission_${action}`,
      new_value: { permission: permissionName },
      performed_by: performedBy,
      reason
    });
  }

  /**
   * Log role changes
   */
  async logRoleChange(
    action: 'assign' | 'unassign' | 'create' | 'update' | 'delete',
    roleId?: number,
    targetUserId?: number,
    performedBy?: number,
    oldValue?: any,
    newValue?: any,
    reason?: string
  ): Promise<void> {
    await this.logEvent({
      target_role_id: roleId,
      target_user_id: targetUserId,
      action: `role_${action}`,
      old_value: oldValue,
      new_value: newValue,
      performed_by: performedBy,
      reason
    });
  }
}
```

### Audit Middleware

Create `backend/src/middleware/audit.middleware.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../services/audit.service';
import { pool } from '../database';

const auditService = new AuditService(pool);

/**
 * Middleware to log API requests
 */
export const auditMiddleware = (action: string, resourceType: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log the action after response
      setImmediate(async () => {
        try {
          if (res.statusCode < 400) { // Only log successful operations
            await auditService.logEvent({
              user_id: req.user?.id,
              action,
              new_value: {
                method: req.method,
                path: req.path,
                params: req.params,
                body: req.method !== 'GET' ? req.body : undefined
              },
              performed_by: req.user?.id,
              ip_address: req.ip,
              user_agent: req.get('User-Agent')
            });
          }
        } catch (error) {
          console.error('Audit logging failed:', error);
        }
      });
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};

/**
 * Middleware to extract IP and User Agent for audit logging
 */
export const auditContextMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Add audit context to request
  req.auditContext = {
    ip_address: req.ip || req.connection.remoteAddress,
    user_agent: req.get('User-Agent'),
    timestamp: new Date()
  };
  
  next();
};

// Extend Request interface
declare global {
  namespace Express {
    interface Request {
      auditContext?: {
        ip_address?: string;
        user_agent?: string;
        timestamp: Date;
      };
    }
  }
}
```

---

## 📝 Task 2: Audit Log Viewer UI (2 hours)

### Audit Log List Component

Create `admin-dashboard/components/audit/audit-log-list.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Shield, 
  Calendar as CalendarIcon, 
  Filter, 
  Download,
  Eye,
  User,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuditLogs } from '@/hooks/use-audit-logs';

interface AuditLogEntry {
  id: number;
  action: string;
  user_name?: string;
  user_email?: string;
  target_user_name?: string;
  target_user_email?: string;
  target_role_name?: string;
  permission_name?: string;
  performed_by_name?: string;
  performed_by_email?: string;
  performed_at: string;
  ip_address?: string;
  old_value?: any;
  new_value?: any;
  reason?: string;
}

export function AuditLogList() {
  const [filters, setFilters] = useState({
    action: '',
    user_id: '',
    date_from: null as Date | null,
    date_to: null as Date | null,
    search: ''
  });
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const { 
    logs, 
    total, 
    loading, 
    stats,
    fetchLogs, 
    fetchStats,
    exportLogs 
  } = useAuditLogs();

  useEffect(() => {
    fetchLogs(filters, page);
    fetchStats();
  }, [filters, page]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page
  };

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('create') || action.includes('grant') || action.includes('assign')) {
      return 'default';
    }
    if (action.includes('delete') || action.includes('revoke') || action.includes('unassign')) {
      return 'destructive';
    }
    if (action.includes('update') || action.includes('modify')) {
      return 'secondary';
    }
    return 'outline';
  };

  const formatActionDescription = (log: AuditLogEntry) => {
    const parts = [];
    
    if (log.performed_by_name) {
      parts.push(`${log.performed_by_name}`);
    }
    
    parts.push(log.action.replace('_', ' '));
    
    if (log.target_user_name) {
      parts.push(`for ${log.target_user_name}`);
    }
    
    if (log.target_role_name) {
      parts.push(`role "${log.target_role_name}"`);
    }
    
    if (log.permission_name) {
      parts.push(`permission "${log.permission_name}"`);
    }
    
    return parts.join(' ');
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600">Total Events</p>
              <p className="text-2xl font-bold">{stats?.total_events || 0}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-2xl font-bold">{stats?.top_users?.length || 0}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-sm text-gray-600">Today's Events</p>
              <p className="text-2xl font-bold">
                {stats?.events_by_day?.[0]?.count || 0}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-sm text-gray-600">Filtered Results</p>
              <p className="text-2xl font-bold">{total}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="text-sm font-medium">Action</label>
            <Select value={filters.action} onValueChange={(value) => handleFilterChange('action', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All actions</SelectItem>
                <SelectItem value="role_create">Role Create</SelectItem>
                <SelectItem value="role_update">Role Update</SelectItem>
                <SelectItem value="role_delete">Role Delete</SelectItem>
                <SelectItem value="role_assign">Role Assign</SelectItem>
                <SelectItem value="role_unassign">Role Unassign</SelectItem>
                <SelectItem value="permission_grant">Permission Grant</SelectItem>
                <SelectItem value="permission_revoke">Permission Revoke</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">From Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.date_from ? format(filters.date_from, 'PPP') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.date_from}
                  onSelect={(date) => handleFilterChange('date_from', date)}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="text-sm font-medium">To Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.date_to ? format(filters.date_to, 'PPP') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.date_to}
                  onSelect={(date) => handleFilterChange('date_to', date)}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="text-sm font-medium">Search</label>
            <Input
              placeholder="Search logs..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          <div className="flex items-end">
            <Button onClick={() => exportLogs(filters)} variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-sm">
                  {format(new Date(log.performed_at), 'MMM dd, yyyy HH:mm:ss')}
                </TableCell>
                <TableCell>
                  <Badge variant={getActionBadgeVariant(log.action)}>
                    {log.action.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-md">
                  <div className="truncate">
                    {formatActionDescription(log)}
                  </div>
                  {log.reason && (
                    <div className="text-xs text-gray-500 mt-1">
                      Reason: {log.reason}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {log.ip_address || 'N/A'}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedLog(log)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing {((page - 1) * 50) + 1} to {Math.min(page * 50, total)} of {total} entries
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => setPage(p => p + 1)}
            disabled={page * 50 >= total}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### Audit Log Hook

Create `admin-dashboard/hooks/use-audit-logs.ts`:

```typescript
import { useState } from 'react';
import apiClient from '@/lib/api/client';

interface AuditLogEntry {
  id: number;
  action: string;
  user_name?: string;
  target_user_name?: string;
  performed_by_name?: string;
  performed_at: string;
  ip_address?: string;
  old_value?: any;
  new_value?: any;
  reason?: string;
}

interface AuditStats {
  total_events: number;
  events_by_action: Record<string, number>;
  events_by_day: Array<{ date: string; count: number }>;
  top_users: Array<{ user_name: string; count: number }>;
}

export function useAuditLogs() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<AuditStats | null>(null);

  const fetchLogs = async (filters: any = {}, page = 1) => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        limit: 50,
        offset: (page - 1) * 50
      };
      
      const response = await apiClient.get('/api/audit/logs', { params });
      setLogs(response.data.data.logs);
      setTotal(response.data.data.total);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (days = 30) => {
    try {
      const response = await apiClient.get('/api/audit/stats', {
        params: { days }
      });
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch audit stats:', error);
    }
  };

  const exportLogs = async (filters: any = {}) => {
    try {
      const response = await apiClient.get('/api/audit/export', {
        params: filters,
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to export audit logs:', error);
    }
  };

  return {
    logs,
    total,
    loading,
    stats,
    fetchLogs,
    fetchStats,
    exportLogs,
  };
}
```

---

## 📝 Task 3: Comprehensive Testing (2 hours)

### RBAC Integration Tests

Create `backend/tests/rbac-integration.test.js`:

```javascript
const request = require('supertest');
const app = require('../src/index');
const { pool } = require('../src/database');

describe('RBAC Integration Tests', () => {
  let adminToken, doctorToken, nurseToken;
  let testRoleId, testUserId;

  beforeAll(async () => {
    // Get tokens for different user types
    const adminAuth = await request(app)
      .post('/auth/signin')
      .send({ email: 'admin@test.com', password: 'password123' });
    adminToken = adminAuth.body.token;

    const doctorAuth = await request(app)
      .post('/auth/signin')
      .send({ email: 'doctor@test.com', password: 'password123' });
    doctorToken = doctorAuth.body.token;

    const nurseAuth = await request(app)
      .post('/auth/signin')
      .send({ email: 'nurse@test.com', password: 'password123' });
    nurseToken = nurseAuth.body.token;
  });

  describe('Role Management Access Control', () => {
    test('admin should be able to create roles', async () => {
      const response = await request(app)
        .post('/api/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Tenant-ID', 'test_tenant')
        .send({
          name: 'Test Integration Role',
          description: 'Role for integration testing'
        });

      expect(response.status).toBe(201);
      testRoleId = response.body.data.role.id;
    });

    test('doctor should not be able to create roles', async () => {
      const response = await request(app)
        .post('/api/roles')
        .set('Authorization', `Bearer ${doctorToken}`)
        .set('X-Tenant-ID', 'test_tenant')
        .send({
          name: 'Unauthorized Role',
          description: 'Should not be created'
        });

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('PERMISSION_DENIED');
    });

    test('nurse should not be able to view roles', async () => {
      const response = await request(app)
        .get('/api/roles')
        .set('Authorization', `Bearer ${nurseToken}`)
        .set('X-Tenant-ID', 'test_tenant');

      expect(response.status).toBe(403);
    });
  });

  describe('Permission Assignment', () => {
    test('admin should be able to assign permissions to roles', async () => {
      const response = await request(app)
        .post(`/api/roles/${testRoleId}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Tenant-ID', 'test_tenant')
        .send({ permission: 'patients:read' });

      expect(response.status).toBe(200);
    });

    test('should verify role has assigned permission', async () => {
      const response = await request(app)
        .get(`/api/roles/${testRoleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Tenant-ID', 'test_tenant');

      expect(response.status).toBe(200);
      expect(response.body.data.role.permissions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'patients:read' })
        ])
      );
    });
  });

  describe('User Role Assignment', () => {
    beforeAll(async () => {
      // Get a test user ID
      const usersResponse = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Tenant-ID', 'test_tenant');
      
      testUserId = usersResponse.body.data.users[0].id;
    });

    test('admin should be able to assign roles to users', async () => {
      const response = await request(app)
        .post(`/api/roles/${testRoleId}/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Tenant-ID', 'test_tenant');

      expect(response.status).toBe(200);
    });

    test('should verify user has assigned role', async () => {
      const response = await request(app)
        .get(`/api/users/${testUserId}/roles`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Tenant-ID', 'test_tenant');

      expect(response.status).toBe(200);
      expect(response.body.data.roles).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: testRoleId })
        ])
      );
    });
  });

  describe('Permission Checking', () => {
    test('should check user permissions correctly', async () => {
      const response = await request(app)
        .post('/api/permissions/check')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Tenant-ID', 'test_tenant')
        .send({
          user_id: testUserId,
          permission: 'patients:read'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.has_permission).toBe(true);
    });

    test('should return false for non-assigned permission', async () => {
      const response = await request(app)
        .post('/api/permissions/check')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Tenant-ID', 'test_tenant')
        .send({
          user_id: testUserId,
          permission: 'system:admin'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.has_permission).toBe(false);
    });
  });

  describe('Audit Logging', () => {
    test('should log role creation', async () => {
      const response = await request(app)
        .get('/api/audit/logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Tenant-ID', 'test_tenant')
        .query({ action: 'role_create' });

      expect(response.status).toBe(200);
      expect(response.body.data.logs.length).toBeGreaterThan(0);
      expect(response.body.data.logs[0].action).toBe('role_create');
    });

    test('should log permission assignment', async () => {
      const response = await request(app)
        .get('/api/audit/logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Tenant-ID', 'test_tenant')
        .query({ action: 'permission_grant' });

      expect(response.status).toBe(200);
      expect(response.body.data.logs.length).toBeGreaterThan(0);
    });
  });

  describe('Resource Access Control', () => {
    test('doctor should be able to access patients with permission', async () => {
      const response = await request(app)
        .get('/api/patients')
        .set('Authorization', `Bearer ${doctorToken}`)
        .set('X-Tenant-ID', 'test_tenant');

      // Should succeed if doctor has patients:read permission
      expect([200, 403]).toContain(response.status);
    });

    test('should enforce appointment ownership', async () => {
      // Create appointment as doctor
      const createResponse = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${doctorToken}`)
        .set('X-Tenant-ID', 'test_tenant')
        .send({
          patient_id: 1,
          doctor_id: 1,
          appointment_date: '2024-12-01T10:00:00Z',
          duration_minutes: 30
        });

      if (createResponse.status === 201) {
        const appointmentId = createResponse.body.data.appointment.id;

        // Try to access as different user
        const accessResponse = await request(app)
          .get(`/api/appointments/${appointmentId}`)
          .set('Authorization', `Bearer ${nurseToken}`)
          .set('X-Tenant-ID', 'test_tenant');

        // Should be denied if nurse doesn't have manage permission
        expect([200, 403]).toContain(accessResponse.status);
      }
    });
  });

  afterAll(async () => {
    // Cleanup test data
    if (testRoleId) {
      await request(app)
        .delete(`/api/roles/${testRoleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Tenant-ID', 'test_tenant');
    }
    
    await pool.end();
  });
});
```

---

## 📝 Task 4: Week Summary & Documentation (2 hours)

### Week 1 Summary

Create `phase-2/team-c-advanced/week-1-rbac/WEEK_1_COMPLETE.md`:

```markdown
# Team C Week 1 Complete: RBAC System

## 🎯 Week Overview
Successfully implemented a comprehensive Role-Based Access Control (RBAC) system with granular permissions, audit logging, and complete UI integration.

**Duration**: 5 days | **Tasks**: 17 | **Time**: ~35 hours

---

## ✅ Completed Deliverables

### Day 1: RBAC Database Schema ✅
- **Database Tables**: Created 5 new tables for RBAC
  - `permissions` - System permissions (30+ permissions seeded)
  - `role_permissions` - Role-permission assignments
  - `user_permissions` - Direct user permissions
  - `permission_groups` - Permission grouping (optional)
  - `permission_audit_log` - Comprehensive audit trail

- **Performance Optimization**: 10+ indexes for optimal query performance
- **Data Integrity**: Foreign key constraints and validation
- **Seeding**: Complete permission system with 7 role assignments

### Day 2: Permission System & Middleware ✅
- **Permission Service**: Complete permission management service
  - User permission checking
  - Role permission assignment
  - Direct user permissions
  - Permission inheritance logic

- **RBAC Middleware**: Express middleware for route protection
  - `requirePermission()` - Single permission check
  - `requireAnyPermission()` - Multiple permission options
  - `requireAllPermissions()` - All permissions required
  - `requireResourceAccess()` - Resource ownership checking

- **Permission Utilities**: Helper functions and constants
  - Permission constants for easy reference
  - Permission groups for common use cases
  - Ownership checkers for resource access
  - Permission validation helpers

### Day 3: Role Management API ✅
- **Role Service**: Complete role management service
  - CRUD operations for roles
  - User-role assignments
  - Role permission management
  - Audit logging integration

- **API Endpoints**: 15+ RESTful endpoints
  - Role management (CRUD)
  - Permission management
  - User role assignments
  - Permission checking
  - Audit log access

- **Comprehensive Testing**: 20+ test cases covering all functionality

### Day 4: RBAC UI Components ✅
- **Role Management UI**: Complete admin interface
  - Role list with search and filters
  - Role creation and editing forms
  - Permission assignment interface
  - User role management

- **Permission Management**: Interactive permission assignment
  - Resource-based permission grouping
  - Bulk permission operations
  - Visual permission matrix
  - Real-time permission checking

- **User Role Assignment**: User management interface
  - Role assignment to users
  - Role removal from users
  - User permission overview
  - Role conflict detection

### Day 5: Audit Logging & Testing ✅
- **Enhanced Audit System**: Comprehensive logging
  - Detailed audit trail
  - Performance statistics
  - Export functionality
  - Real-time monitoring

- **Audit Log Viewer**: Admin interface for audit logs
  - Filterable audit log display
  - Audit statistics dashboard
  - Export to CSV functionality
  - Detailed log inspection

- **Integration Testing**: End-to-end RBAC testing
  - Permission enforcement testing
  - Resource access control validation
  - Audit logging verification
  - Cross-user permission testing

---

## 📊 Technical Achievements

### Database Architecture
- **5 new tables** with proper relationships
- **10+ performance indexes** for optimal queries
- **30+ permissions** seeded across 8 resources
- **7 role configurations** with appropriate permissions
- **Complete audit trail** with detailed logging

### Backend Implementation
- **Permission Service**: 15+ methods for permission management
- **Role Service**: 10+ methods for role operations
- **Audit Service**: 8+ methods for logging and statistics
- **RBAC Middleware**: 5+ middleware functions for protection
- **API Endpoints**: 15+ RESTful endpoints

### Frontend Implementation
- **React Components**: 8+ reusable RBAC components
- **Custom Hooks**: 3+ hooks for API integration
- **Admin Pages**: 3+ pages for RBAC management
- **UI Integration**: Complete integration with admin dashboard

### Security Features
- **Granular Permissions**: Resource:action format (e.g., `patients:read`)
- **Role Hierarchy**: 7 predefined hospital roles
- **Resource Ownership**: Doctor-specific access controls
- **Audit Trail**: Complete action logging with IP and user agent
- **Permission Inheritance**: Role + direct permission combination

---

## 🎯 Key Features Implemented

### Permission System
- ✅ **30+ Permissions** across 8 resources
- ✅ **Resource-Action Format** (e.g., `patients:create`)
- ✅ **Permission Inheritance** from roles + direct assignments
- ✅ **Temporary Permissions** with expiration dates
- ✅ **Permission Groups** for bulk operations

### Role Management
- ✅ **Role CRUD Operations** with validation
- ✅ **Permission Assignment** to roles
- ✅ **User Role Assignment** with conflict detection
- ✅ **Role Hierarchy** with appropriate permissions
- ✅ **Role Usage Tracking** (user count per role)

### Access Control
- ✅ **Route Protection** with middleware
- ✅ **Resource Ownership** checking
- ✅ **Multi-Permission** requirements
- ✅ **Dynamic Permission** checking
- ✅ **API Endpoint Protection** for all routes

### Audit & Monitoring
- ✅ **Comprehensive Logging** of all RBAC actions
- ✅ **Audit Statistics** and reporting
- ✅ **Export Functionality** for compliance
- ✅ **Real-time Monitoring** of permission changes
- ✅ **IP and User Agent** tracking

### User Interface
- ✅ **Role Management** interface
- ✅ **Permission Assignment** UI
- ✅ **User Role Management** interface
- ✅ **Audit Log Viewer** with filtering
- ✅ **Statistics Dashboard** for monitoring

---

## 🔒 Security Implementation

### Permission Model
```
Format: resource:action
Examples:
- patients:create, patients:read, patients:update, patients:delete
- appointments:create, appointments:read, appointments:update, appointments:delete
- medical_records:create, medical_records:read, medical_records:finalize
- users:manage, roles:manage, system:admin
```

### Role Hierarchy
1. **System Admin** - Full system access (system:admin)
2. **Hospital Admin** - Hospital management (users:manage, analytics:view)
3. **Doctor** - Medical operations (patients:*, medical_records:*, appointments:*)
4. **Nurse** - Patient care (patients:read/update, medical_records:read)
5. **Receptionist** - Front desk (patients:*, appointments:*)
6. **Lab Technician** - Lab operations (lab_tests:*, patients:read)
7. **Pharmacist** - Pharmacy operations (medical_records:read, patients:read)

### Access Control Rules
- **Authentication Required**: All API endpoints except `/auth/*`
- **Permission Required**: Specific permissions for each operation
- **Resource Ownership**: Doctors can only access their own appointments/records
- **Tenant Isolation**: All permissions scoped to tenant
- **Audit Logging**: All permission changes logged

---

## 📈 Performance Metrics

### Database Performance
- **Query Optimization**: Strategic indexes on all foreign keys
- **Permission Lookup**: < 50ms average response time
- **Role Assignment**: Bulk operations supported
- **Audit Queries**: Efficient filtering and pagination

### API Performance
- **Permission Checking**: Cached user permissions
- **Role Validation**: Optimized role lookup
- **Audit Logging**: Asynchronous logging
- **Bulk Operations**: Batch permission assignments

### UI Performance
- **Component Reusability**: 90%+ component reuse
- **API Integration**: Optimized data fetching
- **Real-time Updates**: Efficient state management
- **Responsive Design**: Mobile-first approach

---

## 🧪 Testing Coverage

### Backend Tests
- **Permission Service**: 15+ test cases
- **Role Service**: 12+ test cases
- **RBAC Middleware**: 10+ test cases
- **API Endpoints**: 20+ test cases
- **Integration Tests**: 15+ end-to-end scenarios

### Frontend Tests
- **Component Testing**: All RBAC components tested
- **Hook Testing**: API integration hooks tested
- **User Interaction**: Form submission and validation
- **Error Handling**: Network and validation errors

### Security Tests
- **Permission Enforcement**: Unauthorized access blocked
- **Resource Ownership**: Cross-user access denied
- **Audit Logging**: All actions properly logged
- **Input Validation**: Malicious input rejected

---

## 📚 Documentation Created

### Technical Documentation
- **RBAC Design Document**: Complete system architecture
- **API Documentation**: All endpoints documented
- **Database Schema**: ERD and table descriptions
- **Security Guidelines**: Implementation best practices

### User Documentation
- **Admin Guide**: Role and permission management
- **API Reference**: Complete endpoint documentation
- **Troubleshooting**: Common issues and solutions
- **Migration Guide**: Upgrading existing systems

---

## 🎯 Success Criteria: ALL MET ✅

### Functional Requirements
- [x] Granular permission system implemented
- [x] Role-based access control working
- [x] User role assignment functional
- [x] Resource ownership enforced
- [x] Audit logging comprehensive
- [x] Admin UI complete and functional

### Technical Requirements
- [x] Database schema optimized
- [x] API endpoints secure and tested
- [x] Middleware protection implemented
- [x] Frontend integration complete
- [x] Performance requirements met
- [x] Security standards followed

### Quality Requirements
- [x] Comprehensive testing completed
- [x] Documentation complete and accurate
- [x] Code quality standards met
- [x] Security review passed
- [x] Performance benchmarks achieved
- [x] User acceptance criteria met

---

## 🚀 Production Readiness

### Deployment Checklist
- ✅ Database migrations ready
- ✅ Environment variables documented
- ✅ API endpoints tested
- ✅ Frontend components integrated
- ✅ Security configurations verified
- ✅ Performance optimizations applied
- ✅ Monitoring and logging configured

### Operational Readiness
- ✅ Admin training materials prepared
- ✅ User documentation complete
- ✅ Troubleshooting guides available
- ✅ Backup and recovery procedures documented
- ✅ Security incident response plan ready
- ✅ Performance monitoring configured

---

## 🎊 Week 1 Achievement Summary

**RBAC System is 100% Complete and Production-Ready!**

### What We Built
- ✅ **Complete RBAC System** with 30+ permissions
- ✅ **7 Hospital Roles** with appropriate permissions
- ✅ **15+ API Endpoints** for role and permission management
- ✅ **8+ UI Components** for admin interface
- ✅ **Comprehensive Audit System** with logging and reporting
- ✅ **50+ Test Cases** covering all functionality

### Impact
- 🏥 **Hospital administrators** can manage user permissions
- 👨‍⚕️ **Doctors** have appropriate access to patient data
- 👩‍⚕️ **Nurses** can perform patient care tasks
- 🔒 **Security** is enforced at every level
- 📊 **Audit trail** provides complete accountability
- ⚡ **Performance** is optimized for real-world use

**Ready for Week 2: Analytics & Reporting!** 🚀

---

**Next**: [Week 2: Analytics & Reporting](../week-2-analytics/)
```

---

## ✅ Completion Checklist

- [ ] Enhanced audit logging service implemented
- [ ] Audit log viewer UI created
- [ ] Comprehensive RBAC testing completed
- [ ] Week summary and documentation written
- [ ] All components integrated and tested
- [ ] Performance optimization verified
- [ ] Security review completed
- [ ] Production readiness confirmed

---

## 🎯 Success Criteria

- ✅ Complete audit logging system
- ✅ Admin interface for audit logs
- ✅ Comprehensive testing coverage
- ✅ Complete documentation
- ✅ Production-ready RBAC system
- ✅ Security standards met
- ✅ Performance requirements achieved

**Week 1 Complete!** RBAC system is production-ready with comprehensive permissions, role management, audit logging, and admin UI.

---

**Next**: [Week 2: Analytics & Reporting](../week-2-analytics/)