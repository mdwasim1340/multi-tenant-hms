/// Auth Repository for MedChat Mobile App
/// 
/// Handles all authentication-related API calls:
/// - Sign in / Sign up
/// - Email verification
/// - Password reset
/// - Token management

import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/config/api_config.dart';
import '../../../../core/storage/secure_storage.dart';
import '../models/auth_response.dart';
import '../models/user_model.dart';

class AuthRepository {
  final Dio _dio = ApiClient.instance;
  
  // ============================================================
  // Sign In
  // ============================================================
  
  /// Sign in with email and password
  /// Returns [AuthResponse] on success
  /// Throws [AuthException] on failure
  Future<AuthResponse> signIn({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _dio.post(
        ApiConfig.signIn,
        data: {
          'email': email.trim().toLowerCase(),
          'password': password,
        },
      );
      
      // Check for MFA challenge
      if (response.data['ChallengeName'] != null) {
        throw MfaRequiredException(
          challengeName: response.data['ChallengeName'],
          session: response.data['Session'],
        );
      }
      
      final authResponse = AuthResponse.fromJson(response.data);
      
      // Store tokens and user data securely
      await SecureStorage.saveToken(authResponse.token);
      if (authResponse.refreshToken != null) {
        await SecureStorage.saveRefreshToken(authResponse.refreshToken!);
      }
      await SecureStorage.saveUser(authResponse.user);
      await SecureStorage.saveTenantId(authResponse.user.tenantId);
      
      return authResponse;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }
  
  /// Respond to MFA challenge
  Future<AuthResponse> respondToMfaChallenge({
    required String email,
    required String mfaCode,
    required String session,
  }) async {
    try {
      final response = await _dio.post(
        ApiConfig.respondToChallenge,
        data: {
          'email': email.trim().toLowerCase(),
          'mfaCode': mfaCode,
          'session': session,
        },
      );
      
      final authResponse = AuthResponse.fromJson(response.data);
      
      // Store tokens
      await SecureStorage.saveToken(authResponse.token);
      if (authResponse.refreshToken != null) {
        await SecureStorage.saveRefreshToken(authResponse.refreshToken!);
      }
      await SecureStorage.saveUser(authResponse.user);
      
      return authResponse;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }
  
  // ============================================================
  // Sign Up
  // ============================================================
  
  /// Sign up new user
  /// Throws [AuthException] on failure
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
          'name': name.trim(),
          'email': email.trim().toLowerCase(),
          'password': password,
          if (phone != null && phone.isNotEmpty) 'phone': phone,
        },
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }
  
  // ============================================================
  // Email Verification
  // ============================================================
  
  /// Verify email with code
  Future<void> verifyEmail({
    required String email,
    required String code,
  }) async {
    try {
      await _dio.post(
        ApiConfig.verifyEmail,
        data: {
          'email': email.trim().toLowerCase(),
          'code': code.trim(),
        },
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }
  
  /// Resend verification code
  Future<void> resendVerificationCode(String email) async {
    // The backend may have a specific endpoint for this
    // For now, we can trigger it through forgot-password or a dedicated endpoint
    try {
      await _dio.post(
        '/auth/resend-verification',
        data: {'email': email.trim().toLowerCase()},
      );
    } on DioException catch (e) {
      // If endpoint doesn't exist, silently fail
      // The user can request a new code through sign-up flow
      print('Resend verification not available: ${e.message}');
    }
  }
  
  // ============================================================
  // Password Reset
  // ============================================================
  
  /// Request password reset email
  Future<void> forgotPassword(String email) async {
    try {
      await _dio.post(
        ApiConfig.forgotPassword,
        data: {'email': email.trim().toLowerCase()},
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }
  
  /// Reset password with verification code
  Future<void> resetPassword({
    required String email,
    required String code,
    required String newPassword,
  }) async {
    try {
      await _dio.post(
        ApiConfig.resetPassword,
        data: {
          'email': email.trim().toLowerCase(),
          'code': code.trim(),
          'newPassword': newPassword,
        },
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }
  
  // ============================================================
  // Token Management
  // ============================================================
  
  /// Refresh access token
  Future<String?> refreshToken() async {
    try {
      final refreshToken = await SecureStorage.getRefreshToken();
      final user = await SecureStorage.getUser();
      
      if (refreshToken == null || user == null) {
        return null;
      }
      
      final response = await _dio.post(
        ApiConfig.refreshToken,
        data: {
          'email': user.email,
          'refreshToken': refreshToken,
        },
      );
      
      final newToken = response.data['AccessToken'] ?? response.data['token'];
      if (newToken != null) {
        await SecureStorage.saveToken(newToken);
        return newToken;
      }
      
      return null;
    } catch (e) {
      return null;
    }
  }
  
  // ============================================================
  // Session Management
  // ============================================================
  
  /// Sign out and clear all stored data
  Future<void> signOut() async {
    await SecureStorage.clearAll();
    ApiClient.reset(); // Reset HTTP client
  }
  
  /// Check if user is authenticated
  Future<bool> isAuthenticated() async {
    return await SecureStorage.isLoggedIn();
  }
  
  /// Get current user
  Future<UserModel?> getCurrentUser() async {
    return await SecureStorage.getUser();
  }
  
  // ============================================================
  // Error Handling
  // ============================================================
  
  AuthException _handleDioError(DioException e) {
    if (e.response != null) {
      final data = e.response!.data;
      final statusCode = e.response!.statusCode;
      
      String message = 'An error occurred';
      String? code;
      
      if (data is Map) {
        message = data['message'] ?? data['error'] ?? message;
        code = data['code'];
        
        // Handle specific error codes
        if (code == 'TENANT_MISMATCH') {
          message = 'You do not have access to this application. Please contact support.';
        }
      }
      
      return AuthException(
        message: message,
        statusCode: statusCode,
        code: code,
      );
    }
    
    // Network errors
    if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.sendTimeout ||
        e.type == DioExceptionType.receiveTimeout) {
      return AuthException(
        message: 'Connection timed out. Please check your internet connection.',
        statusCode: null,
        code: 'TIMEOUT',
      );
    }
    
    if (e.type == DioExceptionType.connectionError) {
      return AuthException(
        message: 'Unable to connect to server. Please check your internet connection.',
        statusCode: null,
        code: 'CONNECTION_ERROR',
      );
    }
    
    return AuthException(
      message: e.message ?? 'An unexpected error occurred',
      statusCode: null,
      code: 'UNKNOWN',
    );
  }
}

/// Exception for authentication errors
class AuthException implements Exception {
  final String message;
  final int? statusCode;
  final String? code;
  
  AuthException({
    required this.message,
    this.statusCode,
    this.code,
  });
  
  @override
  String toString() => message;
  
  /// Check if error is due to invalid credentials
  bool get isInvalidCredentials => statusCode == 401;
  
  /// Check if error is due to user not found
  bool get isUserNotFound => statusCode == 404;
  
  /// Check if error is due to network issues
  bool get isNetworkError => code == 'TIMEOUT' || code == 'CONNECTION_ERROR';
}

/// Exception when MFA is required
class MfaRequiredException implements Exception {
  final String challengeName;
  final String session;
  
  MfaRequiredException({
    required this.challengeName,
    required this.session,
  });
  
  @override
  String toString() => 'MFA verification required';
}
