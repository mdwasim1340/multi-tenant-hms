import pool from '../database';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import { 
  BackupJob, 
  BackupSchedule, 
  BackupConfig, 
  RestoreConfig, 
  BackupType, 
  BackupStatus, 
  StorageTier, 
  ScheduleType,
  BackupStats
} from '../types/backup';

const execAsync = promisify(exec);

export class BackupService {
  private s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({ region: process.env.AWS_REGION });
  }

  // Create backup for tenant
  async createBackup(config: BackupConfig): Promise<BackupJob> {
    const { tenantId, backupType, storageTier } = config;

    // Create backup job record
    const jobResult = await pool.query(`
      INSERT INTO backup_jobs (tenant_id, backup_type, storage_tier, status, started_at)
      VALUES ($1, $2, $3, 'pending', CURRENT_TIMESTAMP)
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

      // Create temporary directory for backup (cross-platform)
      const tmpDir = process.platform === 'win32' ? process.env.TEMP || 'C:\\temp' : '/tmp';
      const backupDir = path.join(tmpDir, `backup-${jobId}`);
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      // Create backup file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `${tenantId}-${timestamp}.sql`;
      const backupFile = path.join(backupDir, backupFileName);

      // Dump tenant schema
      await this.dumpTenantSchema(tenantId, backupFile);

      // Compress backup using Node.js built-in zlib
      const compressedFile = `${backupFile}.gz`;
      await this.compressFile(backupFile, compressedFile);

      // Get file size
      const stats = fs.statSync(compressedFile);
      const fileSize = stats.size;

      // Upload to S3 (simplified - only S3 for now)
      const backupLocation = await this.uploadToS3(compressedFile, tenantId, jobId, storageTier);

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
      if (fs.existsSync(compressedFile)) {
        fs.unlinkSync(compressedFile);
      }
      if (fs.existsSync(backupDir)) {
        fs.rmSync(backupDir, { recursive: true, force: true });
      }

      console.log(`✅ Backup completed for tenant ${tenantId}, job ${jobId}`);

    } catch (error: any) {
      console.error(`❌ Backup failed for tenant ${tenantId}, job ${jobId}:`, error);
      await this.updateJobStatus(jobId, 'failed', error.message);
      throw error;
    }
  }

  // Compress file using Node.js zlib
  private async compressFile(inputFile: string, outputFile: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const readStream = fs.createReadStream(inputFile);
      const writeStream = fs.createWriteStream(outputFile);
      const gzipStream = zlib.createGzip();

      readStream
        .pipe(gzipStream)
        .pipe(writeStream)
        .on('finish', () => {
          // Remove original file after compression
          fs.unlinkSync(inputFile);
          resolve();
        })
        .on('error', reject);
    });
  }

  // Dump tenant schema to file
  private async dumpTenantSchema(tenantId: string, outputFile: string): Promise<void> {
    try {
      // Check if tenant schema exists
      const schemaCheck = await pool.query(
        'SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1',
        [tenantId]
      );

      if (schemaCheck.rows.length === 0) {
        throw new Error(`Tenant schema '${tenantId}' does not exist`);
      }

      // Use pg_dump to export the tenant schema
      const command = `docker exec backend-postgres-1 pg_dump -U postgres -d multitenant_db -n "${tenantId}" --no-owner --no-privileges`;
      
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr && !stderr.includes('WARNING')) {
        throw new Error(`pg_dump error: ${stderr}`);
      }

      // Write the dump to file
      fs.writeFileSync(outputFile, stdout);
      
      console.log(`📦 Schema dumped for tenant ${tenantId} to ${outputFile}`);
    } catch (error: any) {
      throw new Error(`Failed to dump tenant schema: ${error.message}`);
    }
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
      Bucket: process.env.S3_BUCKET_NAME,
      Key: s3Key,
      Body: fileContent,
      StorageClass: storageClass,
      Metadata: {
        'tenant-id': tenantId,
        'backup-job-id': jobId.toString(),
        'backup-type': 'database-schema'
      }
    }));

    console.log(`☁️ Backup uploaded to S3: s3://${process.env.S3_BUCKET_NAME}/${s3Key}`);
    return `s3://${process.env.S3_BUCKET_NAME}/${s3Key}`;
  }

  // Get backup history for tenant
  async getBackupHistory(tenantId: string, limit: number = 50): Promise<BackupJob[]> {
    const result = await pool.query(`
      SELECT * FROM backup_jobs 
      WHERE tenant_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `, [tenantId, limit]);

    return result.rows;
  }

  // Get backup statistics for tenant
  async getBackupStats(tenantId: string): Promise<BackupStats> {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_backups,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_backups,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_backups,
        COALESCE(SUM(backup_size_bytes), 0) as total_size_bytes,
        MAX(CASE WHEN status = 'completed' THEN completed_at END) as last_backup_date
      FROM backup_jobs 
      WHERE tenant_id = $1
    `, [tenantId]);

    const row = result.rows[0];
    return {
      totalBackups: parseInt(row.total_backups),
      completedBackups: parseInt(row.completed_backups),
      failedBackups: parseInt(row.failed_backups),
      totalSizeBytes: parseInt(row.total_size_bytes),
      lastBackupDate: row.last_backup_date
    };
  }

  // Setup backup schedules for tenant based on subscription tier
  async setupBackupSchedules(tenantId: string, tierId: string): Promise<void> {
    // Get retention policy for tier
    const policyResult = await pool.query(
      'SELECT * FROM backup_retention_policies WHERE tier_id = $1',
      [tierId]
    );

    if (!policyResult.rows.length) {
      console.log(`No backup policy found for tier ${tierId}`);
      return;
    }

    const policy = policyResult.rows[0];

    // Create schedules based on policy
    if (policy.daily_retention_days > 0) {
      await this.createSchedule(tenantId, 'daily', 's3_standard');
    }

    if (policy.weekly_retention_weeks > 0) {
      await this.createSchedule(tenantId, 'weekly', 's3_ia');
    }

    if (policy.monthly_retention_months > 0) {
      await this.createSchedule(tenantId, 'monthly', 's3_ia'); // Using S3 IA instead of B2 for now
    }

    console.log(`✅ Backup schedules set up for tenant ${tenantId} with tier ${tierId}`);
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
      SET storage_tier = $3, next_run_at = $4, is_active = true, updated_at = CURRENT_TIMESTAMP
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

  // Get backup schedules for tenant
  async getBackupSchedules(tenantId: string): Promise<BackupSchedule[]> {
    const result = await pool.query(
      'SELECT * FROM backup_schedules WHERE tenant_id = $1 ORDER BY schedule_type',
      [tenantId]
    );

    return result.rows;
  }

  // Process scheduled backups (called by cron job)
  async processScheduledBackups(): Promise<void> {
    const result = await pool.query(`
      SELECT * FROM backup_schedules 
      WHERE is_active = true 
      AND next_run_at <= CURRENT_TIMESTAMP
    `);

    console.log(`📅 Processing ${result.rows.length} scheduled backups`);

    for (const schedule of result.rows) {
      try {
        console.log(`🔄 Creating scheduled backup for tenant ${schedule.tenant_id} (${schedule.schedule_type})`);
        
        await this.createBackup({
          tenantId: schedule.tenant_id,
          backupType: 'full',
          storageTier: schedule.storage_tier
        });

        // Update next run time
        const nextRun = this.calculateNextRun(schedule.schedule_type);
        await pool.query(
          'UPDATE backup_schedules SET last_run_at = CURRENT_TIMESTAMP, next_run_at = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [nextRun, schedule.id]
        );

        console.log(`✅ Scheduled backup created for tenant ${schedule.tenant_id}`);
      } catch (error) {
        console.error(`❌ Failed to create scheduled backup for tenant ${schedule.tenant_id}:`, error);
      }
    }
  }

  // Update job status
  private async updateJobStatus(
    jobId: number,
    status: BackupStatus,
    errorMessage?: string
  ): Promise<void> {
    await pool.query(`
      UPDATE backup_jobs 
      SET status = $1, error_message = $2
      WHERE id = $3
    `, [status, errorMessage || null, jobId]);
  }

  // Get all tenants backup summary (admin only)
  async getAllTenantsBackupSummary(): Promise<any[]> {
    const result = await pool.query(`
      SELECT 
        t.id as tenant_id,
        t.name as tenant_name,
        COUNT(bj.id) as total_backups,
        COUNT(CASE WHEN bj.status = 'completed' THEN 1 END) as completed_backups,
        COUNT(CASE WHEN bj.status = 'failed' THEN 1 END) as failed_backups,
        COALESCE(SUM(bj.backup_size_bytes), 0) as total_size_bytes,
        MAX(CASE WHEN bj.status = 'completed' THEN bj.completed_at END) as last_backup_date
      FROM tenants t
      LEFT JOIN backup_jobs bj ON t.id = bj.tenant_id
      GROUP BY t.id, t.name
      ORDER BY t.name
    `);

    return result.rows;
  }
}

export const backupService = new BackupService();