# A3: Backup System - Hybrid S3 + Backblaze B2

**Agent:** Backend Infrastructure Agent A3  
**Track:** Backend Infrastructure  
**Dependencies:** None (can start immediately)  
**Estimated Time:** 4-5 days  
**Complexity:** Medium-High

## Objective
Implement a cost-optimized hybrid backup system using AWS S3 for hot/warm backups and Backblaze B2 for cold storage, with automated retention policies based on subscription tiers.

## Current State Analysis
- ✅ PostgreSQL database operational
- ✅ Multi-tenant schema architecture
- ✅ AWS S3 already configured for file storage
- ❌ No backup system
- ❌ No retention policies
- ❌ No restore procedures

## Implementation Steps

### Step 1: Backblaze B2 Setup (Day 1)
Set up Backblaze B2 account and integration.

**Create Backblaze B2 Account:**
1. Sign up at https://www.backblaze.com/b2/sign-up.html
2. Create a bucket for backups: `hospital-backups-cold`
3. Generate application key with read/write access

**Install B2 SDK:**
```bash
cd backend
npm install backblaze-b2
```

**Environment Variables:**
Add to `backend/.env`:
```env
# Backblaze B2 Configuration
B2_APPLICATION_KEY_ID=your_key_id
B2_APPLICATION_KEY=your_application_key
B2_BUCKET_ID=your_bucket_id
B2_BUCKET_NAME=hospital-backups-cold

# S3 Backup Configuration (already exists)
AWS_REGION=us-east-1
S3_BACKUP_BUCKET=hospital-backups-hot
```

### Step 2: Database Schema (Day 1)
Create backup tracking tables.

**Tables to Create:**
```sql
-- Global schema (public)
CREATE TABLE backup_jobs (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) REFERENCES tenants(id) ON DELETE CASCADE,
  backup_type VARCHAR(50) NOT NULL, -- 'full', 'incremental'
  storage_tier VARCHAR(50) NOT NULL, -- 's3_standard', 's3_ia', 'b2_cold'
  backup_size_bytes BIGINT,
  backup_location TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE backup_schedules (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) REFERENCES tenants(id) ON DELETE CASCADE,
  schedule_type VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly'
  storage_tier VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMP,
  next_run_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE backup_retention_policies (
  id SERIAL PRIMARY KEY,
  tier_id VARCHAR(50) NOT NULL REFERENCES subscription_tiers(id),
  daily_retention_days INTEGER DEFAULT 0,
  weekly_retention_weeks INTEGER DEFAULT 0,
  monthly_retention_months INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_backup_jobs_tenant ON backup_jobs(tenant_id);
CREATE INDEX idx_backup_jobs_status ON backup_jobs(status);
CREATE INDEX idx_backup_jobs_created ON backup_jobs(created_at);
CREATE INDEX idx_backup_schedules_tenant ON backup_schedules(tenant_id);
CREATE INDEX idx_backup_schedules_next_run ON backup_schedules(next_run_at);
```

**Seed Retention Policies:**
```sql
INSERT INTO backup_retention_policies (tier_id, daily_retention_days, weekly_retention_weeks, monthly_retention_months) VALUES
('basic', 0, 0, 0),  -- No backups
('advanced', 0, 0, 12),  -- Monthly for 1 year
('premium', 7, 4, 12);  -- Daily 7 days, Weekly 4 weeks, Monthly 1 year
```

### Step 3: TypeScript Types (Day 1)
Create type definitions for backup system.

**File:** `backend/src/types/backup.ts`
```typescript
export type BackupType = 'full' | 'incremental';
export type StorageTier = 's3_standard' | 's3_ia' | 'b2_cold';
export type BackupStatus = 'pending' | 'running' | 'completed' | 'failed';
export type ScheduleType = 'daily' | 'weekly' | 'monthly';

export interface BackupJob {
  id: number;
  tenant_id: string;
  backup_type: BackupType;
  storage_tier: StorageTier;
  backup_size_bytes: number | null;
  backup_location: string;
  status: BackupStatus;
  started_at: Date | null;
  completed_at: Date | null;
  error_message: string | null;
  metadata: Record<string, any>;
  created_at: Date;
}

export interface BackupSchedule {
  id: number;
  tenant_id: string;
  schedule_type: ScheduleType;
  storage_tier: StorageTier;
  is_active: boolean;
  last_run_at: Date | null;
  next_run_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface BackupRetentionPolicy {
  id: number;
  tier_id: string;
  daily_retention_days: number;
  weekly_retention_weeks: number;
  monthly_retention_months: number;
  created_at: Date;
  updated_at: Date;
}

export interface BackupConfig {
  tenantId: string;
  backupType: BackupType;
  storageTier: StorageTier;
  includeFiles?: boolean;
}

export interface RestoreConfig {
  tenantId: string;
  backupJobId: number;
  restoreFiles?: boolean;
  targetSchema?: string;
}
```

