import 'package:flutter/foundation.dart' show kIsWeb;
import 'dart:io' show Platform;

/// API Configuration for MedChat Mobile App
/// 
/// This file contains all API-related configuration including
/// base URLs, endpoints, and app credentials for the multi-tenant backend.

class ApiConfig {
  // ============================================================
  // Environment URLs
  // ============================================================
  
  /// Development backend URL for Web
  static const String devBaseUrlWeb = 'http://localhost:3000';
  
  /// Development backend URL (Android emulator uses 10.0.2.2 for localhost)
  static const String devBaseUrlAndroid = 'http://10.0.2.2:3000';
  
  /// iOS Simulator uses localhost directly
  static const String devBaseUrlIOS = 'http://localhost:3000';
  
  /// Production backend URL
  static const String prodBaseUrl = 'https://api.healthsync.live';
  
  /// Current environment flag
  static const bool isProduction = false;
  
  /// Get the appropriate base URL based on platform and environment
  static String get baseUrl {
    if (isProduction) return prodBaseUrl;
    
    // Web platform
    if (kIsWeb) return devBaseUrlWeb;
    
    // Mobile platforms
    try {
      if (Platform.isAndroid) return devBaseUrlAndroid;
      if (Platform.isIOS) return devBaseUrlIOS;
    } catch (e) {
      // Platform not available, default to web
    }
    
    return devBaseUrlWeb;
  }
  
  // ============================================================
  // App Credentials (Multi-Tenant Authentication)
  // ============================================================
  
  /// Application identifier registered in backend
  static const String appId = 'medchat-mobile';
  
  /// API key for app authentication
  /// In production, use: --dart-define=API_KEY=your-key
  static const String apiKey = String.fromEnvironment(
    'API_KEY',
    defaultValue: 'medchat-dev-key-789',
  );
  
  /// Tenant ID for MedChat Mobile App
  static const String tenantId = 'tenant_medchat_mobile';
  
  // ============================================================
  // API Endpoints
  // ============================================================
  
  // Authentication
  static const String signIn = '/auth/signin';
  static const String signUp = '/auth/signup';
  static const String verifyEmail = '/auth/verify-email';
  static const String forgotPassword = '/auth/forgot-password';
  static const String resetPassword = '/auth/reset-password';
  static const String refreshToken = '/auth/refresh';
  static const String respondToChallenge = '/auth/respond-to-challenge';
  
  // User Management
  static const String users = '/api/users';
  static const String userProfile = '/api/users/profile';
  
  // Patients (if needed for medical chat context)
  static const String patients = '/api/patients';
  
  // Medical Records
  static const String medicalRecords = '/api/medical-records';
  
  // Subscriptions
  static const String subscriptionTiers = '/api/subscriptions/tiers';
  static const String currentSubscription = '/api/subscriptions/current';
  static const String compareSubscription = '/api/subscriptions/compare';
  static const String updateSubscription = '/api/subscriptions/tenant';
  
  // ============================================================
  // Request Timeouts
  // ============================================================
  
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
  static const Duration sendTimeout = Duration(seconds: 30);
  
  // ============================================================
  // Required Headers
  // ============================================================
  
  /// Get default headers for API requests
  static Map<String, String> get defaultHeaders => {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-App-ID': appId,
    'X-API-Key': apiKey,
    'X-Tenant-ID': tenantId,
  };
}
