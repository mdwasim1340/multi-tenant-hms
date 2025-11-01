require('dotenv').config();
const { CognitoIdentityProviderClient, DescribeUserPoolCommand, DescribeUserPoolClientCommand } = require('@aws-sdk/client-cognito-identity-provider');

async function diagnoseCognito() {
  console.log('🔍 Cognito Configuration Diagnosis\n');
  
  console.log('Environment Variables:');
  console.log('- COGNITO_USER_POOL_ID:', process.env.COGNITO_USER_POOL_ID);
  console.log('- COGNITO_CLIENT_ID:', process.env.COGNITO_CLIENT_ID);
  console.log('- COGNITO_SECRET:', process.env.COGNITO_SECRET ? 'SET' : 'NOT SET');
  console.log('- AWS_REGION:', process.env.AWS_REGION);
  console.log('- AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'SET' : 'NOT SET');
  console.log('- AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'SET' : 'NOT SET');
  
  const cognitoClient = new CognitoIdentityProviderClient({
    region: process.env.AWS_REGION,
  });
  
  try {
    console.log('\n🔍 Checking User Pool...');
    const userPoolCommand = new DescribeUserPoolCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID
    });
    
    const userPoolResponse = await cognitoClient.send(userPoolCommand);
    console.log('✅ User Pool found:', userPoolResponse.UserPool.Name);
    console.log('- Status:', userPoolResponse.UserPool.Status);
    console.log('- Creation Date:', userPoolResponse.UserPool.CreationDate);
    
    // Check password policy
    if (userPoolResponse.UserPool.Policies?.PasswordPolicy) {
      const policy = userPoolResponse.UserPool.Policies.PasswordPolicy;
      console.log('- Password Policy:');
      console.log('  * Min Length:', policy.MinimumLength);
      console.log('  * Require Uppercase:', policy.RequireUppercase);
      console.log('  * Require Lowercase:', policy.RequireLowercase);
      console.log('  * Require Numbers:', policy.RequireNumbers);
      console.log('  * Require Symbols:', policy.RequireSymbols);
    }
    
  } catch (error) {
    console.error('❌ User Pool Error:', error.message);
    return;
  }
  
  try {
    console.log('\n🔍 Checking User Pool Client...');
    const clientCommand = new DescribeUserPoolClientCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      ClientId: process.env.COGNITO_CLIENT_ID
    });
    
    const clientResponse = await cognitoClient.send(clientCommand);
    console.log('✅ Client found:', clientResponse.UserPoolClient.ClientName);
    console.log('- Generate Secret:', clientResponse.UserPoolClient.GenerateSecret);
    console.log('- Explicit Auth Flows:', clientResponse.UserPoolClient.ExplicitAuthFlows);
    console.log('- Supported Identity Providers:', clientResponse.UserPoolClient.SupportedIdentityProviders);
    
  } catch (error) {
    console.error('❌ Client Error:', error.message);
  }
}

diagnoseCognito().catch(console.error);