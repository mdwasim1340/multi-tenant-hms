# Flutter HMS App - Backend Integration Plan

**Date**: December 3, 2025  
**App Name**: MedChat AI (hms-app)  
**Backend**: Multi-Tenant Hospital Management System  
**Status**: Planning Phase

---

## 📋 Executive Summary

This document outlines the plan to connect the Flutter MedChat AI app with the existing multi-tenant backend. The integration involves:

1. Creating a dedicated tenant for the mobile app
2. Registering the app in the backend's allowed applications
3. Implementing API services in Flutter
4. Connecting existing auth screens to real backend endpoints

---

## 🏗️ Phase 1: Backend Configuration (Estimated: 1-2 hours)

### 1.1 Create New Tenant for Mobile App

**SQL Script to Execute:**
```sql
-- Create tenant for MedChat Mobile App
INSERT INTO public.tenants (id, name, email, plan, status, subdomain)
VALUES (
  'tenant_medchat_mobile',
  'MedChat Mobile App',
  'admin@medchat.ai',
  'enterprise',
  'active',
  'medchat'
);

-- Create tenant schema
CREATE SCHEMA "tenant_medchat_mobile";

-- Create subscription
INSERT INTO tenant_subscriptions (tenant_id, tier_id, usage_limits, billing_cycle, status)
VALUES (
  'tenant_medchat_mobile',
  'enterprise',
  '{"max_patients": 10000, "max_users": 1000, "storage_gb": 100, "api_calls_per_day": 100000}',
  'monthly',
  'active'
);

-- Create branding
INSERT INTO tenant_branding (tenant_id, primary_color, secondary_color, accent_color)
VALUES ('tenant_medchat_mobile', '#00897B', '#26A69A', '#4DB6AC');
```

### 1.2 Register Mobile App in Backend

**File to Update:** `backend/src/middleware/appAuth.ts`

Add mobile app configuration:
```typescript
// Add to ALLOWED_ORIGINS (for web builds)
'http://localhost:5000',  // Flutter web dev
'http://localhost:8080',  // Flutter web alternative

// APP_API_KEYS already has mobile-app entry:
'mobile-app': process.env.MOBILE_APP_API_KEY || 'mobile-dev-key-789',
```

### 1.3 Create Mobile App Admin User

**Script to Execute:**
```javascript
// Create admin user for mobile app tenant
const userData = {
  email: 'admin@medchat.ai',
  password: 'MedChat@2025!',
  name: 'MedChat Admin',
  tenant_id: 'tenant_medchat_mobile'
};
```

---

## 🔧 Phase 2: Flutter App Structure Setup (Estimated: 2-3 hours)

### 2.1 Add Required Dependencies

**Update `pubspec.yaml`:**
```yaml
dependencies:
  flutter:
    sdk: flutter
  cupertino_icons: ^1.0.8
  
  # HTTP & API
  dio: ^5.4.0                    # HTTP client with interceptors
  retrofit: ^4.1.0               # Type-safe API client
  json_annotation: ^4.8.1        # JSON serialization
  
  # State Management
  flutter_riverpod: ^2.4.9       # State management
  riverpod_annotation: ^2.3.3    # Riverpod code generation
  
  # Local Storage
  flutter_secure_storage: ^9.0.0 # Secure token storage
  shared_preferences: ^2.2.2     # App preferences
  
  # Authentication
  jwt_decoder: ^2.0.1            # JWT token parsing
  
  # UI Utilities
  flutter_spinkit: ^5.2.0        # Loading indicators
  fluttertoast: ^8.2.4           # Toast notifications

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^6.0.0
  build_runner: ^2.4.8           # Code generation
  json_serializable: ^6.7.1      # JSON code generation
  retrofit_generator: ^8.1.0     # Retrofit code generation
  riverpod_generator: ^2.3.9     # Riverpod code generation
```

### 2.2 Create Project Structure

