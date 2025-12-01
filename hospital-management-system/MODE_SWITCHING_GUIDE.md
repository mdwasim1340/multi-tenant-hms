# Development/Production Mode Switching Guide

## Quick Commands

### Check Current Mode
```powershell
.\check-mode.ps1
```

### Switch to Development Mode
```powershell
.\switch-to-dev.ps1
```
- Uses local backend: `http://localhost:3000`
- Perfect for testing new features (like Team Gamma billing)
- Requires local backend server running

### Switch to Production Mode
```powershell
.\switch-to-prod.ps1
```
- Uses production backend: `https://backend.aajminpolyclinic.com.np`
- For testing against live production API
- Production backend must be deployed with latest code

## Typical Workflow

### Working on New Features (Development Mode)
```powershell
# 1. Switch to development mode
.\switch-to-dev.ps1

# 2. Start local backend (in separate terminal)
cd ..\backend
npm run dev

# 3. Start frontend
npm run dev

# 4. Access at http://localhost:3001
```

### Testing Production API (Production Mode)
```powershell
# 1. Switch to production mode
.\switch-to-prod.ps1

# 2. Start frontend (no backend needed)
npm run dev

# 3. Access at http://localhost:3001
# Frontend will call production backend
```

## What Gets Changed?

The scripts modify `.env.local` file:

**Development Mode:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

**Production Mode:**
```env
NEXT_PUBLIC_API_URL=https://backend.aajminpolyclinic.com.np
NEXT_PUBLIC_API_BASE_URL=https://backend.aajminpolyclinic.com.np
```

## Important Notes

⚠️ **Always restart frontend after switching modes:**
```powershell
# Stop current server (Ctrl+C)
# Then restart
npm run dev
```

⚠️ **Development mode requires local backend:**
- Backend must be running on port 3000
- Backend must have latest code (development branch)

⚠️ **Production mode limitations:**
- Can only test features deployed to production
- New features (like Team Gamma) won't work until deployed

## Troubleshooting

### 404 Errors on New Features
- **Cause**: Frontend in production mode, but feature not deployed
- **Solution**: Switch to development mode with `.\switch-to-dev.ps1`

### Connection Refused
- **Cause**: Development mode but backend not running
- **Solution**: Start backend with `cd ..\backend && npm run dev`

### Changes Not Taking Effect
- **Cause**: Frontend not restarted after mode switch
- **Solution**: Restart frontend server (Ctrl+C then `npm run dev`)

## Current Status

Run `.\check-mode.ps1` to see your current configuration.