### Step 4: Backup Service (Day 2-3)
Create comprehensive backup service.

**File:** `backend/src/services/backup.ts`
```typescript
import { pool } from '../database';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import B2 from 'backblaze-b2';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

export class BackupService {
  private s3Client: S3Client;
  private b2Client: B2;

  constructor() {
    this.s3Client = new S3Client({ region: process.env.AWS_REGION });
    this.b2Client = new B2({
      applicationKeyId: process.env.B2_APPLICATION_KEY_ID!,
      applicationKey: process.env.B2_APPLICATION_KEY!
    });
  }

  // Create backup for tenant
  async createBackup(config: BackupConfig): Promise<BackupJob> {
    const { tenantId, backupType, storageTier } = config;

    // Create backup job record
    const jobResult = await pool.query(`
      INSERT INTO backup_jobs (tenant_id, backup_type, storage_tier, status)
      VALUES ($1, $2, $3, 'pending')
      RETURNING *
    `, [tenantId, backupType, storageTier]);

    const job = jobResult.rows[0];

    // Start backup process asynchronously
    this.performBackup(job.id, config).catch(err => {
      console.error('Backup failed:', err);
      this.updateJobStatus(job.id, 'failed', err.message);
    });

    return job;
  }

  // Perform actual backup
  private async performBackup(jobId: number, config: BackupConfig): Promise<void> {
    const { tenantId, backupType, storageTier } = config;

    try {
      // Update status to running
      await this.updateJobStatus(jobId, 'running');

      // Create temporary directory for backup
      const backupDir = path.join('/tmp', `backup-${jobId}`);
      fs.mkdirSync(backupDir, { recursive: true });

      // Dump database schema
      const dumpFile = path.join(backupDir, `${tenantId}.sql`);
      await this.dumpTenantSchema(tenantId, dumpFile);

      // Compress backup
      const compressedFile = `${dumpFile}.gz`;
      await execAsync(`gzip ${dumpFile}`);

      // Get file size
      const stats = fs.statSync(compressedFile);
      const fileSize = stats.size;

      // Upload to appropriate storage
      let backupLocation: string;
      if (storageTier === 'b2_cold') {
        backupLocation = await this.uploadToB2(compressedFile, tenantId, jobId);
      } else {
        backupLocation = await this.uploadToS3(compressedFile, tenantId, jobId, storageTier);
      }

      // Update job with completion
      await pool.query(`
        UPDATE backup_jobs 
        SET status = 'completed',
            backup_size_bytes = $1,
            backup_location = $2,
            completed_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [fileSize, backupLocation, jobId]);

      // Cleanup temporary files
      fs.unlinkSync(compressedFile);
      fs.rmdirSync(backupDir);

    } catch (error: any) {
      await this.updateJobStatus(jobId, 'failed', error.message);
      throw error;
    }
  }

  // Dump tenant schema to file
  private async dumpTenantSchema(tenantId: string, outputFile: string): Promise<void> {
    const command = `docker exec backend-postgres-1 pg_dump -U postgres -d multitenant_db -n "${tenantId}" -f /tmp/dump.sql && docker cp backend-postgres-1:/tmp/dump.sql ${outputFile}`;
    await execAsync(command);
  }

  // Upload to S3
  private async uploadToS3(
    filePath: string,
    tenantId: string,
    jobId: number,
    storageTier: StorageTier
  ): Promise<string> {
    const fileName = path.basename(filePath);
    const s3Key = `backups/${tenantId}/${jobId}/${fileName}`;
    
    const fileContent = fs.readFileSync(filePath);
    
    const storageClass = storageTier === 's3_ia' ? 'STANDARD_IA' : 'STANDARD';
    
    await this.s3Client.send(new PutObjectCommand({
      Bucket: process.env.S3_BACKUP_BUCKET,
      Key: s3Key,
      Body: fileContent,
      StorageClass: storageClass
    }));

    return `s3://${process.env.S3_BACKUP_BUCKET}/${s3Key}`;
  }

  // Upload to Backblaze B2
  private async uploadToB2(
    filePath: string,
    tenantId: string,
    jobId: number
  ): Promise<string> {
    await this.b2Client.authorize();

    const fileName = path.basename(filePath);
    const b2FileName = `backups/${tenantId}/${jobId}/${fileName}`;
    
    const fileContent = fs.readFileSync(filePath);
    
    const uploadUrl = await this.b2Client.getUploadUrl({
      bucketId: process.env.B2_BUCKET_ID!
    });

    const response = await this.b2Client.uploadFile({
      uploadUrl: uploadUrl.data.uploadUrl,
      uploadAuthToken: uploadUrl.data.authorizationToken,
      fileName: b2FileName,
      data: fileContent
    });

    return `b2://${process.env.B2_BUCKET_NAME}/${b2FileName}`;
  }

  // Restore backup
  async restoreBackup(config: RestoreConfig): Promise<void> {
    const { tenantId, backupJobId, targetSchema } = config;

    // Get backup job details
    const jobResult = await pool.query(
      'SELECT * FROM backup_jobs WHERE id = $1',
      [backupJobId]
    );

    if (!jobResult.rows.length) {
      throw new Error('Backup job not found');
    }

    const job = jobResult.rows[0];
    const backupLocation = job.backup_location;

    // Download backup file
    const tempFile = `/tmp/restore-${backupJobId}.sql.gz`;
    
    if (backupLocation.startsWith('s3://')) {
      await this.downloadFromS3(backupLocation, tempFile);
    } else if (backupLocation.startsWith('b2://')) {
      await this.downloadFromB2(backupLocation, tempFile);
    }

    // Decompress
    await execAsync(`gunzip ${tempFile}`);
    const sqlFile = tempFile.replace('.gz', '');

    // Restore to database
    const schema = targetSchema || tenantId;
    await this.restoreToDatabase(sqlFile, schema);

    // Cleanup
    fs.unlinkSync(sqlFile);
  }

  // Download from S3
  private async downloadFromS3(s3Location: string, outputFile: string): Promise<void> {
    const s3Key = s3Location.replace(`s3://${process.env.S3_BACKUP_BUCKET}/`, '');
    
    const response = await this.s3Client.send(new GetObjectCommand({
      Bucket: process.env.S3_BACKUP_BUCKET,
      Key: s3Key
    }));

    const stream = response.Body as any;
    const writeStream = fs.createWriteStream(outputFile);
    
    await new Promise((resolve, reject) => {
      stream.pipe(writeStream);
      stream.on('end', resolve);
      stream.on('error', reject);
    });
  }

  // Download from B2
  private async downloadFromB2(b2Location: string, outputFile: string): Promise<void> {
    await this.b2Client.authorize();
    
    const fileName = b2Location.replace(`b2://${process.env.B2_BUCKET_NAME}/`, '');
    
    const response = await this.b2Client.downloadFileByName({
      bucketName: process.env.B2_BUCKET_NAME!,
      fileName: fileName
    });

    fs.writeFileSync(outputFile, response.data);
  }

  // Restore to database
  private async restoreToDatabase(sqlFile: string, schema: string): Promise<void> {
    const command = `docker cp ${sqlFile} backend-postgres-1:/tmp/restore.sql && docker exec backend-postgres-1 psql -U postgres -d multitenant_db -c "DROP SCHEMA IF EXISTS \\"${schema}\\" CASCADE; CREATE SCHEMA \\"${schema}\\";" && docker exec backend-postgres-1 psql -U postgres -d multitenant_db -f /tmp/restore.sql`;
    await execAsync(command);
  }

  // Setup backup schedules for tenant
  async setupBackupSchedules(tenantId: string, tierId: string): Promise<void> {
    // Get retention policy for tier
    const policyResult = await pool.query(
      'SELECT * FROM backup_retention_policies WHERE tier_id = $1',
      [tierId]
    );

    if (!policyResult.rows.length) return;

    const policy = policyResult.rows[0];

    // Create schedules based on policy
    if (policy.daily_retention_days > 0) {
      await this.createSchedule(tenantId, 'daily', 's3_standard');
    }

    if (policy.weekly_retention_weeks > 0) {
      await this.createSchedule(tenantId, 'weekly', 's3_ia');
    }

    if (policy.monthly_retention_months > 0) {
      await this.createSchedule(tenantId, 'monthly', 'b2_cold');
    }
  }

  // Create backup schedule
  private async createSchedule(
    tenantId: string,
    scheduleType: ScheduleType,
    storageTier: StorageTier
  ): Promise<void> {
    const nextRun = this.calculateNextRun(scheduleType);

    await pool.query(`
      INSERT INTO backup_schedules (tenant_id, schedule_type, storage_tier, next_run_at)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (tenant_id, schedule_type) DO UPDATE
      SET storage_tier = $3, next_run_at = $4, is_active = true
    `, [tenantId, scheduleType, storageTier, nextRun]);
  }

  // Calculate next run time
  private calculateNextRun(scheduleType: ScheduleType): Date {
    const now = new Date();
    
    switch (scheduleType) {
      case 'daily':
        now.setDate(now.getDate() + 1);
        now.setHours(2, 0, 0, 0); // 2 AM
        break;
      case 'weekly':
        now.setDate(now.getDate() + 7);
        now.setHours(3, 0, 0, 0); // 3 AM Sunday
        break;
      case 'monthly':
        now.setMonth(now.getMonth() + 1);
        now.setDate(1);
        now.setHours(4, 0, 0, 0); // 4 AM 1st of month
        break;
    }

    return now;
  }

  // Process scheduled backups (called by cron job)
  async processScheduledBackups(): Promise<void> {
    const result = await pool.query(`
      SELECT * FROM backup_schedules 
      WHERE is_active = true 
      AND next_run_at <= CURRENT_TIMESTAMP
    `);

    for (const schedule of result.rows) {
      await this.createBackup({
        tenantId: schedule.tenant_id,
        backupType: 'full',
        storageTier: schedule.storage_tier
      });

      // Update next run time
      const nextRun = this.calculateNextRun(schedule.schedule_type);
      await pool.query(
        'UPDATE backup_schedules SET last_run_at = CURRENT_TIMESTAMP, next_run_at = $1 WHERE id = $2',
        [nextRun, schedule.id]
      );
    }
  }

  // Cleanup old backups based on retention policy
  async cleanupOldBackups(): Promise<void> {
    const result = await pool.query(`
      SELECT bj.*, brp.*
      FROM backup_jobs bj
      JOIN tenant_subscriptions ts ON bj.tenant_id = ts.tenant_id
      JOIN backup_retention_policies brp ON ts.tier_id = brp.tier_id
      WHERE bj.status = 'completed'
    `);

    for (const row of result.rows) {
      const retentionDays = this.getRetentionDays(row);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      if (new Date(row.created_at) < cutoffDate) {
        await this.deleteBackup(row.id, row.backup_location);
      }
    }
  }

  private getRetentionDays(row: any): number {
    // Calculate total retention days based on policy
    return (row.daily_retention_days || 0) + 
           (row.weekly_retention_weeks || 0) * 7 + 
           (row.monthly_retention_months || 0) * 30;
  }

  private async deleteBackup(jobId: number, location: string): Promise<void> {
    // Delete from storage
    // TODO: Implement S3 and B2 deletion

    // Mark job as deleted
    await pool.query(
      'UPDATE backup_jobs SET status = $1 WHERE id = $2',
      ['deleted', jobId]
    );
  }

  private async updateJobStatus(
    jobId: number,
    status: BackupStatus,
    errorMessage?: string
  ): Promise<void> {
    await pool.query(`
      UPDATE backup_jobs 
      SET status = $1, error_message = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `, [status, errorMessage, jobId]);
  }
}

