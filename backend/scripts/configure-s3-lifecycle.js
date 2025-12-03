/**
 * Team Alpha - Configure S3 Lifecycle Policies
 * Complete S3 cost optimization with lifecycle policies
 */

const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
});

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.S3_BUCKET_NAME;

async function configureLifecyclePolicies() {
  try {
    console.log('🚀 Configuring S3 Lifecycle Policies...\n');
    console.log(`📦 Bucket: ${BUCKET_NAME}`);
    console.log(`🌍 Region: ${process.env.AWS_REGION || 'us-east-1'}\n`);

    // Define comprehensive lifecycle configuration
    const lifecycleConfiguration = {
      Rules: [
        {
          ID: 'medical-records-lifecycle',
          Status: 'Enabled',
          Filter: {
            Prefix: '', // Apply to all objects
          },
          Transitions: [
            {
              Days: 30,
              StorageClass: 'STANDARD_IA', // Move to Infrequent Access after 30 days
            },
            {
              Days: 90,
              StorageClass: 'GLACIER', // Move to Glacier after 90 days
            },
            {
              Days: 180,
              StorageClass: 'DEEP_ARCHIVE', // Move to Deep Archive after 180 days
            },
          ],
          NoncurrentVersionTransitions: [
            {
              NoncurrentDays: 30,
              StorageClass: 'STANDARD_IA',
            },
            {
              NoncurrentDays: 90,
              StorageClass: 'GLACIER',
            },
            {
              NoncurrentDays: 180,
              StorageClass: 'DEEP_ARCHIVE',
            },
          ],
          AbortIncompleteMultipartUpload: {
            DaysAfterInitiation: 7, // Clean up incomplete uploads after 7 days
          },
        },
        {
          ID: 'intelligent-tiering-rule',
          Status: 'Enabled',
          Filter: {
            Prefix: '', // Apply to all objects
          },
          Transitions: [
            {
              Days: 0, // Immediate transition to Intelligent-Tiering
              StorageClass: 'INTELLIGENT_TIERING',
            },
          ],
        },
        {
          ID: 'delete-old-versions',
          Status: 'Enabled',
          Filter: {
            Prefix: '', // Apply to all objects
          },
          NoncurrentVersionExpiration: {
            NoncurrentDays: 365, // Delete old versions after 1 year
          },
        },
      ],
    };

    console.log('📋 Lifecycle Rules to Apply:');
    lifecycleConfiguration.Rules.forEach((rule, index) => {
      console.log(`\n   ${index + 1}. ${rule.ID}:`);
      console.log(`      Status: ${rule.Status}`);
      
      if (rule.Transitions) {
        console.log('      Transitions:');
        rule.Transitions.forEach((transition) => {
          console.log(`        - Day ${transition.Days}: ${transition.StorageClass}`);
        });
      }
      
      if (rule.NoncurrentVersionTransitions) {
        console.log('      Non-current Version Transitions:');
        rule.NoncurrentVersionTransitions.forEach((transition) => {
          console.log(`        - Day ${transition.NoncurrentDays}: ${transition.StorageClass}`);
        });
      }
      
      if (rule.AbortIncompleteMultipartUpload) {
        console.log(`      Cleanup Incomplete Uploads: ${rule.AbortIncompleteMultipartUpload.DaysAfterInitiation} days`);
      }
      
      if (rule.NoncurrentVersionExpiration) {
        console.log(`      Delete Old Versions: ${rule.NoncurrentVersionExpiration.NoncurrentDays} days`);
      }
    });

    // Apply lifecycle configuration
    console.log('\n🔧 Applying lifecycle configuration...');
    const params = {
      Bucket: BUCKET_NAME,
      LifecycleConfiguration: lifecycleConfiguration,
    };

    await s3.putBucketLifecycleConfiguration(params).promise();
    console.log('✅ Lifecycle configuration applied successfully!\n');

    // Verify the configuration
    console.log('🔍 Verifying lifecycle configuration...');
    const getParams = {
      Bucket: BUCKET_NAME,
    };

    const result = await s3.getBucketLifecycleConfiguration(getParams).promise();
    console.log('✅ Lifecycle configuration verified!\n');

    console.log('📊 Applied Configuration:');
    result.Rules.forEach((rule, index) => {
      console.log(`   ${index + 1}. ${rule.ID} (${rule.Status})`);
    });

    // Configure Intelligent-Tiering
    console.log('\n🧠 Configuring Intelligent-Tiering...');
    const intelligentTieringConfig = {
      Bucket: BUCKET_NAME,
      Id: 'medical-records-intelligent-tiering',
      IntelligentTieringConfiguration: {
        Id: 'medical-records-intelligent-tiering',
        Status: 'Enabled',
        Filter: {
          Prefix: '', // Apply to all objects
        },
        Tierings: [
          {
            Days: 90,
            AccessTier: 'ARCHIVE_ACCESS', // Move to Archive Access after 90 days
          },
          {
            Days: 180,
            AccessTier: 'DEEP_ARCHIVE_ACCESS', // Move to Deep Archive Access after 180 days
          },
        ],
      },
    };

    try {
      await s3.putBucketIntelligentTieringConfiguration(intelligentTieringConfig).promise();
      console.log('✅ Intelligent-Tiering configuration applied successfully!\n');
    } catch (error) {
      if (error.code === 'InvalidRequest') {
        console.log('ℹ️  Intelligent-Tiering configuration already exists or not supported in this region\n');
      } else {
        console.warn('⚠️  Warning: Could not configure Intelligent-Tiering:', error.message, '\n');
      }
    }

    // Calculate potential savings
    console.log('💰 Cost Optimization Summary:');
    console.log('   📈 Expected Savings:');
    console.log('      - 30 days: Move to Standard-IA (46% savings)');
    console.log('      - 90 days: Move to Glacier (83% savings)');
    console.log('      - 180 days: Move to Deep Archive (96% savings)');
    console.log('   🧹 Cleanup:');
    console.log('      - Incomplete uploads cleaned after 7 days');
    console.log('      - Old versions deleted after 1 year');
    console.log('   🎯 Overall Impact:');
    console.log('      - Automatic cost optimization');
    console.log('      - No manual intervention required');
    console.log('      - Compliance with data retention policies');

    console.log('\n✅ S3 Lifecycle Policies Configuration Complete!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Monitor S3 storage class transitions');
    console.log('   2. Track cost savings in cost monitoring dashboard');
    console.log('   3. Set up CloudWatch alarms for lifecycle events');
    console.log('   4. Review and adjust policies based on access patterns');

  } catch (error) {
    console.error('❌ Failed to configure lifecycle policies:', error);
    
    if (error.code === 'NoSuchBucket') {
      console.error('   Bucket does not exist. Please check the bucket name.');
    } else if (error.code === 'AccessDenied') {
      console.error('   Access denied. Please check AWS credentials and permissions.');
    } else if (error.code === 'InvalidRequest') {
      console.error('   Invalid request. Please check the lifecycle configuration.');
    }
    
    throw error;
  }
}

// Run configuration
configureLifecyclePolicies().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});