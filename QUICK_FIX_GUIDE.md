# Quick Fix Guide - Add Bed 401 Error

## What I Fixed

I enhanced the backend logging to show exactly why the 401 error is happening.

## What You Need to Do NOW

### Step 1: Restart Backend Server

```bash
# Stop the current backend (Ctrl+C)
# Then restart:
cd backend
npm run dev
```

### Step 2: Try to Add a Bed

1. Go to the bed management page
2. Click "Add Bed"
3. Fill in the form
4. Click "Add Bed" button

### Step 3: Check Backend Logs

Look for these log messages in your backend terminal:

```
✅ User mapping successful: {
  email: 'your-email@example.com',
  localUserId: ???,  ← TELL ME THIS VALUE
  cognitoUserId: 'uuid',
  finalUserId: ???,  ← TELL ME THIS VALUE
  userIdType: ???    ← TELL ME THIS VALUE
}

🔐 requireApplicationAccess: {
  applicationId: 'hospital_system',
  userId: ???,  ← TELL ME THIS VALUE
  ...
}
```

### Step 4: Share the Logs

Copy and paste the ENTIRE log output from your backend terminal and send it to me.

## What I'm Looking For

I need to see:
1. Is `localUserId` a number or `null`?
2. Is `finalUserId` set correctly?
3. Does the `userId` in `requireApplicationAccess` match?

## Quick Diagnostic

Run this command to check your user permissions:

```bash
cd backend
node diagnose-user-permissions.js
```

This will show:
- All users in database
- Their roles
- Who has hospital access

## Most Likely Issues

### Issue 1: User Not in Database
If `localUserId: null`, your user doesn't exist in the database.

**Solution**: Tell me your email address, and I'll create a script to add you.

### Issue 2: User Has No Role
If user exists but has no role assigned.

**Solution**: I'll assign you the Hospital Admin role.

### Issue 3: Email Mismatch
If the email in Cognito doesn't match the database.

**Solution**: We'll update the database email.

## What to Send Me

1. **Your login email**: What email did you use to login?
2. **Backend logs**: The complete log output when you try to add a bed
3. **Diagnostic output**: Output from `node diagnose-user-permissions.js`

## Why This Will Work

The enhanced logging will show us EXACTLY where the authentication chain is breaking, so we can fix it permanently.

---

**DO THIS NOW**:
1. Restart backend
2. Try to add bed
3. Copy backend logs
4. Send me the logs

I'll fix it immediately once I see the logs!
