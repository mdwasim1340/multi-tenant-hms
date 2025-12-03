# Local Development Setup - December 2, 2025

## Current Status

### ✅ Completed Actions

1. **Backend Repository Pushed**
   - Repository: https://github.com/mdwasim1340/multi-tenant-backend-only.git
   - Branch: `main`
   - Commit: Fixed authentication and authorization issues
   - Status: ✅ Successfully pushed

2. **Frontend Repository Pushed**
   - Branch: `hackathon-submission`
   - Commit: Fixed frontend-backend API communication issues
   - Status: ✅ Successfully pushed

3. **Development Mode**
   - Current Mode: **DEVELOPMENT** ✅
   - Backend URL: `http://localhost:3000`
   - Frontend URL: `http://localhost:3001`

### Team Alpha Changes Merged

The following features from Team Alpha have been merged into development:

1. **EMR System Enhancements**
   - Medical records improvements
   - Lab results fixes (tenant_ prefix added)

2. **Appointments Queue System**
   - Live countdown timer with HH:MM:SS format
   - Queue action menu (reschedule, wait time adjustment)
   - Wait time adjustment display fixes
   - Reschedule constraint fixes (timezone conversion)

3. **Bug Fixes**
   - Lab results 500 error resolved
   - Wait time adjustment calculations
   - Appointment end time timezone handling
   - Missing dependencies and Suspense boundaries for staff pages

## Local Testing Instructions

### Step 1: Start Backend (Terminal 1)

```bash
cd backend
npm run dev
```

**Expected Output:**
```
Server running on port 3000
Database connected
Multi-tenant middleware active
```

### Step 2: Start Frontend (Terminal 2)

```bash
cd hospital-management-system
npm run dev
```

**Expected Output:**
```
▲ Next.js 16.0.0
- Local:        http://localhost:3001
✓ Ready in 2s
```

### Step 3: Access Application

**URL:** http://localhost:3001

**Test Credentials:**
- Email: `admin@sunrise.hospital`
- Password: `SunriseAdmin@2024`
- Tenant: Sunrise Medical Center

### Step 4: Test Key Features

#### 1. Authentication
- [ ] Login works
- [ ] Tenant context is set correctly
- [ ] Dashboard loads

#### 2. Patient Management
- [ ] Patient list loads
- [ ] Can create new patient
- [ ] Can edit patient
- [ ] CSV export works

#### 3. Appointments (Team Alpha Features)
- [ ] Appointment calendar loads
- [ ] Queue management works
- [ ] Live countdown timer displays
- [ ] Wait time adjustment works
- [ ] Reschedule functionality works

#### 4. Medical Records (Team Alpha Features)
- [ ] EMR list loads
- [ ] Can create medical record
- [ ] Lab results display correctly

#### 5. Billing (Team Gamma Features)
- [ ] Billing dashboard loads
- [ ] Invoice management works
- [ ] Payment processing works

## Switching Between Modes

### Check Current Mode
```powershell
cd hospital-management-system
.\check-mode.ps1
```

### Switch to Development
```powershell
cd hospital-management-system
.\switch-to-dev.ps1
```

### Switch to Production
```powershell
cd hospital-management-system
.\switch-to-prod.ps1
```

## Environment Variables

### Development (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_ID=hospital-management
NEXT_PUBLIC_API_KEY=hospital-dev-key-123
```

### Production (.env.production)
```
NEXT_PUBLIC_API_URL=https://backend.aajminpolyclinic.com.np
NEXT_PUBLIC_APP_ID=hospital-management
NEXT_PUBLIC_API_KEY=hospital-dev-key-123
```

## Troubleshooting

### Backend Not Starting
```bash
# Check if port 3000 is in use
netstat -ano | findstr :3000

# Kill process if needed
taskkill /PID <PID> /F

# Restart backend
cd backend
npm run dev
```

### Frontend Not Starting
```bash
# Check if port 3001 is in use
netstat -ano | findstr :3001

# Kill process if needed
taskkill /PID <PID> /F

# Clear Next.js cache
cd hospital-management-system
Remove-Item -Recurse -Force .next

# Restart frontend
npm run dev
```

### Database Connection Issues
```bash
# Check PostgreSQL is running
docker ps

# Restart PostgreSQL
docker-compose restart postgres

# Check database connection
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "\dt"
```

## Next Steps

1. **Test All Features Locally**
   - Run through the test checklist above
   - Verify Team Alpha features work correctly
   - Test Team Gamma billing features

2. **Fix Any Issues Found**
   - Document issues in a new file
   - Fix and test locally
   - Commit and push fixes

3. **Deploy to Production**
   - Switch to production mode
   - Build frontend: `npm run build`
   - Deploy to production server
   - Test production deployment

## Repository Links

- **Main Repo**: https://github.com/mdwasim1340/multi-tenant-backend
- **Backend Only**: https://github.com/mdwasim1340/multi-tenant-backend-only.git

---

**Status**: ✅ Ready for Local Testing
**Date**: December 2, 2025
**Mode**: Development
