# Development Mode Quick Reference

## Easy Mode Switching

### Check Current Mode
```powershell
cd hospital-management-system
.\check-mode.ps1
```

### Switch to Development Mode (Local Backend)
```powershell
cd hospital-management-system
.\switch-to-dev.ps1
```
**Use this when:**
- Testing new features (like Team Gamma billing)
- Working on local development
- Backend code is on development branch

### Switch to Production Mode (Remote Backend)
```powershell
cd hospital-management-system
.\switch-to-prod.ps1
```
**Use this when:**
- Testing against production API
- Verifying deployed features
- No local backend needed

## Quick Start for Development

```powershell
# 1. Ensure you're on development branch
git checkout development

# 2. Switch frontend to development mode
cd hospital-management-system
.\switch-to-dev.ps1

# 3. Start backend (new terminal)
cd backend
npm run dev

# 4. Start frontend (new terminal)
cd hospital-management-system
npm run dev

# 5. Access application
# Frontend: http://localhost:3001
# Backend: http://localhost:3000
```

## Current Status

✅ **Team Gamma merged into development branch**
✅ **Frontend configured for development mode**
✅ **Easy mode switching scripts created**

## What's Different Between Modes?

| Aspect | Development Mode | Production Mode |
|--------|-----------------|-----------------|
| Backend URL | `http://localhost:3000` | `https://backend.aajminpolyclinic.com.np` |
| Backend Required | ✅ Yes (must run locally) | ❌ No (uses remote) |
| New Features | ✅ Available immediately | ❌ Only after deployment |
| Team Gamma Features | ✅ Available now | ❌ Not yet deployed |
| Database | Local/Dev database | Production database |

## Troubleshooting

### 404 Errors on Billing Features
**Problem:** Frontend shows 404 for `/api/billing/reports/*` or `/api/balance-reports/*`

**Solution:**
```powershell
# 1. Check mode
cd hospital-management-system
.\check-mode.ps1

# 2. If in production mode, switch to development
.\switch-to-dev.ps1

# 3. Ensure backend is running
cd ..\backend
npm run dev

# 4. Restart frontend
cd ..\hospital-management-system
# Press Ctrl+C to stop
npm run dev
```

### Backend Connection Refused
**Problem:** Frontend can't connect to backend

**Solution:**
```powershell
# Make sure backend is running
cd backend
npm run dev
```

### Changes Not Taking Effect
**Problem:** Switched modes but still seeing old behavior

**Solution:**
```powershell
# Always restart frontend after switching modes
# Press Ctrl+C in frontend terminal
npm run dev
```

## Files Modified by Scripts

The mode switching scripts only modify:
- `hospital-management-system/.env.local`

They toggle between:
```env
# Development
NEXT_PUBLIC_API_URL=http://localhost:3000

# Production  
NEXT_PUBLIC_API_URL=https://backend.aajminpolyclinic.com.np
```

## See Also

- Full guide: `hospital-management-system/MODE_SWITCHING_GUIDE.md`
- Deployment guide: `.kiro/steering/deployment-guide.md`
- Quick start: `.kiro/steering/00-QUICK-START.md`
