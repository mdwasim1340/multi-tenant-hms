# Complete Startup Guide - Hospital Management System

## 🚀 Quick Start (5 Minutes)

Follow these steps in order to get the system running properly.

---

## Step 1: Stop All Running Processes

**Stop Backend:**
- Go to terminal running backend
- Press `Ctrl+C` to stop

**Stop Frontend:**
- Go to terminal running frontend
- Press `Ctrl+C` to stop

---

## Step 2: Start Backend with Updated Code

```bash
cd backend
npm run dev
```

**Expected Output:**
```
[INFO] ts-node-dev ver. 2.0.0
✅ WebSocket server initialized
Server is running on port 3000
✅ Redis connected successfully
```

**⚠️ Important:** Make sure you see "Server is running on port 3000" before continuing.

---

## Step 3: Create Test User

**Open a NEW terminal** (keep backend running):

```bash
cd backend
node scripts/create-test-user.js
```

**Expected Output:**
```
Creating Test User in AWS Cognito
============================================================

Creating user: test@hospital.com
✅ User created successfully
Setting permanent password...
✅ Password set successfully

Test User Created Successfully!
============================================================

Login Credentials:
  Email:    test@hospital.com
  Password: Test123!@#
  Name:     Test User

You can now login at:
  http://localhost:3001/auth/login
```

**⚠️ If you see "Username cannot be of email format":**
The script has been updated to fix this. Just run it again:
```bash
node scripts/create-test-user.js
```

**⚠️ If you see "User already exists":**
That's fine! You can use the existing user. The credentials are still:
- Email: `test@hospital.com`
- Password: `Test123!@#`

**⚠️ IMPORTANT:** Login with EMAIL, not username!
- ✅ Use: `test@hospital.com`
- ❌ Don't use: `user_[numbers]`

---

## Step 4: Start Frontend

**Open another NEW terminal** (keep backend running):

```bash
cd hospital-management-system
npm run dev
```

**Expected Output:**
```
▲ Next.js 16.0.0
- Local:        http://localhost:3001
- Network:      http://10.66.66.8:3001

✓ Ready in 2.3s
```

---

## Step 5: Test Login

### Option A: Regular Login
1. Open browser: `http://localhost:3001/auth/login`
2. Enter credentials:
   - Email: `test@hospital.com`
   - Password: `Test123!@#`
3. Click "Sign In"

### Option B: Subdomain Login
1. Open browser: `http://aajminpolyclinic.localhost:3001/auth/login`
2. Enter same credentials
3. Click "Sign In"

**Expected Result:**
- ✅ No CORS errors
- ✅ Successful login
- ✅ Redirect to dashboard
- ✅ Token stored in cookies

---

## 🐛 Troubleshooting

### Still Getting CORS Errors?

**Problem:** Backend not restarted with new code

**Solution:**
1. Stop backend (Ctrl+C)
2. Wait 2 seconds
3. Start again: `npm run dev`
4. Verify you see "Server is running on port 3000"

---

### "Incorrect username or password"

**Problem:** Test user not created yet

**Solution:**
```bash
cd backend
node scripts/create-test-user.js
```

Then try logging in again with:
- Email: `test@hospital.com`
- Password: `Test123!@#`

---

### "Invalid response from server"

**Problem:** Backend not running or wrong credentials

**Check 1 - Backend Running:**
```bash
# Should see backend terminal with "Server is running on port 3000"
```

**Check 2 - Correct Credentials:**
- Email: `test@hospital.com` (not `admin@mediflow.com`)
- Password: `Test123!@#` (not `admin123`)

**Check 3 - Backend Logs:**
Look at backend terminal for errors. Common issues:
- AWS Cognito not configured
- Missing environment variables
- Database connection issues

---

### "Failed to fetch subscription: 404"

**This is normal!** The subscription endpoint is optional. The system works fine without it. This warning can be ignored.

---

### Port Already in Use

**Problem:** Port 3000 or 3001 already in use

**Solution:**

**For Windows:**
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Same for port 3001
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

**For Mac/Linux:**
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Same for port 3001
lsof -ti:3001 | xargs kill -9
```

---

## ✅ Verification Checklist

### Backend Verification
- [ ] Backend terminal shows "Server is running on port 3000"
- [ ] No CORS errors in backend console
- [ ] Redis connected successfully
- [ ] WebSocket server initialized

### Test User Verification
- [ ] Test user created successfully
- [ ] Credentials noted: `test@hospital.com` / `Test123!@#`
- [ ] No "User already exists" error (or acknowledged if exists)

### Frontend Verification
- [ ] Frontend terminal shows "Ready in X.Xs"
- [ ] Can access `http://localhost:3001/auth/login`
- [ ] Login page loads without errors
- [ ] No CORS errors in browser console

