# Deploy Backend CORS Fix via AWS Lightsail Console

## Issue
SSH key authentication is failing. The easiest solution is to use AWS Lightsail's browser-based SSH terminal.

## Step-by-Step Deployment

### Step 1: Access AWS Lightsail Console

1. Open browser and go to: **https://lightsail.aws.amazon.com/**
2. Sign in to your AWS account
3. You should see your instance listed (probably named something like "backend-server" or similar)
4. Click on your instance name

### Step 2: Connect via Browser SSH

1. On the instance page, click the **"Connect using SSH"** button (orange button at top)
2. A browser-based terminal will open automatically
3. You're now connected to your server!

### Step 3: Find Backend Directory

First, let's find where the backend is located:

```bash
# Check current directory
pwd

# List all directories
ls -la

# Common locations to check:
ls -la /home/ubuntu/
ls -la /var/www/
ls -la /opt/
ls -la ~/

# Search for backend
find /home -name "backend" -type d 2>/dev/null
find /var -name "backend" -type d 2>/dev/null
```

### Step 4: Navigate to Backend Directory

Once you find it (let's assume it's in one of these locations):

```bash
# Option A: If in home directory
cd ~/backend

# Option B: If in /var/www
cd /var/www/backend

# Option C: If in /opt
cd /opt/backend

# Option D: If it's named differently
cd ~/multi-tenant-backend/backend
```

### Step 5: Check Git Status

```bash
# Check current branch
git branch

# Check remote
git remote -v

# Check if git is configured
git status
```

### Step 6: Pull Latest Code

```bash
# IMPORTANT: Backup local config files first
cp .env.production .env.production.backup 2>/dev/null || true
cp ecosystem.config.js ecosystem.config.js.backup 2>/dev/null || true

# Option A: Stash local changes
git stash
git pull origin development

# Option B: Force pull (if stash doesn't work)
git fetch origin
git reset --hard origin/development

# Restore config files
cp .env.production.backup .env.production 2>/dev/null || true
cp ecosystem.config.js.backup ecosystem.config.js 2>/dev/null || true
```

**If you see "untracked working tree files would be overwritten" error:**
```bash
# Move conflicting files temporarily
mv .env.production .env.production.backup
mv ecosystem.config.js ecosystem.config.js.backup

# Now pull
git pull origin development

# Restore files
mv .env.production.backup .env.production
mv ecosystem.config.js.backup ecosystem.config.js
```

### Step 7: Install Dependencies (if needed)

```bash
# Install any new dependencies
npm install
```

### Step 8: Build TypeScript

```bash
# Build the backend
npm run build

# Verify build succeeded
ls -la dist/
```

### Step 9: Restart Backend Service

```bash
# Check if PM2 is managing the backend
pm2 list

# Restart backend
pm2 restart backend

# If backend is not in PM2 list, try:
pm2 restart all

# Check status
pm2 status
```

### Step 10: Verify Deployment

```bash
# Check if backend is running
pm2 status

# Test API health
curl http://localhost:3000/health

# Check logs for any errors
pm2 logs backend --lines 20
```

## Alternative: If Git is Not Set Up

If git is not configured on the server, you can manually update the file:

### Option A: Use nano editor

```bash
cd /path/to/backend/src/middleware
nano appAuth.ts
```

Find the `ALLOWED_ORIGINS` array and add:
```typescript
'https://aajminpolyclinic.healthsync.live',
'http://aajminpolyclinic.healthsync.live',
```

Find the `isValidSubdomainOrigin` function and add:
```typescript
if (url.hostname.endsWith('.healthsync.live')) {
  return true;
}
```

Save: `Ctrl+O`, Enter, then `Ctrl+X`

Then rebuild:
```bash
npm run build
pm2 restart backend
```

### Option B: Use echo to append

```bash
cd /path/to/backend

# Backup current file
cp src/middleware/appAuth.ts src/middleware/appAuth.ts.backup

# You'll need to manually edit this file
nano src/middleware/appAuth.ts
```

## Troubleshooting

### Issue: "No such directory"

**Solution:** The backend might be in a different location. Run:
```bash
find / -name "package.json" -path "*/backend/*" 2>/dev/null
```

This will show all backend directories on the server.

### Issue: "git: command not found"

**Solution:** Install git:
```bash
sudo apt update
sudo apt install git -y
```

### Issue: "npm: command not found"

**Solution:** Install Node.js and npm:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### Issue: "pm2: command not found"

**Solution:** Install PM2:
```bash
sudo npm install -g pm2
```

### Issue: Backend not starting

**Solution:** Check logs:
```bash
pm2 logs backend --lines 50
```

Or start manually:
```bash
cd /path/to/backend
npm start
```

## Expected Results

After successful deployment:

1. **PM2 Status:**
```
┌─────┬──────────┬─────────┬─────────┐
│ id  │ name     │ status  │ restart │
├─────┼──────────┼─────────┼─────────┤
│ 0   │ backend  │ online  │ 0       │
└─────┴──────────┴─────────┴─────────┘
```

2. **Health Check:**
```json
{"status":"ok","timestamp":"2025-11-28T..."}
```

3. **Frontend Works:**
- Open: https://aajminpolyclinic.healthsync.live
- No CORS errors in browser console
- Dashboard loads with data

## What Changed

The CORS configuration now allows:
- `https://aajminpolyclinic.healthsync.live`
- `http://aajminpolyclinic.healthsync.live`
- All `*.healthsync.live` subdomains

This fixes the CORS error blocking API requests from the frontend.

## Need Help?

If you encounter issues:
1. Take a screenshot of the error
2. Copy the output of: `pm2 logs backend --lines 50`
3. Copy the output of: `ls -la /home/ubuntu/`
4. Share these for further assistance
