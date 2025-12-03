# MedChat Mobile App - Quick Start Guide

## 🚀 Setup in 5 Steps

### Step 1: Setup Backend Tenant (Run Once)

```bash
# From project root
cd backend
node scripts/setup-medchat-tenant.js
```

This creates:
- Tenant: `tenant_medchat_mobile`
- Subdomain: `medchat`
- Plan: Premium
- Required database tables

### Step 2: Create Admin User

```bash
# Create user in Cognito and Database (from backend directory)
cd backend

# Step 2a: Create database user with role
node scripts/create-hospital-admin.js admin@medchat.ai "MedChat Admin" tenant_medchat_mobile "MedChat@2025!"

# Step 2b: Create Cognito user (handles email alias format)
node scripts/setup-medchat-user.js
```

### Step 3: Install Flutter Dependencies

```bash
cd hms-app
flutter pub get
```

### Step 4: Start Backend Server

```bash
cd backend
npm run dev
```

Backend runs on: `http://localhost:3000`

### Step 5: Run Flutter App

```bash
cd hms-app

# Android Emulator
flutter run

# iOS Simulator
flutter run -d ios

# Web (for testing)
flutter run -d chrome
```

---

## 🔑 Test Credentials

| Field | Value |
|-------|-------|
| Email | admin@medchat.ai |
| Password | MedChat@2025! |
| Tenant ID | tenant_medchat_mobile |

---

## 📁 New Files Created

```
hms-app/
├── lib/
│   ├── core/
│   │   ├── config/
│   │   │   └── api_config.dart      # API configuration
│   │   ├── network/
│   │   │   └── api_client.dart      # HTTP client with interceptors
│   │   └── storage/
│   │       └── secure_storage.dart  # Secure token storage
│   │
│   └── features/
│       └── auth/
│           └── data/
│               ├── models/
│               │   ├── user_model.dart
│               │   └── auth_response.dart
│               └── repositories/
│                   └── auth_repository.dart
│
├── android/app/src/main/res/xml/
│   └── network_security_config.xml  # Allow local dev traffic
│
├── BACKEND_INTEGRATION_PLAN.md      # Full integration plan
├── QUICK_START.md                   # This file
└── setup-medchat-tenant.sql         # SQL setup script

backend/scripts/
└── setup-medchat-tenant.js          # Node.js setup script
```

---

## 🔧 Configuration

### API Base URL (lib/core/config/api_config.dart)

```dart
// Development (Android Emulator)
static const String devBaseUrl = 'http://10.0.2.2:3000';

// Development (iOS Simulator)
static const String devBaseUrlIOS = 'http://localhost:3000';

// Production
static const String prodBaseUrl = 'https://api.healthsync.live';
```

### Tenant Configuration

```dart
static const String appId = 'mobile-app';
static const String apiKey = 'mobile-dev-key-789';
static const String tenantId = 'tenant_medchat_mobile';
```

---

## 🔌 Connecting Auth Screens

Update existing auth screens to use the new repository:

### Sign In Screen

```dart
// In sign_in_screen.dart
import '../../data/repositories/auth_repository.dart';

final _authRepository = AuthRepository();

Future<void> _handleSignIn() async {
  if (!_formKey.currentState!.validate()) return;
  
  setState(() => _isLoading = true);
  
  try {
    final response = await _authRepository.signIn(
      email: _emailController.text.trim(),
      password: _passwordController.text,
    );
    
    showSuccessSnackbar(context, 'Welcome, ${response.user.name}!');
    Navigator.of(context).pushNamedAndRemoveUntil('/', (route) => false);
    
  } on AuthException catch (e) {
    setState(() => _isLoading = false);
    showErrorDialog(context, 'Sign In Failed', e.message);
  }
}
```

### Sign Up Screen

```dart
// In sign_up_screen.dart
Future<void> _handleSignUp() async {
  if (!_formKey.currentState!.validate()) return;
  
  setState(() => _isLoading = true);
  
  try {
    await _authRepository.signUp(
      name: _nameController.text.trim(),
      email: _emailController.text.trim(),
      password: _passwordController.text,
    );
    
    setState(() => _isLoading = false);
    _showVerificationModal(); // Existing modal
    
  } on AuthException catch (e) {
    setState(() => _isLoading = false);
    showErrorDialog(context, 'Sign Up Failed', e.message);
  }
}
```

---

## 🧪 Testing the Integration

### 1. Test Backend Connection

```bash
# From terminal, test the API
curl -X POST http://localhost:3000/auth/signin \
  -H "Content-Type: application/json" \
  -H "X-App-ID: mobile-app" \
  -H "X-API-Key: mobile-dev-key-789" \
  -H "X-Tenant-ID: tenant_medchat_mobile" \
  -d '{"email":"admin@medchat.ai","password":"MedChat@2025!"}'
```

### 2. Test in Flutter

Run the app and try signing in with the test credentials.

---

## ❓ Troubleshooting

### "Connection refused" error
- Ensure backend is running: `cd backend && npm run dev`
- Check API URL matches your setup

### "Unauthorized application" error
- Verify `X-App-ID` and `X-API-Key` headers
- Check `backend/src/middleware/appAuth.ts` has mobile-app configured

### "Tenant not found" error
- Run tenant setup script: `node scripts/setup-medchat-tenant.js`
- Verify tenant exists in database

### Android cleartext traffic blocked
- Ensure `network_security_config.xml` is created
- Verify `AndroidManifest.xml` references it

---

## 📚 Full Documentation

See `BACKEND_INTEGRATION_PLAN.md` for:
- Complete implementation details
- All API endpoints
- Error handling patterns
- Production deployment guide
