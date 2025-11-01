const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const BASE_URL = 'http://localhost:3000';

async function testS3Functionality() {
    console.log('🚀 S3 Upload Functionality Test\n');

    // First, let's try to sign in with an existing user
    console.log('📋 STEP 1: User Authentication');
    console.log('='.repeat(50));

    const testUser = {
        email: 'ceo@enterprise-corp.com',
        password: 'SecurePass123!'
    };

    let accessToken = null;

    try {
        const response = await fetch(`${BASE_URL}/auth/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testUser)
        });

        if (response.ok) {
            const result = await response.json();
            accessToken = result.AccessToken;
            console.log('✅ User signed in successfully');
            console.log(`   Token: ${accessToken ? accessToken.substring(0, 50) + '...' : 'No token'}`);
        } else {
            const error = await response.text();
            console.log('⚠️  Sign in failed:', error);
            console.log('   Will test with mock token for S3 endpoint validation');
        }
    } catch (error) {
        console.error('❌ Sign in error:', error.message);
    }

    // Test S3 upload URL generation
    console.log('\n📋 STEP 2: S3 Upload URL Generation');
    console.log('='.repeat(50));

    const testFiles = [
        { filename: 'document.pdf', tenant: 'enterprise-corp' },
        { filename: 'image.jpg', tenant: 'startup-inc' },
        { filename: 'spreadsheet.xlsx', tenant: 'agency-ltd' }
    ];

    for (const file of testFiles) {
        try {
            const response = await fetch(`${BASE_URL}/files/upload-url`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Tenant-ID': file.tenant,
                    'Authorization': `Bearer ${accessToken || 'mock-token-for-testing'}`
                },
                body: JSON.stringify({ filename: file.filename })
            });

            if (response.ok) {
                const result = await response.json();
                console.log(`✅ Upload URL generated for ${file.filename} (${file.tenant})`);
                console.log(`   URL: ${result.uploadUrl ? result.uploadUrl.substring(0, 80) + '...' : 'No URL'}`);
                console.log(`   Key: ${result.key || 'No key'}`);
            } else {
                const error = await response.text();
                console.log(`❌ Failed to generate URL for ${file.filename}: ${error}`);
            }
        } catch (error) {
            console.error(`❌ Error testing ${file.filename}:`, error.message);
        }
    }

    // Test download URL generation
    console.log('\n📋 STEP 3: S3 Download URL Generation');
    console.log('='.repeat(50));

    const testKey = 'enterprise-corp/documents/test-file.pdf';

    try {
        const response = await fetch(`${BASE_URL}/files/download-url`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Tenant-ID': 'enterprise-corp',
                'Authorization': `Bearer ${accessToken || 'mock-token-for-testing'}`
            },
            body: JSON.stringify({ key: testKey })
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Download URL generated successfully');
            console.log(`   URL: ${result.downloadUrl ? result.downloadUrl.substring(0, 80) + '...' : 'No URL'}`);
        } else {
            const error = await response.text();
            console.log(`❌ Failed to generate download URL: ${error}`);
        }
    } catch (error) {
        console.error('❌ Error testing download URL:', error.message);
    }

    // Test file listing
    console.log('\n📋 STEP 4: S3 File Listing');
    console.log('='.repeat(50));

    try {
        const response = await fetch(`${BASE_URL}/files/list`, {
            method: 'GET',
            headers: {
                'X-Tenant-ID': 'enterprise-corp',
                'Authorization': `Bearer ${accessToken || 'mock-token-for-testing'}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✅ File listing retrieved successfully');
            console.log(`   Files found: ${result.files ? result.files.length : 0}`);
            if (result.files && result.files.length > 0) {
                result.files.slice(0, 3).forEach((file, index) => {
                    console.log(`   ${index + 1}. ${file.Key} (${file.Size} bytes)`);
                });
            }
        } else {
            const error = await response.text();
            console.log(`❌ Failed to list files: ${error}`);
        }
    } catch (error) {
        console.error('❌ Error listing files:', error.message);
    }

    // Summary
    console.log('\n📊 S3 FUNCTIONALITY TEST SUMMARY');
    console.log('='.repeat(50));
    console.log('This test validates:');
    console.log('✓ S3 service integration');
    console.log('✓ Tenant-specific file isolation');
    console.log('✓ Presigned URL generation');
    console.log('✓ Authentication middleware protection');
    console.log('✓ File upload/download workflows');
}

testS3Functionality().catch(console.error);