const axios = require('axios')

const API_URL = 'http://localhost:3000'

async function signin(email, password) {
  const res = await axios.post(`${API_URL}/auth/signin`, { email, password }, {
    headers: {
      Origin: 'http://localhost:3002',
      'X-App-ID': 'admin-dashboard',
      'X-API-Key': 'admin-dev-key-456'
    }
  })
  return res.data.AccessToken ? res.data : res.data
}

async function run() {
  console.log('🎯 Targeted RBAC Tests')

  // Sign in as system admin
  console.log('\n🔐 Signing in as system-admin...')
  const sys = await signin('mdwasimakram44@gmail.com', 'Advanture101$')
  const sysToken = sys.AccessToken
  console.log(`   AccessToken: ${sysToken ? 'RECEIVED' : 'MISSING'}`)
  const sysPayload = JSON.parse(Buffer.from(sysToken.split('.')[1], 'base64').toString('utf-8'))
  console.log(`   Groups: ${(sysPayload['cognito:groups'] || []).join(', ')}`)

  // Sign in as hospital admin
  console.log('\n🔐 Signing in as hospital-admin...')
  const hosp = await signin('mdwasimkrm13@gmail.com', 'Advanture101$')
  const hospToken = hosp.AccessToken
  console.log(`   AccessToken: ${hospToken ? 'RECEIVED' : 'MISSING'}`)
  const hospPayload = JSON.parse(Buffer.from(hospToken.split('.')[1], 'base64').toString('utf-8'))
  console.log(`   Groups: ${(hospPayload['cognito:groups'] || []).join(', ')}`)

  // Helper to call endpoints
  const call = async (method, url, token, headers = {}, data) => {
    try {
      const res = await axios({
        method,
        url: `${API_URL}${url}`,
        headers: {
          Authorization: `Bearer ${token}`,
          Origin: headers.Origin || 'http://localhost:3002',
          'X-App-ID': headers['X-App-ID'] || 'admin-dashboard',
          'X-API-Key': headers['X-API-Key'] || 'admin-dev-key-456',
          ...(headers['X-Tenant-ID'] ? { 'X-Tenant-ID': headers['X-Tenant-ID'] } : {})
        },
        data
      })
      return { status: res.status, data: res.data }
    } catch (e) {
      return { status: e.response?.status || 0, data: e.response?.data || e.message }
    }
  }

  // Test 1: system-admin should access /api/users (admin-only)
  console.log('\n📌 Test 1: system-admin GET /api/users')
  const t1 = await call('get', '/api/users', sysToken)
  console.log(`   Status: ${t1.status} (expected 200)`)

  // Test 2: hospital-admin should be forbidden on /api/users
  console.log('\n📌 Test 2: hospital-admin GET /api/users')
  const t2 = await call('get', '/api/users', hospToken)
  const hospHasAdmin = (hospPayload['cognito:groups'] || []).some(g => g === 'admin' || g === 'system-admin')
  console.log(`   Status: ${t2.status} (expected ${hospHasAdmin ? 200 : 403})`) 

  // Test 3: system-admin can call /api/admin/groups/assign
  console.log('\n📌 Test 3: system-admin POST /api/admin/groups/assign')
  const t3 = await call('post', '/api/admin/groups/assign', sysToken, {}, { email: 'mdwasimkrm13@gmail.com', group: 'hospital-admin' })
  console.log(`   Status: ${t3.status} (expected 200)`) 

  // Test 4: hospital-admin forbidden on /api/admin/groups/assign
  console.log('\n📌 Test 4: hospital-admin POST /api/admin/groups/assign')
  const t4 = await call('post', '/api/admin/groups/assign', hospToken, {}, { email: 'mdwasimakram44@gmail.com', group: 'system-admin' })
  console.log(`   Status: ${t4.status} (expected ${hospHasAdmin ? 200 : 403})`) 

  console.log('\n✅ RBAC summary:')
  console.log(`   sys → /api/users: ${t1.status}`)
  console.log(`   hosp → /api/users: ${t2.status}`)
  console.log(`   sys → /api/admin/groups/assign: ${t3.status}`)
  console.log(`   hosp → /api/admin/groups/assign: ${t4.status}`)
}

run().catch(err => { console.error('❌ RBAC test failure:', err); process.exit(1) })
