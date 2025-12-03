/**
 * Configure S3 CORS for file uploads from frontend
 * Run: node scripts/configure-s3-cors.js
 */

const { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'multi-tenant-12';

const corsConfiguration = {
  CORSRules: [
    {
      AllowedHeaders: ['*'],
      AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
      AllowedOrigins: [
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:3003',
        'http://10.66.66.8:3001',
        'http://10.66.66.8:3002',
        'https://aajminpolyclinic.com.np',
        'https://www.aajminpolyclinic.com.np',
        'https://*.aajminpolyclinic.com.np',
      ],
      ExposeHeaders: ['ETag', 'x-amz-meta-custom-header'],
      MaxAgeSeconds: 3600,
    },
  ],
};

async function configureCors() {
  console.log(`\n🔧 Configuring CORS for S3 bucket: ${BUCKET_NAME}\n`);

  try {
    // Check current CORS configuration
    try {
      const currentCors = await s3Client.send(
        new GetBucketCorsCommand({ Bucket: BUCKET_NAME })
      );
      console.log('📋 Current CORS configuration:');
      console.log(JSON.stringify(currentCors.CORSRules, null, 2));
    } catch (e) {
      console.log('ℹ️  No existing CORS configuration found');
    }

    // Apply new CORS configuration
    console.log('\n📤 Applying new CORS configuration...');
    await s3Client.send(
      new PutBucketCorsCommand({
        Bucket: BUCKET_NAME,
        CORSConfiguration: corsConfiguration,
      })
    );

    console.log('✅ CORS configuration applied successfully!\n');
    console.log('Allowed origins:');
    corsConfiguration.CORSRules[0].AllowedOrigins.forEach((origin) => {
      console.log(`  - ${origin}`);
    });

  } catch (error) {
    console.error('❌ Failed to configure CORS:', error.message);
    console.log('\n💡 Make sure you have the following permissions:');
    console.log('  - s3:GetBucketCors');
    console.log('  - s3:PutBucketCors');
    console.log('\nOr configure CORS manually in AWS Console:');
    console.log('1. Go to S3 > Your Bucket > Permissions > CORS');
    console.log('2. Add the following configuration:');
    console.log(JSON.stringify(corsConfiguration.CORSRules, null, 2));
  }
}

configureCors();
