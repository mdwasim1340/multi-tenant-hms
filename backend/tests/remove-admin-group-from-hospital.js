require('dotenv').config()
const { CognitoIdentityProviderClient, AdminRemoveUserFromGroupCommand } = require('@aws-sdk/client-cognito-identity-provider')

const client = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION })

async function run() {
  const email = 'mdwasimkrm13@gmail.com'
  const group = 'admin'
  const username = email.replace('@', '_').replace(/\./g, '_')
  const cmd = new AdminRemoveUserFromGroupCommand({
    UserPoolId: process.env.COGNITO_USER_POOL_ID,
    Username: username,
    GroupName: group,
  })
  try {
    await client.send(cmd)
    console.log(`✅ Removed user ${email} from group '${group}'`)
  } catch (e) {
    console.error('❌ Failed to remove group:', e.message)
    process.exit(1)
  }
}

run()
