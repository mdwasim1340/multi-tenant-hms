# n8n Integration - Command Reference

## 🚀 Start Services

```bash
# Backend (Terminal 1)
cd backend
npm run dev

# Frontend (Terminal 2)
cd hospital-management-system
npm run dev
```

## 🧪 Testing

```bash
# Run full test suite
cd backend
node tests/test-n8n-integration.js

# Check configuration
curl http://localhost:3000/api/n8n/status

# Test chat endpoint
curl -X POST http://localhost:3000/api/n8n/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","sessionId":"test_123","department":"opd"}'
```

## 🔍 Diagnostics

```bash
# Backend health
curl http://localhost:3000/health

# Check environment variables
cd backend
grep N8N .env

# TypeScript check
cd backend
npx tsc --noEmit
```

## 📚 Documentation

```bash
# Quick start
cat QUICK_START_N8N.md

# Setup guide
cat backend/docs/N8N_SETUP_GUIDE.md

# Troubleshooting
cat backend/docs/N8N_TROUBLESHOOTING.md

# Complete summary
cat N8N_INTEGRATION_COMPLETE.md
```

## 🌐 URLs

- **Frontend**: http://localhost:3001
- **Backend**: http://localhost:3000
- **n8n Instance**: https://n8n.aajminpolyclinic.com.np
- **Health Check**: http://localhost:3000/health
- **n8n Status**: http://localhost:3000/api/n8n/status

## 🤖 Test Each Agent

```bash
# OPD Agent
curl -X POST http://localhost:3000/api/n8n/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What are diabetes symptoms?","sessionId":"test_opd","department":"opd"}'

# Ward Agent
curl -X POST http://localhost:3000/api/n8n/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"How to discharge a patient?","sessionId":"test_ward","department":"ward"}'

# Emergency Agent
curl -X POST http://localhost:3000/api/n8n/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Cardiac arrest protocol?","sessionId":"test_emerg","department":"emergency"}'

# General Query
curl -X POST http://localhost:3000/api/n8n/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Visiting hours?","sessionId":"test_gen","department":"general"}'
```

## 🛠️ Troubleshooting

```bash
# Kill process on port 3000 (if needed)
netstat -ano | findstr :3000
taskkill /PID <process_id> /F

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
cd backend
rm -rf node_modules package-lock.json
npm install
```

## 📝 Environment Variables

```bash
# View n8n configuration
cd backend
cat .env | grep N8N

# Required variables:
# N8N_BASE_URL=https://n8n.aajminpolyclinic.com.np
# N8N_WEBHOOK_AUTH_HEADER=cdss
# N8N_WEBHOOK_AUTH_TOKEN=Aspiration101$
# N8N_OPD_AGENT_PATH=2e2eee42-37e5-4e90-a4e3-ee1600dc1651
# N8N_WARD_AGENT_PATH=8d802b42-056f-44e5-bda3-312ac1129b72
# N8N_EMERGENCY_AGENT_PATH=970ce145-c94c-4556-b50e-0f11e02492b7
```

## 🎯 Quick Verification

```bash
# 1. Backend running?
curl http://localhost:3000/health

# 2. n8n configured?
curl http://localhost:3000/api/n8n/status

# 3. All tests pass?
cd backend && node tests/test-n8n-integration.js

# 4. Frontend accessible?
# Open: http://localhost:3001
```

---

**Quick Reference**: Keep this handy for daily use!
