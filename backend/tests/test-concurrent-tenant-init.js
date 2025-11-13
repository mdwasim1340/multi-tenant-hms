const fetch = require('node-fetch')

async function signin() {
  const base = 'http://localhost:3000'
  const res = await fetch(base + '/auth/signin', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'mdwasimkrm13@gmail.com', password: 'Advanture101$' }),
  })
  return res.json()
}

async function createTenant(token, id) {
  const base = 'http://localhost:3000'
  const headers = {
    Authorization: 'Bearer ' + token,
    'X-App-ID': 'admin-dashboard', 'X-API-Key': 'admin-dev-key-456', Origin: 'http://localhost:3002'
  }
  await fetch(base + '/api/tenants', {
    method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, name: id, email: 'test@' + id + '.com', status: 'active', plan: 'standard' })
  })
}

async function initTenant(token, id) {
  const base = 'http://localhost:3000'
  const headers = {
    Authorization: 'Bearer ' + token,
    'X-App-ID': 'admin-dashboard', 'X-API-Key': 'admin-dev-key-456', Origin: 'http://localhost:3002'
  }
  const res = await fetch(base + `/api/tenants/${id}/init-schema`, { method: 'POST', headers })
  return res.json()
}

async function main() {
  const auth = await signin()
  const token = auth.AccessToken
  const ids = Array.from({ length: 5 }).map((_, i) => `tenant_perf_${String(i+1).padStart(3,'0')}`)
  await Promise.all(ids.map(id => createTenant(token, id)))
  const start = Date.now()
  const results = await Promise.all(ids.map(id => initTenant(token, id)))
  const ms = Date.now() - start
  console.log('Provisioned', ids.length, 'tenants in', ms, 'ms')
  console.log(JSON.stringify(results, null, 2))
}

main().catch(e => { console.error(e); process.exit(1) })
