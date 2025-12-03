# Medical Records Frontend - Testing Guide

**Quick guide to test the newly implemented features**

---

## 🚀 Quick Start

### 1. Start Servers
```bash
# Terminal 1 - Backend
cd backend
npm run dev  # Port 3000

# Terminal 2 - Frontend
cd hospital-management-system
npm run dev  # Port 3001
```

### 2. Access Application
- Open browser: `http://localhost:3001`
- Login with your credentials
- Navigate to Medical Records page

---

## ✅ Test Scenarios

### Scenario 1: Create New Medical Record

**Steps:**
1. Click "New Record" button
2. **Patient Selection Modal should open**
   - ✅ Modal displays with search bar
   - ✅ Patients list loads
3. Search for a patient (type name or patient number)
   - ✅ Search filters results in real-time
4. Click "Select" on a patient
   - ✅ Modal closes
   - ✅ Form opens with patient info displayed at top
5. **Doctor Selection**
   - ✅ Doctor dropdown loads
   - ✅ Shows doctor names
   - ✅ Can select a doctor
6. Fill in form fields:
   - Visit Date (required)
   - Chief Complaint
   - Diagnosis
   - Treatment Plan
   - Vital Signs (optional)
7. Click "Create Record"
   - ✅ Success message appears
   - ✅ Redirects to record details
   - ✅ Record appears in list

**Expected Result:** ✅ Record created successfully with patient and doctor

---

### Scenario 2: Validation Testing

**Steps:**
1. Click "New Record"
2. Select a patient
3. **Do NOT select a doctor**
4. Fill in other fields
5. Click "Create Record"

**Expected Result:** ❌ Error message: "Please select a doctor"

---

### Scenario 3: Patient Search

**Steps:**
1. Click "New Record"
2. In patient modal, try different searches:
   - Search by first name
   - Search by last name
   - Search by patient number
   - Search by email

**Expected Result:** ✅ All search methods work

---

### Scenario 4: Cancel Flows

**Test A - Cancel Patient Selection:**
1. Click "New Record"
2. Click "Cancel" in patient modal

**Expected Result:** ✅ Returns to list view

**Test B - Cancel Form:**
1. Click "New Record"
2. Select patient
3. Click "Cancel" in form

**Expected Result:** ✅ Returns to list view

---

### Scenario 5: View Existing Records

**Steps:**
1. View medical records list
2. Check that patient names display correctly
3. Try search functionality
4. Try status filters (All/Draft/Finalized)

**Expected Result:** ✅ All display and filter correctly

---

### Scenario 6: Edit Record

**Steps:**
1. Click on a draft record
2. Click "Edit"
3. Verify doctor is pre-selected
4. Make changes
5. Save

**Expected Result:** ✅ Record updates successfully

---

## 🐛 Common Issues & Solutions

### Issue: "Failed to load doctors"
**Solution:** 
- Check backend is running
- Verify `/api/users?role=Doctor` endpoint works
- Check there are users with Doctor role in database

### Issue: "Failed to load patients"
**Solution:**
- Check backend is running
- Verify `/api/patients` endpoint works
- Check there are patients in database

### Issue: Doctor dropdown is empty
**Solution:**
```bash
# Create a test doctor user
cd backend
node scripts/create-test-user.js doctor@test.com "Dr. Test" Doctor
```

### Issue: Patient modal is empty
**Solution:**
- Ensure patients exist in database
- Check tenant context is correct
- Verify X-Tenant-ID header is being sent

---

## 🔍 API Testing

### Test Doctor Endpoint
```bash
curl -X GET "http://localhost:3000/api/users?role=Doctor" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Tenant-ID: YOUR_TENANT_ID" \
  -H "X-App-ID: hospital-management" \
  -H "X-API-Key: YOUR_API_KEY"
```

### Test Patient Endpoint
```bash
curl -X GET "http://localhost:3000/api/patients?limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Tenant-ID: YOUR_TENANT_ID" \
  -H "X-App-ID: hospital-management" \
  -H "X-API-Key: YOUR_API_KEY"
```

### Test Create Medical Record
```bash
curl -X POST "http://localhost:3000/api/medical-records" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Tenant-ID: YOUR_TENANT_ID" \
  -H "X-App-ID: hospital-management" \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": 1,
    "doctor_id": 2,
    "visit_date": "2025-11-29T10:00:00Z",
    "chief_complaint": "Test complaint",
    "diagnosis": "Test diagnosis"
  }'
```

---

## 📊 Verification Checklist

### UI Components
- [ ] Patient selection modal opens
- [ ] Patient search works
- [ ] Patient selection works
- [ ] Doctor dropdown loads
- [ ] Doctor selection works
- [ ] Form displays correctly
- [ ] Validation messages show
- [ ] Success messages appear
- [ ] Error messages display

### Data Flow
- [ ] Patient data loads from API
- [ ] Doctor data loads from API
- [ ] Form submits with doctor_id
- [ ] Record appears in list
- [ ] Patient name displays correctly
- [ ] Record details show correctly

### Error Handling
- [ ] Missing doctor shows error
- [ ] API errors display properly
- [ ] Loading states show
- [ ] Empty states display

---

## 🎯 Success Criteria

✅ **All tests pass when:**
1. Can select patient from modal
2. Can select doctor from dropdown
3. Can create medical record
4. Record appears in list with correct patient name
5. Can view record details
6. Can edit draft records
7. Validation prevents submission without doctor

---

## 📝 Test Data Setup

### Create Test Doctor
```sql
-- In PostgreSQL
INSERT INTO public.users (email, name, tenant_id, role)
VALUES ('doctor@test.com', 'Dr. John Smith', 'your_tenant_id', 'Doctor');
```

### Create Test Patient
```sql
-- In tenant schema
SET search_path TO "your_tenant_id";
INSERT INTO patients (patient_number, first_name, last_name, date_of_birth, status)
VALUES ('P001', 'Jane', 'Doe', '1990-01-01', 'active');
```

---

## 🚨 Known Limitations

1. **File Upload:** Component exists but not fully tested
2. **Templates:** Backend exists, frontend UI not implemented
3. **Audit Trail:** Backend exists, frontend viewing not implemented
4. **Cost Monitoring:** Backend exists, dashboard not implemented

These are **not blockers** for basic medical record creation!

---

## 📞 Need Help?

### Check Logs
```bash
# Backend logs
cd backend
npm run dev  # Watch console output

# Frontend logs
# Open browser DevTools → Console
```

### Common Commands
```bash
# Restart backend
cd backend
npm run dev

# Restart frontend
cd hospital-management-system
npm run dev

# Check database
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db
```

---

**Happy Testing! 🎉**