```
lib/
├── main.dart                    # App entry point
├── app.dart                     # MaterialApp configuration
│
├── core/
│   ├── config/
│   │   ├── api_config.dart      # API URLs and keys
│   │   └── app_config.dart      # App-wide configuration
│   │
│   ├── network/
│   │   ├── api_client.dart      # Dio HTTP client setup
│   │   ├── api_interceptors.dart # Auth, logging interceptors
│   │   └── api_exceptions.dart  # Custom exceptions
│   │
│   ├── storage/
│   │   ├── secure_storage.dart  # Token storage
│   │   └── preferences.dart     # App preferences
│   │
│   └── utils/
│       ├── validators.dart      # Input validation
│       └── extensions.dart      # Dart extensions
│
├── features/
│   ├── auth/
│   │   ├── data/
│   │   │   ├── models/
│   │   │   │   ├── user_model.dart
│   │   │   │   ├── auth_response.dart
│   │   │   │   └── token_model.dart
│   │   │   ├── repositories/
│   │   │   │   └── auth_repository.dart
│   │   │   └── datasources/
│   │   │       └── auth_api.dart
│   │   │
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   └── user.dart
│   │   │   └── usecases/
│   │   │       ├── sign_in.dart
│   │   │       ├── sign_up.dart
│   │   │       └── forgot_password.dart
│   │   │
│   │   └── presentation/
│   │       ├── providers/
│   │       │   └── auth_provider.dart
│   │       └── screens/
│   │           └── (existing screens)
│   │
│   ├── chat/
│   │   └── (AI chat feature)
│   │
│   └── profile/
│       └── (user profile feature)
│
└── shared/
    ├── widgets/
    │   └── (common widgets)
    └── constants/
        └── (app constants)
```

---

## 🔌 Phase 3: API Integration Implementation (Estimated: 4-6 hours)

### 3.1 API Configuration

**File: `lib/core/config/api_config.dart`**
```dart
class ApiConfig {
  // Development
  static const String devBaseUrl = 'http://10.0.2.2:3000'; // Android emulator
  // static const String devBaseUrl = 'http://localhost:3000'; // iOS simulator
  
  // Production
  static const String prodBaseUrl = 'https://api.healthsync.live';
  
  // Current environment
  static const bool isProduction = false;
  static String get baseUrl => isProduction ? prodBaseUrl : devBaseUrl;
  
  // App credentials
  static const String appId = 'mobile-app';
  static const String apiKey = 'mobile-dev-key-789'; // Use env var in production
  
  // Tenant ID for MedChat Mobile
  static const String tenantId = 'tenant_medchat_mobile';
  
  // Endpoints
  static const String signIn = '/auth/signin';
  static const String signUp = '/auth/signup';
  static const String verifyEmail = '/auth/verify-email';
  static const String forgotPassword = '/auth/forgot-password';
  static const String resetPassword = '/auth/reset-password';
  static const String refreshToken = '/auth/refresh';
}
```

### 3.2 HTTP Client with Interceptors

**File: `lib/core/network/api_client.dart`**
```dart
import 'package:dio/dio.dart';
import '../config/api_config.dart';
import '../storage/secure_storage.dart';

class ApiClient {
  static Dio? _dio;
  
  static Dio get instance {
    _dio ??= _createDio();
    return _dio!;
  }
  
  static Dio _createDio() {
    final dio = Dio(BaseOptions(
      baseUrl: ApiConfig.baseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
        'X-App-ID': ApiConfig.appId,
        'X-API-Key': ApiConfig.apiKey,
        'X-Tenant-ID': ApiConfig.tenantId,
      },
    ));
    
    // Add interceptors
    dio.interceptors.addAll([
      AuthInterceptor(),
      LoggingInterceptor(),
      ErrorInterceptor(),
    ]);
    
    return dio;
  }
}

class AuthInterceptor extends Interceptor {
  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    // Skip auth header for public endpoints
    if (_isPublicEndpoint(options.path)) {
      return handler.next(options);
    }
    
    final token = await SecureStorage.getToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    
    return handler.next(options);
  }
  
  bool _isPublicEndpoint(String path) {
    return path.contains('/auth/signin') ||
           path.contains('/auth/signup') ||
           path.contains('/auth/forgot-password');
  }
}
```