### Login Verification
- [ ] Can enter email and password
- [ ] Submit button works
- [ ] No CORS errors after clicking Sign In
- [ ] Successful authentication
- [ ] Redirects to dashboard
- [ ] Dashboard loads successfully

### Cookie Verification
- [ ] Open DevTools → Application → Cookies
- [ ] See `token` cookie with JWT value
- [ ] See `user_email` cookie
- [ ] See `user_name` cookie

---

## 📊 Expected Console Output

### Backend Console (Good)
```
✅ WebSocket server initialized
Server is running on port 3000
✅ Redis connected successfully
✅ Redis connected for subdomain caching
```

### Backend Console (Bad - Needs Restart)
```
Error: Not allowed by CORS
Error: Not allowed by CORS
(Multiple CORS errors)
```
**Fix:** Restart backend

### Browser Console (Good - Login Page)
```
ℹ️  User not authenticated, skipping branding
(Clean, no errors)
```

### Browser Console (Good - After Login)
```
✅ Detected subdomain: aajminpolyclinic
✅ Tenant resolved: { id: "...", name: "..." }
✅ Tenant context set: tenant_xxxxx
```

### Browser Console (Bad - CORS Error)
```
❌ Access to XMLHttpRequest blocked by CORS policy
❌ Request failed with status code 500
```
**Fix:** Restart backend

---

## 🎯 Success Indicators

### You Know It's Working When:

**1. Backend Console:**
- ✅ "Server is running on port 3000"
- ✅ No CORS errors
- ✅ Redis connected

**2. Browser Console:**
- ✅ No CORS errors
- ✅ No authentication errors (except "Incorrect password" if wrong credentials)
- ✅ Clean logs

**3. Login Flow:**
- ✅ Can type in login form
- ✅ Submit button works
- ✅ Shows "Signing in..." loading state
- ✅ Redirects to dashboard
- ✅ Dashboard shows user info

**4. Browser Cookies:**
- ✅ `token` cookie exists
- ✅ `user_email` cookie exists
- ✅ Token starts with "eyJ..." (JWT format)

---

## 🔄 Complete Restart Procedure

If things aren't working, do a complete restart:

### 1. Stop Everything
```bash
# Stop backend (Ctrl+C in backend terminal)
# Stop frontend (Ctrl+C in frontend terminal)
```

### 2. Clear Browser Data
```
1. Open DevTools (F12)
2. Application → Storage → Clear site data
3. Close browser
4. Reopen browser
```

### 3. Start Backend
```bash
cd backend
npm run dev
# Wait for "Server is running on port 3000"
```

### 4. Create/Verify Test User
```bash
# In new terminal
cd backend
node scripts/create-test-user.js
```

### 5. Start Frontend
```bash
# In new terminal
cd hospital-management-system
npm run dev
# Wait for "Ready in X.Xs"
```

### 6. Test Login
```
1. Open: http://localhost:3001/auth/login
2. Login: test@hospital.com / Test123!@#
3. Should work!
```

---

## 📞 Still Having Issues?

### Check Environment Variables

**Backend `.env` file should have:**
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=multitenant_db
DB_USER=postgres
DB_PASSWORD=postgres

# AWS Cognito
COGNITO_USER_POOL_ID=your_pool_id
COGNITO_CLIENT_ID=your_client_id
AWS_REGION=us-east-1

# AWS S3
S3_BUCKET_NAME=your_bucket_name

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
```

**Frontend `.env.local` file should have:**
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_API_KEY=hospital-dev-key-123
```

---

### Check AWS Cognito Configuration

1. Go to AWS Console → Cognito
2. Find your User Pool
3. Check App Client settings:
   - ✅ USER_PASSWORD_AUTH enabled
   - ✅ ALLOW_USER_PASSWORD_AUTH enabled
4. Verify User Pool ID matches `.env`

---

### Check Database Connection

```bash
cd backend
node -e "const { Pool } = require('pg'); const pool = new Pool({ host: 'localhost', port: 5432, database: 'multitenant_db', user: 'postgres', password: 'postgres' }); pool.query('SELECT NOW()', (err, res) => { if (err) console.error('❌ DB Error:', err.message); else console.log('✅ DB Connected:', res.rows[0].now); pool.end(); });"
```

**Expected:** `✅ DB Connected: [timestamp]`

---

## 🎉 You're All Set!

Once you complete these steps successfully:
- ✅ Backend running without CORS errors
- ✅ Test user created
- ✅ Frontend running
- ✅ Can login successfully
- ✅ Dashboard accessible

You're ready to use the hospital management system!

---

**Need Help?**
- Check backend console for errors
- Check browser console for errors
- Verify all environment variables
- Try complete restart procedure
- Review troubleshooting section

**Status:** ✅ Ready to Use
**Last Updated:** November 2025
**Version:** 2.3.0
