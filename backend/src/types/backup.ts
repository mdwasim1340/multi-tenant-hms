export type BackupType = 'full' | 'incremental';
export type StorageTier = 's3_standard' | 's3_ia' | 'b2_cold';
export type BackupStatus = 'pending' | 'running' | 'completed' | 'failed' | 'deleted';
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

export interface BackupStats {
  totalBackups: number;
  completedBackups: number;
  failedBackups: number;
  totalSizeBytes: number;
  lastBackupDate: Date | null;
}