### 3.3 Auth Repository

**File: `lib/features/auth/data/repositories/auth_repository.dart`**
```dart
import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/config/api_config.dart';
import '../../../../core/storage/secure_storage.dart';
import '../models/auth_response.dart';
import '../models/user_model.dart';

class AuthRepository {
  final Dio _dio = ApiClient.instance;
  
  /// Sign in with email and password
  Future<AuthResponse> signIn({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _dio.post(
        ApiConfig.signIn,
        data: {
          'email': email,
          'password': password,
        },
      );
      
      final authResponse = AuthResponse.fromJson(response.data);
      
      // Store tokens securely
      await SecureStorage.saveToken(authResponse.token);
      if (authResponse.refreshToken != null) {
        await SecureStorage.saveRefreshToken(authResponse.refreshToken!);
      }
      await SecureStorage.saveUser(authResponse.user);
      
      return authResponse;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }
  
  /// Sign up new user
  Future<void> signUp({
    required String name,
    required String email,
    required String password,
    String? phone,
  }) async {
    try {
      await _dio.post(
        ApiConfig.signUp,
        data: {
          'name': name,
          'email': email,
          'password': password,
          if (phone != null) 'phone': phone,
        },
      );
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }
  
  /// Verify email with code
  Future<void> verifyEmail({
    required String email,
    required String code,
  }) async {
    try {
      await _dio.post(
        ApiConfig.verifyEmail,
        data: {
          'email': email,
          'code': code,
        },
      );
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }
  
  /// Request password reset
  Future<void> forgotPassword(String email) async {
    try {
      await _dio.post(
        ApiConfig.forgotPassword,
        data: {'email': email},
      );
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }
  
  /// Reset password with code
  Future<void> resetPassword({
    required String email,
    required String code,
    required String newPassword,
  }) async {
    try {
      await _dio.post(
        ApiConfig.resetPassword,
        data: {
          'email': email,
          'code': code,
          'newPassword': newPassword,
        },
      );
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }
  
  /// Sign out
  Future<void> signOut() async {
    await SecureStorage.clearAll();
  }
  
  /// Check if user is authenticated
  Future<bool> isAuthenticated() async {
    final token = await SecureStorage.getToken();
    return token != null;
  }
  
  Exception _handleError(DioException e) {
    if (e.response != null) {
      final data = e.response!.data;
      final message = data['message'] ?? data['error'] ?? 'Unknown error';
      return AuthException(message, e.response!.statusCode);
    }
    return AuthException('Network error. Please check your connection.', null);
  }
}

class AuthException implements Exception {
  final String message;
  final int? statusCode;
  
  AuthException(this.message, this.statusCode);
  
  @override
  String toString() => message;
}
```

### 3.4 Data Models

**File: `lib/features/auth/data/models/auth_response.dart`**
```dart
import 'user_model.dart';

class AuthResponse {
  final String token;
  final String? refreshToken;
  final int? expiresIn;
  final UserModel user;
  final List<Role> roles;
  final List<Permission> permissions;
  
  AuthResponse({
    required this.token,
    this.refreshToken,
    this.expiresIn,
    required this.user,
    this.roles = const [],
    this.permissions = const [],
  });
  
  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      token: json['token'],
      refreshToken: json['refreshToken'],
      expiresIn: json['expiresIn'],
      user: UserModel.fromJson(json['user']),
      roles: (json['roles'] as List?)
          ?.map((r) => Role.fromJson(r))
          .toList() ?? [],
      permissions: (json['permissions'] as List?)
          ?.map((p) => Permission.fromJson(p))
          .toList() ?? [],
    );
  }
}

class Role {
  final int id;
  final String name;
  final String? description;
  
  Role({required this.id, required this.name, this.description});
  
  factory Role.fromJson(Map<String, dynamic> json) {
    return Role(
      id: json['id'],
      name: json['name'],
      description: json['description'],
    );
  }
}

class Permission {
  final String resource;
  final String action;
  
  Permission({required this.resource, required this.action});
  
  factory Permission.fromJson(Map<String, dynamic> json) {
    return Permission(
      resource: json['resource'],
      action: json['action'],
    );
  }
}
```

