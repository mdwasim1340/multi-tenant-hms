const fetch = require('node-fetch')

async function main() {
  const base = 'http://localhost:3000'
  const signin = await fetch(base + '/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'mdwasimkrm13@gmail.com', password: 'Advanture101$' }),
  }).then(r => r.json())
  const token = signin.AccessToken
  const headers = {
    Authorization: 'Bearer ' + token,
    'X-App-ID': 'admin-dashboard',
    'X-API-Key': 'admin-dev-key-456',
    Origin: 'http://localhost:3002',
  }
  const tenantId = 'aajmin_polyclinic'
  const init = await fetch(base + `/api/tenants/${tenantId}/init-schema`, { method: 'POST', headers })
  const result = await init.json()
  console.log(JSON.stringify(result, null, 2))
}

main().catch(e => { console.error(e); process.exit(1) })
