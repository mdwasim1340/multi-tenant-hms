/// Secure Storage for MedChat Mobile App
/// 
/// Handles secure storage of sensitive data like:
/// - JWT authentication tokens
/// - Refresh tokens
/// - User data

import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../features/auth/data/models/user_model.dart';

class SecureStorage {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true,
    ),
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock,
    ),
  );
  
  // Storage keys
  static const _tokenKey = 'medchat_auth_token';
  static const _refreshTokenKey = 'medchat_refresh_token';
  static const _userKey = 'medchat_user_data';
  static const _tenantKey = 'medchat_tenant_id';
  
  // ============================================================
  // Token Operations
  // ============================================================
  
  /// Save JWT access token
  static Future<void> saveToken(String token) async {
    await _storage.write(key: _tokenKey, value: token);
  }
  
  /// Get JWT access token
  static Future<String?> getToken() async {
    return await _storage.read(key: _tokenKey);
  }
  
  /// Delete JWT access token
  static Future<void> deleteToken() async {
    await _storage.delete(key: _tokenKey);
  }
  
  /// Save refresh token
  static Future<void> saveRefreshToken(String token) async {
    await _storage.write(key: _refreshTokenKey, value: token);
  }
  
  /// Get refresh token
  static Future<String?> getRefreshToken() async {
    return await _storage.read(key: _refreshTokenKey);
  }
  
  /// Delete refresh token
  static Future<void> deleteRefreshToken() async {
    await _storage.delete(key: _refreshTokenKey);
  }
  
  // ============================================================
  // User Operations
  // ============================================================
  
  /// Save user data
  static Future<void> saveUser(UserModel user) async {
    final jsonString = jsonEncode(user.toJson());
    await _storage.write(key: _userKey, value: jsonString);
  }
  
  /// Get user data
  static Future<UserModel?> getUser() async {
    final jsonString = await _storage.read(key: _userKey);
    if (jsonString != null && jsonString.isNotEmpty) {
      try {
        final json = jsonDecode(jsonString);
        return UserModel.fromJson(json);
      } catch (e) {
        // Invalid JSON, clear it
        await _storage.delete(key: _userKey);
        return null;
      }
    }
    return null;
  }
  
  /// Delete user data
  static Future<void> deleteUser() async {
    await _storage.delete(key: _userKey);
  }
  
  // ============================================================
  // Tenant Operations
  // ============================================================
  
  /// Save tenant ID (for multi-tenant support)
  static Future<void> saveTenantId(String tenantId) async {
    await _storage.write(key: _tenantKey, value: tenantId);
  }
  
  /// Get tenant ID
  static Future<String?> getTenantId() async {
    return await _storage.read(key: _tenantKey);
  }
  
  // ============================================================
  // Utility Operations
  // ============================================================
  
  /// Clear all stored data (for logout)
  static Future<void> clearAll() async {
    await _storage.deleteAll();
  }
  
  /// Check if user is logged in
  static Future<bool> isLoggedIn() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }
  
  /// Check if token exists and is not expired
  /// Note: This is a basic check. For production, decode JWT and check exp claim.
  static Future<bool> hasValidToken() async {
    final token = await getToken();
    if (token == null || token.isEmpty) return false;
    
    // TODO: Add JWT expiration check
    // final jwt = JwtDecoder.decode(token);
    // return !JwtDecoder.isExpired(token);
    
    return true;
  }
}
