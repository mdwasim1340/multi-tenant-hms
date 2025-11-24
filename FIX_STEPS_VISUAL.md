# 🔧 Fix Steps - Visual Guide

## The Problem

```
User clicks "Add Bed"
        ↓
Frontend sends POST /api/beds
        ↓
Backend: ✅ Authentication passes
        ↓
Backend: ❌ Authorization fails (userId not found)
        ↓
Returns: 401 {}
        ↓
Frontend: Logs user out
```

## The Solution

```
Step 1: Restart Backend
        ↓
Step 2: Try to Add Bed
        ↓
Step 3: Check Logs
        ↓
Is localUserId null?
        ↓
    YES → Run fix script
        ↓
    NO → Check other issues
```

## Quick Fix Command

```bash
# If localUserId is null in logs:
cd backend
node fix-user-access.js YOUR_EMAIL "Your Name" YOUR_TENANT_ID

# Example:
node fix-user-access.js user@example.com "John Doe" aajmin_polyclinic
```

## What the Fix Does

```
1. Checks if user exists in database
        ↓
   NO → Creates user
        ↓
2. Checks if user has Hospital Admin role
        ↓
   NO → Assigns Hospital Admin role
        ↓
3. Verifies hospital_system:access permission
        ↓
   ✅ User can now access hospital system
```

## After Running Fix

```
1. Logout from frontend
        ↓
2. Login again
        ↓
3. Try to add bed
        ↓
4. ✅ Success!
```

## Diagnostic Flow

```
Run: node diagnose-user-permissions.js
        ↓
Check output:
        ↓
Is your email in "Users with hospital_system:access"?
        ↓
    YES → User is configured correctly
          Check other issues
        ↓
    NO → User needs to be fixed
         Run fix script
```

## Log Interpretation

### ✅ Good Logs (Working)
```
✅ User mapping successful: {
  email: 'user@example.com',
  localUserId: 123,        ← NUMBER (good!)
  finalUserId: 123,
  userIdType: 'number'
}

🔐 requireApplicationAccess: {
  userId: 123,             ← MATCHES above
  ...
}

✅ Application access granted
```

### ❌ Bad Logs (Not Working)
```
✅ User mapping successful: {
  email: 'user@example.com',
  localUserId: null,       ← NULL (bad!)
  finalUserId: 'uuid-string',
  userIdType: 'string'
}

🔐 requireApplicationAccess: {
  userId: 'uuid-string',   ← STRING (bad!)
  ...
}

❌ No userId found in request
```

## Decision Tree

```
Can you add a bed?
    ↓
NO → Check backend logs
    ↓
Is localUserId null?
    ↓
YES → Run: node fix-user-access.js
    ↓
NO → Is userId a string (UUID)?
    ↓
YES → User not in database
      Run: node fix-user-access.js
    ↓
NO → Is userId a number?
    ↓
YES → Check permissions
      Run: node diagnose-user-permissions.js
    ↓
NO → Unknown issue
     Send logs to developer
```

## Common Scenarios

### Scenario 1: New User
```
Problem: User can login but can't add bed
Cause: User exists in Cognito but not in database
Solution: Run fix-user-access.js
```

### Scenario 2: User Without Role
```
Problem: User exists but has no permissions
Cause: User in database but no role assigned
Solution: Run fix-user-access.js
```

### Scenario 3: Email Mismatch
```
Problem: Different email in Cognito vs database
Cause: Email case mismatch or typo
Solution: Update database email or run fix-user-access.js
```

## Success Indicators

### ✅ You'll Know It's Fixed When:

1. **Backend logs show**:
   ```
   ✅ User mapping successful
   ✅ Application access granted
   ```

2. **Frontend shows**:
   ```
   ✅ Bed created successfully
   ✅ No 401 error
   ✅ No automatic logout
   ```

3. **Diagnostic shows**:
   ```
   ✅ Your email in users list
   ✅ Your email has Hospital Admin role
   ✅ Your email has hospital_system:access
   ```

## Emergency Contact

If nothing works, send me:
1. Your email address
2. Complete backend logs
3. Output from diagnostic script

I'll create a custom fix!

---

**Remember**: 
- Always restart backend after changes
- Always logout/login after running fix script
- Check logs to verify the fix worked
