const jwt = require('jsonwebtoken')
const fetch = require('node-fetch')

async function main() {
  const token = jwt.sign({
    sub: 'test-user',
    email: 'user@hospital.com',
    'cognito:groups': ['hospital-admin'],
    exp: Math.floor(Date.now()/1000)+3600,
  }, 'test-secret-key')

  const base = 'http://localhost:3000'
  const adminHeaders = {
    Authorization: 'Bearer ' + token,
    'X-App-ID': 'hospital-management',
    'X-API-Key': 'hospital-dev-key-123',
    Origin: 'http://localhost:3001',
    'X-Tenant-ID': 'aajmin_polyclinic',
  }
  const patients = await fetch(base + '/api/patients', { headers: adminHeaders })
  console.log('Patients status:', patients.status)

  const roles = await fetch(base + '/api/roles', { headers: adminHeaders })
  console.log('Roles status:', roles.status)
}

main().catch(e => { console.error(e); process.exit(1) })
