#!/bin/bash
echo "=== Testing DB Connection ==="
cd ~/backend
node -e "
const { Pool } = require('pg');
require('dotenv').config();
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
});
pool.query('SELECT * FROM public.users LIMIT 1').then(r => {
  console.log('SUCCESS - Found user:', r.rows[0]?.email);
  process.exit(0);
}).catch(e => {
  console.log('ERROR:', e.message);
  process.exit(1);
});
"