**File: `lib/features/auth/data/models/user_model.dart`**
```dart
class UserModel {
  final int id;
  final String email;
  final String name;
  final String tenantId;
  
  UserModel({
    required this.id,
    required this.email,
    required this.name,
    required this.tenantId,
  });
  
  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'],
      email: json['email'],
      name: json['name'],
      tenantId: json['tenant_id'],
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'name': name,
      'tenant_id': tenantId,
    };
  }
}
```

### 3.5 Secure Storage

**File: `lib/core/storage/secure_storage.dart`**
```dart
import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../features/auth/data/models/user_model.dart';

class SecureStorage {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );
  
  static const _tokenKey = 'auth_token';
  static const _refreshTokenKey = 'refresh_token';
  static const _userKey = 'user_data';
  
  // Token operations
  static Future<void> saveToken(String token) async {
    await _storage.write(key: _tokenKey, value: token);
  }
  
  static Future<String?> getToken() async {
    return await _storage.read(key: _tokenKey);
  }
  
  static Future<void> saveRefreshToken(String token) async {
    await _storage.write(key: _refreshTokenKey, value: token);
  }
  
  static Future<String?> getRefreshToken() async {
    return await _storage.read(key: _refreshTokenKey);
  }
  
  // User operations
  static Future<void> saveUser(UserModel user) async {
    await _storage.write(key: _userKey, value: jsonEncode(user.toJson()));
  }
  
  static Future<UserModel?> getUser() async {
    final data = await _storage.read(key: _userKey);
    if (data != null) {
      return UserModel.fromJson(jsonDecode(data));
    }
    return null;
  }
  
  // Clear all
  static Future<void> clearAll() async {
    await _storage.deleteAll();
  }
}
```

---

## 🔄 Phase 4: Update Existing Auth Screens (Estimated: 2-3 hours)

### 4.1 Update Sign In Screen

Replace the mock `_handleSignIn` method with real API call:

```dart
// In sign_in_screen.dart

import '../../data/repositories/auth_repository.dart';

// Add repository instance
final _authRepository = AuthRepository();

Future<void> _handleSignIn() async {
  setState(() => _passwordError = null);
  
  if (!_formKey.currentState!.validate()) return;
  
  setState(() => _isLoading = true);
  
  try {
    final response = await _authRepository.signIn(
      email: _emailController.text.trim(),
      password: _passwordController.text,
    );
    
    if (!mounted) return;
    
    showSuccessSnackbar(context, 'Welcome back, ${response.user.name}!');
    
    // Navigate to home
    Navigator.of(context).pushNamedAndRemoveUntil('/', (route) => false);
    
  } on AuthException catch (e) {
    setState(() {
      _isLoading = false;
      if (e.statusCode == 401) {
        _passwordError = 'Incorrect password. Please try again.';
      }
    });
    
    showErrorDialog(context, 'Sign In Failed', e.message);
  } catch (e) {
    setState(() => _isLoading = false);
    showErrorDialog(context, 'Error', 'An unexpected error occurred. Please try again.');
  }
}
```

### 4.2 Update Sign Up Screen

Replace the mock `_handleSignUp` method:

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
      phone: _phoneController.text.isNotEmpty
          ? '$_selectedCountryCode${_phoneController.text}'
          : null,
    );
    
    if (!mounted) return;
    
    setState(() => _isLoading = false);
    _showVerificationModal();
    
  } on AuthException catch (e) {
    setState(() => _isLoading = false);
    showErrorDialog(context, 'Sign Up Failed', e.message);
  }
}
```

---

## 📱 Phase 5: Environment Configuration (Estimated: 1 hour)

### 5.1 Create Environment Files

**File: `lib/core/config/env.dart`**
```dart
enum Environment { development, staging, production }

class Env {
  static Environment current = Environment.development;
  
