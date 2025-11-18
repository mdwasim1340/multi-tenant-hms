/**
 * Team Alpha - S3 Lifecycle Management Service
 * Complete S3 lifecycle policies and optimization
 */

import { S3Client, GetBucketLifecycleConfigurationCommand, PutBucketLifecycleConfigurationCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { pool } from '../database';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const S3_BUCKET = process.env.S3_BUCKET_NAME || 'hospital-medical-records';

export interface LifecycleRule {
  id: string;
  status: 'Enabled' | 'Disabled';
  filter?: {
    prefix?: string;
    tags?: { [key: string]: string };
  };
  transitions?: Array<{
    days: number;
    storageClass: string;
  }>;
  noncurrentVersionTransitions?: Array<{
    noncurrentDays: number;
    storageClass: string;
  }>;
  abortIncompleteMultipartUpload?: {
    daysAfterInitiation: number;
  };
  expiration?: {
    days: number;
  };
  noncurrentVersionExpiration?: {
    noncurrentDays: number;
  };
}

export interface StorageClassInfo {
  name: string;
  costPerGB: number;
  retrievalCostPerGB: number;
  minimumStorageDuration: number;
  description: string;
}

/**
 * S3 Storage Class Pricing (approximate, per GB per month)
 */
export const STORAGE_CLASSES: { [key: string]: StorageClassInfo } = {
  STANDARD: {
    name: 'Standard',
    costPerGB: 0.023,
    retrievalCostPerGB: 0,
    minimumStorageDuration: 0,
    description: 'Frequently accessed data'
  },
  STANDARD_IA: {
    name: 'Standard-Infrequent Access',
    costPerGB: 0.0125,
    retrievalCostPerGB: 0.01,
    minimumStorageDuration: 30,
    description: 'Infrequently accessed data'
  },
  INTELLIGENT_TIERING: {
    name: 'Intelligent-Tiering',
    costPerGB: 0.023, // Same as Standard for frequent access
    retrievalCostPerGB: 0,
    minimumStorageDuration: 0,
    description: 'Automatic cost optimization'
  },
  GLACIER: {
    name: 'Glacier',
    costPerGB: 0.004,
    retrievalCostPerGB: 0.03,
    minimumStorageDuration: 90,
    description: 'Long-term archival'
  },
  DEEP_ARCHIVE: {
    name: 'Deep Archive',
    costPerGB: 0.00099,
    retrievalCostPerGB: 0.02,
    minimumStorageDuration: 180,
    description: 'Lowest cost archival'
  }
};

/**
 * Get current lifecycle configuration
 */
export async function getCurrentLifecycleConfiguration(): Promise<LifecycleRule[]> {
  try {
    const command = new GetBucketLifecycleConfigurationCommand({
      Bucket: S3_BUCKET
    });
    
    const response = await s3Client.send(command);
    
    return response.Rules?.map(rule => ({
      id: rule.ID || '',
      status: rule.Status as 'Enabled' | 'Disabled',
      filter: rule.Filter ? {
        prefix: rule.Filter.Prefix,
        tags: rule.Filter.Tag ? { [rule.Filter.Tag.Key]: rule.Filter.Tag.Value } : undefined
      } : undefined,
      transitions: rule.Transitions?.map(t => ({
        days: t.Days || 0,
        storageClass: t.StorageClass || ''
      })),
      noncurrentVersionTransitions: rule.NoncurrentVersionTransitions?.map(t => ({
        noncurrentDays: t.NoncurrentDays || 0,
        storageClass: t.StorageClass || ''
      })),
      abortIncompleteMultipartUpload: rule.AbortIncompleteMultipartUpload ? {
        daysAfterInitiation: rule.AbortIncompleteMultipartUpload.DaysAfterInitiation || 7
      } : undefined,
      expiration: rule.Expiration?.Days ? {
        days: rule.Expiration.Days
      } : undefined,
      noncurrentVersionExpiration: rule.NoncurrentVersionExpiration?.NoncurrentDays ? {
        noncurrentDays: rule.NoncurrentVersionExpiration.NoncurrentDays
      } : undefined
    })) || [];
  } catch (error) {
    console.error('Failed to get lifecycle configuration:', error);
    return [];
  }
}

/**
 * Apply comprehensive lifecycle configuration
 */
export async function applyLifecycleConfiguration(): Promise<boolean> {
  try {
    const lifecycleRules = [
      {
        ID: 'medical-records-lifecycle',
        Status: 'Enabled',
        Filter: {
          Prefix: '' // Apply to all objects
        },
        Transitions: [
          {
            Days: 30,
            StorageClass: 'STANDARD_IA'
          },
          {
            Days: 90,
            StorageClass: 'GLACIER'
          },
          {
            Days: 180,
            StorageClass: 'DEEP_ARCHIVE'
          }
        ],
        NoncurrentVersionTransitions: [
          {
            NoncurrentDays: 30,
            StorageClass: 'STANDARD_IA'
          },
          {
            NoncurrentDays: 60,
            StorageClass: 'GLACIER'
          },
          {
            NoncurrentDays: 90,
            StorageClass: 'DEEP_ARCHIVE'
          }
        ],
        AbortIncompleteMultipartUpload: {
          DaysAfterInitiation: 7
        }
      },
      {
        ID: 'intelligent-tiering-rule',
        Status: 'Enabled',
        Filter: {
          Prefix: ''
        },
        Transitions: [
          {
            Days: 0,
            StorageClass: 'INTELLIGENT_TIERING'
          }
        ]
      },
      {
        ID: 'delete-old-versions',
        Status: 'Enabled',
        Filter: {
          Prefix: ''
        },
        NoncurrentVersionExpiration: {
          NoncurrentDays: 365 // Delete old versions after 1 year
        }
      }
    ];

    const command = new PutBucketLifecycleConfigurationCommand({
      Bucket: S3_BUCKET,
      LifecycleConfiguration: {
        Rules: lifecycleRules
      }
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error('Failed to apply lifecycle configuration:', error);
    return false;
  }
}

/**
 * Calculate potential cost savings from lifecycle policies
 */
export async function calculateLifecycleSavings(tenantId: string): Promise<{
  currentMonthlyCost: number;
  optimizedMonthlyCost: number;
  monthlySavings: number;
  savingsPercentage: number;
  breakdown: Array<{
    storageClass: string;
    fileSizeGB: number;
    currentCost: number;
    optimizedCost: number;
    savings: number;
  }>;
}> {
  try {
    // Get file access patterns for the tenant
    const accessPatterns = await pool.query(`
      SELECT 
        file_id,
        file_path,
        avg_file_size,
        last_accessed,
        total_accesses,
        recommended_storage_class
      FROM file_access_patterns
      WHERE tenant_id = $1
    `, [tenantId]);

    let currentMonthlyCost = 0;
    let optimizedMonthlyCost = 0;
    const breakdown: Array<{
      storageClass: string;
      fileSizeGB: number;
      currentCost: number;
      optimizedCost: number;
      savings: number;
    }> = [];

    for (const file of accessPatterns.rows) {
      const fileSizeGB = (file.avg_file_size || 0) / (1024 * 1024 * 1024);
      const currentStorageClass = 'STANDARD'; // Assume current is Standard
      const recommendedStorageClass = file.recommended_storage_class || 'STANDARD';

      const currentCost = fileSizeGB * STORAGE_CLASSES[currentStorageClass].costPerGB;
      const optimizedCost = fileSizeGB * STORAGE_CLASSES[recommendedStorageClass].costPerGB;
      const savings = currentCost - optimizedCost;

      currentMonthlyCost += currentCost;
      optimizedMonthlyCost += optimizedCost;

      breakdown.push({
        storageClass: recommendedStorageClass,
        fileSizeGB,
        currentCost,
        optimizedCost,
        savings
      });
    }

    const monthlySavings = currentMonthlyCost - optimizedMonthlyCost;
    const savingsPercentage = currentMonthlyCost > 0 ? (monthlySavings / currentMonthlyCost) * 100 : 0;

    return {
      currentMonthlyCost,
      optimizedMonthlyCost,
      monthlySavings,
      savingsPercentage,
      breakdown
    };
  } catch (error) {
    console.error('Failed to calculate lifecycle savings:', error);
    return {
      currentMonthlyCost: 0,
      optimizedMonthlyCost: 0,
      monthlySavings: 0,
      savingsPercentage: 0,
      breakdown: []
    };
  }
}

/**
 * Monitor lifecycle transitions
 */
export async function monitorLifecycleTransitions(tenantId: string): Promise<Array<{
  fileId: string;
  filePath: string;
  currentStorageClass: string;
  transitionDate: Date;
  nextStorageClass: string;
  daysUntilTransition: number;
  estimatedSavings: number;
}>> {
  try {
    const result = await pool.query(`
      SELECT 
        file_id,
        file_path,
        last_accessed,
        recommended_storage_class,
        avg_file_size
      FROM file_access_patterns
      WHERE tenant_id = $1
        AND last_accessed IS NOT NULL
      ORDER BY last_accessed DESC
    `, [tenantId]);

    const transitions = [];
    const now = new Date();

    for (const file of result.rows) {
      const lastAccessed = new Date(file.last_accessed);
      const daysSinceAccess = Math.floor((now.getTime() - lastAccessed.getTime()) / (1000 * 60 * 60 * 24));
      
      let nextStorageClass = 'STANDARD';
      let daysUntilTransition = 0;
      let transitionDate = new Date();

      if (daysSinceAccess < 30) {
        nextStorageClass = 'STANDARD_IA';
        daysUntilTransition = 30 - daysSinceAccess;
        transitionDate = new Date(lastAccessed.getTime() + (30 * 24 * 60 * 60 * 1000));
      } else if (daysSinceAccess < 90) {
        nextStorageClass = 'GLACIER';
        daysUntilTransition = 90 - daysSinceAccess;
        transitionDate = new Date(lastAccessed.getTime() + (90 * 24 * 60 * 60 * 1000));
      } else if (daysSinceAccess < 180) {
        nextStorageClass = 'DEEP_ARCHIVE';
        daysUntilTransition = 180 - daysSinceAccess;
        transitionDate = new Date(lastAccessed.getTime() + (180 * 24 * 60 * 60 * 1000));
      }

      const fileSizeGB = (file.avg_file_size || 0) / (1024 * 1024 * 1024);
      const currentCost = fileSizeGB * STORAGE_CLASSES.STANDARD.costPerGB;
      const newCost = fileSizeGB * STORAGE_CLASSES[nextStorageClass].costPerGB;
      const estimatedSavings = currentCost - newCost;

      if (nextStorageClass !== 'STANDARD') {
        transitions.push({
          fileId: file.file_id,
          filePath: file.file_path,
          currentStorageClass: 'STANDARD',
          transitionDate,
          nextStorageClass,
          daysUntilTransition,
          estimatedSavings
        });
      }
    }

    return transitions;
  } catch (error) {
    console.error('Failed to monitor lifecycle transitions:', error);
    return [];
  }
}

/**
 * Get lifecycle policy status
 */
export async function getLifecyclePolicyStatus(): Promise<{
  isConfigured: boolean;
  rules: LifecycleRule[];
  lastUpdated?: Date;
  totalRules: number;
  activeRules: number;
}> {
  try {
    const rules = await getCurrentLifecycleConfiguration();
    const activeRules = rules.filter(rule => rule.status === 'Enabled').length;

    return {
      isConfigured: rules.length > 0,
      rules,
      totalRules: rules.length,
      activeRules,
      lastUpdated: new Date() // Would be actual last modified date in production
    };
  } catch (error) {
    console.error('Failed to get lifecycle policy status:', error);
    return {
      isConfigured: false,
      rules: [],
      totalRules: 0,
      activeRules: 0
    };
  }
}

/**
 * Validate lifecycle configuration
 */
export async function validateLifecycleConfiguration(): Promise<{
  isValid: boolean;
  issues: string[];
  recommendations: string[];
}> {
  try {
    const rules = await getCurrentLifecycleConfiguration();
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (rules.length === 0) {
      issues.push('No lifecycle rules configured');
      recommendations.push('Configure lifecycle rules for cost optimization');
    }

    const hasIntelligentTiering = rules.some(rule => 
      rule.transitions?.some(t => t.storageClass === 'INTELLIGENT_TIERING')
    );

    if (!hasIntelligentTiering) {
      recommendations.push('Consider adding Intelligent-Tiering for automatic optimization');
    }

    const hasMultipartCleanup = rules.some(rule => rule.abortIncompleteMultipartUpload);
    if (!hasMultipartCleanup) {
      issues.push('No multipart upload cleanup configured');
      recommendations.push('Add multipart upload cleanup to prevent storage waste');
    }

    const hasVersionCleanup = rules.some(rule => rule.noncurrentVersionExpiration);
    if (!hasVersionCleanup) {
      recommendations.push('Consider adding old version cleanup for cost savings');
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    };
  } catch (error) {
    console.error('Failed to validate lifecycle configuration:', error);
    return {
      isValid: false,
      issues: ['Failed to validate configuration'],
      recommendations: []
    };
  }
}

export default {
  getCurrentLifecycleConfiguration,
  applyLifecycleConfiguration,
  calculateLifecycleSavings,
  monitorLifecycleTransitions,
  getLifecyclePolicyStatus,
  validateLifecycleConfiguration,
  STORAGE_CLASSES
};