export const backupService = new BackupService();
```

### Step 5: API Routes (Day 3-4)
Create API endpoints for backup management.

**File:** `backend/src/routes/backup.ts`
```typescript
import express from 'express';
import { backupService } from '../services/backup';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Create manual backup
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { tenant_id, backup_type, storage_tier } = req.body;
    
    const job = await backupService.createBackup({
      tenantId: tenant_id,
      backupType: backup_type || 'full',
      storageTier: storage_tier || 's3_standard'
    });

    res.json({ 
      message: 'Backup job created',
      job 
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

// Get backup history for tenant
router.get('/tenant/:tenantId', authMiddleware, async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM backup_jobs WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50',
      [tenantId]
    );

    res.json({ backups: result.rows });
  } catch (error) {
    console.error('Error fetching backups:', error);
    res.status(500).json({ error: 'Failed to fetch backups' });
  }
});

// Restore backup
router.post('/restore', authMiddleware, async (req, res) => {
  try {
    const { tenant_id, backup_job_id } = req.body;
    
    await backupService.restoreBackup({
      tenantId: tenant_id,
      backupJobId: backup_job_id
    });

    res.json({ message: 'Backup restored successfully' });
  } catch (error) {
    console.error('Error restoring backup:', error);
    res.status(500).json({ error: 'Failed to restore backup' });
  }
});

