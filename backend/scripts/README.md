# Backend Scripts - Subdomain Routing Setup

## 🚀 Quick Start (3 Commands)

```bash
# 1. Setup database subdomains
node setup-test-subdomains.js

# 2. Configure hosts file (run as Administrator)
# Option A: Double-click setup-hosts.bat
# Option B: Run PowerShell command
powershell -ExecutionPolicy Bypass -File setup-hosts-windows.ps1

# 3. Verify everything works
node verify-subdomain-routing.js
```

---

## 📁 Available Scripts

### create-test-user.js
**Purpose:** Create test users in AWS Cognito for authentication testing

**What it does:**
- Creates user in AWS Cognito User Pool
- Sets permanent password (no temporary password)
- Marks email as verified
- Suppresses welcome email

**Usage:**
```bash
# Create default test user (test@hospital.com / Test123!@#)
node create-test-user.js

# Create custom user
node create-test-user.js doctor@hospital.com Doctor123! "Dr. John Doe"
```

**Output:**
```
✅ User created successfully
✅ Password set successfully

Login Credentials:
  Email:    test@hospital.com
  Password: Test123!@#
  Name:     Test User
```

**Requirements:**
- AWS Cognito User Pool configured
- COGNITO_USER_POOL_ID in .env
- AWS credentials configured

---

### setup-test-subdomains.js
**Purpose:** Configure subdomain values for all tenants in database

**What it does:**
- Adds `subdomain` column to tenants table (if needed)
- Auto-generates subdomains from tenant names
- Updates all tenants with subdomain values
- Shows final configuration

**Usage:**
```bash
node setup-test-subdomains.js
```

**Output:**
```
✅ http://aajminpolyclinic.localhost:3001 → Aajmin Polyclinic
✅ http://autoid.localhost:3001 → Auto ID Hospital
✅ http://testsubdomain.localhost:3001 → City Hospital
...
```

---

### setup-hosts-windows.ps1
**Purpose:** Automatically configure Windows hosts file

**What it does:**
- Adds subdomain entries to `C:\Windows\System32\drivers\etc\hosts`
- Checks for existing entries (no duplicates)
- Flushes DNS cache
- Shows all configured subdomains

**Usage:**
```powershell
# Run as Administrator
powershell -ExecutionPolicy Bypass -File setup-hosts-windows.ps1
```

**Requirements:**
- Administrator privileges
- Windows operating system

**Output:**
```
Adding entry: 127.0.0.1 aajminpolyclinic.localhost
Adding entry: 127.0.0.1 autoid.localhost
...
Hosts file updated successfully!
DNS cache flushed!
```

---

### setup-hosts.bat
**Purpose:** Easy double-click hosts file setup

**What it does:**
- Prompts for Administrator privileges
- Runs PowerShell script automatically
- User-friendly interface

**Usage:**
- Double-click the file
- Click "Yes" when prompted for admin privileges

---

### verify-subdomain-routing.js
**Purpose:** End-to-end verification of subdomain routing

**What it does:**
- Checks hosts file configuration
- Verifies database tenants have subdomains
- Tests backend API subdomain resolution
- Tests frontend subdomain detection
- Runs complete end-to-end flow test
- Provides detailed success/failure reporting

**Usage:**
```bash
node verify-subdomain-routing.js
```

**Output:**
```
╔════════════════════════════════════════════════════════════╗
║     SUBDOMAIN ROUTING VERIFICATION - END TO END TEST      ║
╚════════════════════════════════════════════════════════════╝

Step 0: Checking Hosts File Configuration
✅ Found: 127.0.0.1 aajminpolyclinic.localhost
✅ Found: 127.0.0.1 autoid.localhost
...

Step 1: Checking Database Tenants
✅ Found 7 tenants with subdomains

Step 2: Testing Backend API
✅ Backend API returned tenant data

Step 3: Testing Frontend Subdomain Detection
✅ Frontend accessible at subdomain URL

Step 4: End-to-End Flow Test
✅ End-to-end flow verified successfully!

VERIFICATION SUMMARY
✅ ALL TESTS PASSED!
```

---

## 🔧 Troubleshooting

### "Must be run as Administrator"
**Problem:** PowerShell script needs admin privileges

**Solution:**
- Right-click PowerShell
- Select "Run as Administrator"
- Run the command again

---

### "Column 'subdomain' does not exist"
**Problem:** Database schema not updated

**Solution:**
```bash
node setup-test-subdomains.js
# This will add the column automatically
```

---

### "Tenant not found for subdomain"
**Problem:** Database doesn't have subdomain values

**Solution:**
```bash
node setup-test-subdomains.js
```

---

### "DNS resolution failed"
**Problem:** Hosts file not configured

**Solution:**
```powershell
# Run as Administrator
powershell -ExecutionPolicy Bypass -File setup-hosts-windows.ps1
```

---

### "Backend not responding"
**Problem:** Backend server not running

**Solution:**
```bash
cd backend
npm run dev  # Start backend on port 3000
```

---

### "Frontend not responding"
**Problem:** Frontend server not running

**Solution:**
```bash
cd hospital-management-system
npm run dev  # Start frontend on port 3001
```

---

## 📚 Documentation

### Quick Start Guide
**File:** `../SUBDOMAIN_QUICKSTART.md`
**Purpose:** 3-step setup for developers

### Comprehensive Guide
**File:** `../docs/SUBDOMAIN_SETUP_GUIDE.md`
**Purpose:** Complete documentation with troubleshooting

### Implementation Summary
**File:** `../docs/SUBDOMAIN_IMPLEMENTATION_SUMMARY.md`
**Purpose:** Technical overview of implementation

---

## 🎯 Workflow

### Initial Setup (One Time)
```bash
# 1. Setup database
node setup-test-subdomains.js

# 2. Configure hosts file (as Administrator)
powershell -ExecutionPolicy Bypass -File setup-hosts-windows.ps1

# 3. Verify setup
node verify-subdomain-routing.js
```

### Adding New Tenant
```bash
# 1. Create tenant in admin dashboard (set subdomain field)

# 2. Add hosts entry (as Administrator)
powershell -ExecutionPolicy Bypass -File setup-hosts-windows.ps1

# 3. Verify new tenant
node verify-subdomain-routing.js
```

### Daily Development
```bash
# Just start the servers
cd backend && npm run dev          # Terminal 1
cd hospital-management-system && npm run dev  # Terminal 2

# Access hospitals
# http://aajminpolyclinic.localhost:3001
# http://autoid.localhost:3001
# etc.
```

---

## ✅ Success Checklist

- [ ] Database subdomains configured (`setup-test-subdomains.js`)
- [ ] Hosts file entries added (`setup-hosts-windows.ps1`)
- [ ] Verification passes (`verify-subdomain-routing.js`)
- [ ] Backend running on port 3000
- [ ] Frontend running on port 3001
- [ ] Can access http://aajminpolyclinic.localhost:3001
- [ ] Browser console shows subdomain detection
- [ ] tenant_id cookie is set

---

## 🎉 You're Ready!

Once all scripts complete successfully, you can access each hospital via its subdomain:

- **Aajmin Polyclinic:** http://aajminpolyclinic.localhost:3001
- **Auto ID Hospital:** http://autoid.localhost:3001
- **City Hospital:** http://testsubdomain.localhost:3001
- And more...

Each subdomain automatically sets the correct tenant context, ensuring complete data isolation.

---

**Need Help?**
- Run: `node verify-subdomain-routing.js`
- Check: `../docs/SUBDOMAIN_SETUP_GUIDE.md`
- Review: Backend and frontend console logs
