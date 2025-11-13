# Subdomain Routing - Quick Start Guide

## 🚀 3-Step Setup

### Step 1: Setup Database Subdomains (30 seconds)

```bash
cd backend
node scripts/setup-test-subdomains.js
```

**What this does:**
- Adds subdomain column to tenants table (if needed)
- Assigns subdomains to all existing tenants
- Shows you all configured subdomains

**Expected output:**
```
✅ http://aajminpolyclinic.localhost:3001 → Aajmin Polyclinic
✅ http://autoid.localhost:3001 → Auto ID Hospital
✅ http://testsubdomain.localhost:3001 → City Hospital
... (and more)
```

---

### Step 2: Configure Hosts File (1 minute)

**Option A: Automatic (Recommended)**

Double-click: `backend/scripts/setup-hosts.bat`

Or run in PowerShell as Administrator:
```powershell
powershell -ExecutionPolicy Bypass -File backend/scripts/setup-hosts-windows.ps1
```

**Option B: Manual**

1. Open Notepad as Administrator
2. Open: `C:\Windows\System32\drivers\etc\hosts`
3. Add these lines:
```
127.0.0.1 aajminpolyclinic.localhost
127.0.0.1 autoid.localhost
127.0.0.1 testsubdomain.localhost
127.0.0.1 completetesthospital.localhost
127.0.0.1 inactivetest.localhost
127.0.0.1 mdwasimakram.localhost
127.0.0.1 testhospitalapi.localhost
```
4. Save and close

---

### Step 3: Verify Everything Works (30 seconds)

```bash
cd backend
node scripts/verify-subdomain-routing.js
```

**Expected output:**
```
✅ ALL TESTS PASSED!

You can now access:
  - http://aajminpolyclinic.localhost:3001
  - http://autoid.localhost:3001
  - http://testsubdomain.localhost:3001
  ...

Subdomain routing is working correctly! 🎉
```

---

## 🎯 Testing Your Setup

### 1. Start Backend
```bash
cd backend
npm run dev  # Port 3000
```

### 2. Start Frontend
```bash
cd hospital-management-system
npm run dev  # Port 3001
```

### 3. Access a Hospital
Open browser: http://aajminpolyclinic.localhost:3001

### 4. Check Browser Console
You should see:
```
Detected subdomain: aajminpolyclinic
Tenant resolved: { id: "...", name: "Aajmin Polyclinic", ... }
Tenant context set: tenant_xxxxx
```

### 5. Verify Cookie
- Open DevTools → Application → Cookies
- Should see `tenant_id` cookie with value

---

## 🔧 Troubleshooting

### "Cannot resolve aajminpolyclinic.localhost"

**Problem:** Hosts file not configured

**Solution:**
```powershell
# Run as Administrator
powershell -ExecutionPolicy Bypass -File backend/scripts/setup-hosts-windows.ps1
```

---

### "Tenant not found for subdomain"

**Problem:** Database doesn't have subdomain value

**Solution:**
```bash
node backend/scripts/setup-test-subdomains.js
```

---

### "CORS error"

**Problem:** Backend not allowing subdomain origin

**Solution:** Restart backend server (it should auto-detect .localhost subdomains)

---

### "Subdomain not detected"

**Problem:** Frontend component not working

**Solution:**
1. Check browser console for errors
2. Verify frontend is running on port 3001
3. Clear browser cache and reload

---

## 📱 How It Works

```
┌─────────────────────────────────────────────────────────┐
│  Browser: http://aajminpolyclinic.localhost:3001       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Frontend: SubdomainDetector Component                  │
│  - Extracts "aajminpolyclinic" from URL                │
│  - Calls: GET /api/tenants/by-subdomain/aajminpolyclinic│
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Backend: Tenant Service                                │
│  - Queries: SELECT * FROM tenants WHERE subdomain = ... │
│  - Returns: { tenant: { id, name, subdomain, ... } }   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Frontend: Sets Context                                 │
│  - Sets tenant_id cookie                               │
│  - All API calls include X-Tenant-ID header            │
│  - User sees hospital-specific data                    │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 Adding New Hospital Subdomains

### Via Admin Dashboard
1. Go to Tenants page
2. Create/edit tenant
3. Set subdomain field (e.g., "newhospital")
4. Save

### Via Script
```bash
# Re-run setup to auto-assign subdomains
node backend/scripts/setup-test-subdomains.js

# Add to hosts file
# Run: backend/scripts/setup-hosts.bat
```

---

## 📚 Full Documentation

For detailed information, see: `docs/SUBDOMAIN_SETUP_GUIDE.md`

---

## ✅ Success Checklist

- [ ] Database subdomains configured
- [ ] Hosts file entries added
- [ ] Verification script passes
- [ ] Backend running on port 3000
- [ ] Frontend running on port 3001
- [ ] Can access http://aajminpolyclinic.localhost:3001
- [ ] Browser console shows subdomain detection
- [ ] tenant_id cookie is set
- [ ] Hospital-specific data loads

---

## 🎉 You're Done!

Your multi-tenant hospital system now supports subdomain-based routing!

Each hospital can be accessed via its unique subdomain:
- **Aajmin Polyclinic:** http://aajminpolyclinic.localhost:3001
- **Auto ID Hospital:** http://autoid.localhost:3001
- **City Hospital:** http://testsubdomain.localhost:3001
- And more...

**Next Steps:**
1. Test patient management features
2. Test appointment scheduling
3. Verify data isolation between tenants
4. Deploy to production with real DNS

---

**Need Help?**
- Run verification: `node backend/scripts/verify-subdomain-routing.js`
- Check logs in backend console
- Review browser console for errors
- See full guide: `docs/SUBDOMAIN_SETUP_GUIDE.md`