// Get backup schedules
router.get('/schedules/:tenantId', authMiddleware, async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM backup_schedules WHERE tenant_id = $1',
      [tenantId]
    );

    res.json({ schedules: result.rows });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
});

export default router;
```

### Step 6: Cron Job Setup (Day 4)
Set up automated backup processing.

**File:** `backend/src/jobs/backupCron.ts`
```typescript
import cron from 'node-cron';
import { backupService } from '../services/backup';

export function setupBackupCron() {
  // Run every hour to check for scheduled backups
  cron.schedule('0 * * * *', async () => {
    console.log('Processing scheduled backups...');
    try {
      await backupService.processScheduledBackups();
      console.log('Scheduled backups processed');
    } catch (error) {
      console.error('Error processing scheduled backups:', error);
    }
  });

  // Run daily at midnight to cleanup old backups
  cron.schedule('0 0 * * *', async () => {
    console.log('Cleaning up old backups...');
    try {
      await backupService.cleanupOldBackups();
      console.log('Old backups cleaned up');
    } catch (error) {
      console.error('Error cleaning up backups:', error);
    }
  });

  console.log('Backup cron jobs scheduled');
}
```

**Update:** `backend/src/index.ts`
```typescript
import backupRoutes from './routes/backup';
import { setupBackupCron } from './jobs/backupCron';

