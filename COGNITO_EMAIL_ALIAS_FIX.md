# Cognito Email Alias Fix

## 🐛 Issue

**Error:** "Username cannot be of email format, since user pool is configured for email alias"

**Cause:** Your AWS Cognito User Pool is configured with email alias enabled, which means:
- Users can login with their email address
- But the username field cannot be in email format
- We need to use a non-email username internally

---

## ✅ Solution Applied

The `create-test-user.js` script has been updated to handle email alias configuration.

**What Changed:**
- Username is now generated as `user_[timestamp]` (e.g., `user_1699876543210`)
- Email is set as a user attribute
- Users login with their EMAIL, not the username

---

## 🚀 Try Again

Now run the script again:

```bash
cd backend
node scripts/create-test-user.js
```

**Expected Output:**
```
Creating user with email: test@hospital.com
Username: user_1699876543210
✅ User created successfully
✅ Password set successfully

⚠️  IMPORTANT: Login with EMAIL, not username!
Your Cognito User Pool uses email alias.

Login Credentials:
  Email:    test@hospital.com
  Password: Test123!@#
  Name:     Test User
```

---

## 🔑 How to Login

**Use EMAIL to login, not the username!**

1. Open: `http://localhost:3001/auth/login`
2. Enter:
   - **Email:** `test@hospital.com` ✅
   - **Password:** `Test123!@#` ✅
3. Click "Sign In"

**Don't use:**
- ❌ Username: `user_1699876543210`
- ❌ This is internal only

---

## 📋 Understanding Email Alias

### What is Email Alias?

When Cognito User Pool has "email alias" enabled:
- Users can sign in with their email address
- The actual username is stored separately
- Email becomes an alias for the username

### Why This Matters

**Without Email Alias:**
- Username: `test@hospital.com`
- Login with: `test@hospital.com`

**With Email Alias (Your Setup):**
- Username: `user_1699876543210` (internal)
- Email: `test@hospital.com` (alias)
- Login with: `test@hospital.com` ✅

---

## 🔧 Creating Custom Users

### Default User
```bash
node scripts/create-test-user.js
```

Creates:
- Email: `test@hospital.com`
- Password: `Test123!@#`
- Name: `Test User`

### Custom User
```bash
node scripts/create-test-user.js doctor@hospital.com Doctor123! "Dr. John Doe"
```

Creates:
- Email: `doctor@hospital.com`
- Password: `Doctor123!`
- Name: `Dr. John Doe`

**Remember:** Always login with the EMAIL, not the generated username!

---

## ✅ Verification

### After Creating User

**1. Check AWS Cognito Console:**
- Go to AWS Console → Cognito → User Pools
- Select your user pool
- Go to "Users" tab
- You should see:
  - Username: `user_[timestamp]`
  - Email: `test@hospital.com`
  - Status: `CONFIRMED`

**2. Test Login:**
- Open: `http://localhost:3001/auth/login`
- Enter EMAIL: `test@hospital.com`
- Enter Password: `Test123!@#`
- Should login successfully ✅

---

## 🐛 Troubleshooting

### "User already exists"

**Problem:** User with this email already exists

**Solution 1 - Use Existing User:**
Just login with the existing email and password.

**Solution 2 - Delete and Recreate:**

**Via AWS Console:**
1. Go to AWS Cognito Console
2. Select your User Pool
3. Go to "Users" tab
4. Find user by email
5. Click "Delete"
6. Run script again

**Via AWS CLI:**
```bash
# List users to find username
aws cognito-idp list-users --user-pool-id YOUR_POOL_ID

# Delete user (use the username, not email)
aws cognito-idp admin-delete-user \
  --user-pool-id YOUR_POOL_ID \
  --username user_1699876543210
```

---

### "Cannot login with email"

**Problem:** Trying to use username instead of email

**Solution:**
- ✅ Use: `test@hospital.com`
- ❌ Don't use: `user_1699876543210`

---

### "Invalid username or password"

**Possible Causes:**

**1. Wrong Email:**
- Make sure you're using the exact email from the script output
- Check for typos

**2. Wrong Password:**
- Default: `Test123!@#`
- Must match exactly (case-sensitive)

**3. User Not Created:**
- Check script output for errors
- Verify user exists in Cognito Console

**4. Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

---

## 📚 Additional Information

### Why Generate Username?

Cognito with email alias requires:
- Username: Must NOT be in email format
- Email: Can be used for login (alias)

We generate `user_[timestamp]` to:
- Ensure uniqueness
- Avoid email format
- Allow email-based login

### Backend Authentication

The backend authentication service handles this automatically:
- Accepts email in login request
- Cognito resolves email to username
- Returns JWT token
- Frontend stores token in cookies

---

## ✅ Success Checklist

- [ ] Script runs without "email format" error
- [ ] User created successfully
- [ ] Email and password noted
- [ ] Can login with EMAIL (not username)
- [ ] Token stored in cookies
- [ ] Dashboard accessible

---

## 🎉 You're Ready!

Once the script completes successfully:
- ✅ User created in Cognito
- ✅ Email alias configured
- ✅ Can login with email
- ✅ Authentication working

**Next Step:** Login at `http://localhost:3001/auth/login` with your email!

---

**Status:** ✅ Fixed
**Last Updated:** November 2025
**Version:** 2.4.0