  static String get apiBaseUrl {
    switch (current) {
      case Environment.development:
        return 'http://10.0.2.2:3000'; // Android emulator
      case Environment.staging:
        return 'https://staging-api.healthsync.live';
      case Environment.production:
        return 'https://api.healthsync.live';
    }
  }
  
  static String get tenantId {
    switch (current) {
      case Environment.development:
        return 'tenant_medchat_mobile';
      case Environment.staging:
        return 'tenant_medchat_staging';
      case Environment.production:
        return 'tenant_medchat_production';
    }
  }
  
  static String get apiKey {
    // In production, use --dart-define or .env file
    return const String.fromEnvironment(
      'API_KEY',
      defaultValue: 'mobile-dev-key-789',
    );
  }
}
```

### 5.2 Android Network Security Config

**File: `android/app/src/main/res/xml/network_security_config.xml`**
```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">10.0.2.2</domain>
        <domain includeSubdomains="true">localhost</domain>
    </domain-config>
</network-security-config>
```

**Update `android/app/src/main/AndroidManifest.xml`:**
```xml
<application
    android:networkSecurityConfig="@xml/network_security_config"
    ...>
```

---

## ✅ Phase 6: Testing & Verification (Estimated: 2-3 hours)

### 6.1 Backend Verification Checklist

- [ ] Tenant `tenant_medchat_mobile` created in database
- [ ] Tenant schema created
- [ ] Subscription assigned
- [ ] Admin user created in Cognito
- [ ] User record created in database with correct tenant_id
- [ ] Mobile app API key configured

### 6.2 Flutter App Verification Checklist

- [ ] Dependencies installed (`flutter pub get`)
- [ ] API client connects to backend
- [ ] Sign in works with real credentials
- [ ] Sign up creates user in correct tenant
- [ ] Email verification works
- [ ] Password reset flow works
- [ ] Token stored securely
- [ ] Auto-logout on token expiry

### 6.3 Test Commands

```bash
# Backend - Create tenant
cd backend
node -e "
const pool = require('./src/database').default;
async function createTenant() {
  await pool.query(\`
    INSERT INTO public.tenants (id, name, email, plan, status, subdomain)
    VALUES ('tenant_medchat_mobile', 'MedChat Mobile App', 'admin@medchat.ai', 'enterprise', 'active', 'medchat')
    ON CONFLICT (id) DO NOTHING
  \`);
  console.log('Tenant created');
  process.exit(0);
}
createTenant();
"

# Flutter - Run app
cd hms-app
flutter pub get
flutter run
```

---

## 📊 Summary

| Phase | Task | Estimated Time | Priority |
|-------|------|----------------|----------|
| 1 | Backend Configuration | 1-2 hours | High |
| 2 | Flutter Structure Setup | 2-3 hours | High |
| 3 | API Integration | 4-6 hours | High |
| 4 | Update Auth Screens | 2-3 hours | High |
| 5 | Environment Config | 1 hour | Medium |
| 6 | Testing & Verification | 2-3 hours | High |

**Total Estimated Time: 12-18 hours**

---

## 🚀 Quick Start Commands

```bash
# 1. Start backend
cd backend && npm run dev

# 2. Create tenant (run once)
# Execute SQL from Phase 1.1

# 3. Install Flutter dependencies
cd hms-app && flutter pub get

# 4. Run Flutter app
flutter run

# 5. Test sign in
# Use: admin@medchat.ai / MedChat@2025!
```

---

## 📝 Notes

1. **Security**: Never commit API keys to version control. Use environment variables.
2. **Tenant Isolation**: All API calls include `X-Tenant-ID` header for data isolation.
3. **Token Refresh**: Implement token refresh logic for long sessions.
4. **Error Handling**: All API errors are caught and displayed user-friendly messages.
5. **Offline Support**: Consider adding offline caching for better UX.

---

**Next Steps After Implementation:**
1. Add biometric authentication (local_auth package)
2. Implement push notifications
3. Add offline mode with local database
4. Implement chat AI integration
5. Add analytics tracking