app.use('/api/backups', backupRoutes);

// Setup cron jobs
setupBackupCron();
```

### Step 7: Testing (Day 5)
Create comprehensive tests.

**File:** `backend/tests/test-backup-system.js`
```javascript
const axios = require('axios');

const API_URL = 'http://localhost:3000';
const TENANT_ID = 'tenant_1762083064503';

async function testBackupSystem() {
  console.log('🧪 Testing Backup System\n');

  try {
    // Test 1: Create manual backup
    console.log('Test 1: Creating manual backup...');
    const backupResponse = await axios.post(
      `${API_URL}/api/backups/create`,
      {
        tenant_id: TENANT_ID,
        backup_type: 'full',
        storage_tier: 's3_standard'
      },
      {
        headers: { 'Authorization': 'Bearer test_token' }
      }
    );
    console.log('✅ Backup job created:', backupResponse.data.job.id);

    // Wait for backup to complete
    console.log('\nWaiting for backup to complete...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Test 2: Get backup history
    console.log('\nTest 2: Fetching backup history...');
    const historyResponse = await axios.get(
      `${API_URL}/api/backups/tenant/${TENANT_ID}`,
      {
        headers: { 'Authorization': 'Bearer test_token' }
      }
    );
    console.log('✅ Backups found:', historyResponse.data.backups.length);

    // Test 3: Get backup schedules
    console.log('\nTest 3: Fetching backup schedules...');
    const schedulesResponse = await axios.get(
      `${API_URL}/api/backups/schedules/${TENANT_ID}`,
      {
        headers: { 'Authorization': 'Bearer test_token' }
      }
    );
    console.log('✅ Schedules found:', schedulesResponse.data.schedules.length);

    console.log('\n✅ All backup system tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testBackupSystem();
```

## Validation Checklist

### Database
- [ ] Backup tables created
- [ ] Retention policies seeded
- [ ] Indexes created

### Backend
- [ ] Backblaze B2 configured
- [ ] Backup service implemented
- [ ] S3 upload working
- [ ] B2 upload working
- [ ] Restore functionality working
- [ ] Cron jobs scheduled

### Integration
- [ ] Routes added to main app
- [ ] Schedules created on tenant subscription
- [ ] Automated backups running
- [ ] Cleanup working

### Testing
- [ ] Can create manual backup
- [ ] Can restore backup
- [ ] Scheduled backups execute
- [ ] Old backups cleaned up
- [ ] Multi-tier storage working

## Success Criteria
- Backup system fully operational
- S3 + B2 hybrid storage working
- Automated schedules running
- Retention policies enforced
- Restore procedures tested
- Cost savings achieved (75%)

## Next Steps
After completion, this enables:
- Agent D2 to show backup status in admin dashboard
- Automated disaster recovery
- Compliance with data retention requirements

## Notes for AI Agent
- Test backup and restore thoroughly
- Monitor storage costs
- Ensure backups don't impact performance
- Document restore procedures clearly
- Consider encryption for sensitive data
