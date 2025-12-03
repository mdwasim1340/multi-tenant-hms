/// HTTP Client for MedChat Mobile App
/// 
/// Configures Dio HTTP client with interceptors for:
/// - Authentication (JWT token injection)
/// - Multi-tenant headers
/// - Error handling
/// - Request/Response logging

import 'dart:io';
import 'package:dio/dio.dart';
import '../config/api_config.dart';
import '../storage/secure_storage.dart';

/// Singleton API client instance
class ApiClient {
  static Dio? _dio;
  
  /// Get the configured Dio instance
  static Dio get instance {
    _dio ??= _createDio();
    return _dio!;
  }
  
  /// Reset the client (useful for logout)
  static void reset() {
    _dio = null;
  }
  
  /// Create and configure Dio instance
  static Dio _createDio() {
    final dio = Dio(BaseOptions(
      baseUrl: ApiConfig.baseUrl,
      connectTimeout: ApiConfig.connectTimeout,
      receiveTimeout: ApiConfig.receiveTimeout,
      sendTimeout: ApiConfig.sendTimeout,
      headers: ApiConfig.defaultHeaders,
      validateStatus: (status) => status != null && status < 500,
    ));
    
    // Add interceptors in order
    dio.interceptors.addAll([
      _AuthInterceptor(),
      _LoggingInterceptor(),
      _ErrorInterceptor(),
    ]);
    
    return dio;
  }
}

/// Interceptor to add authentication token to requests
class _AuthInterceptor extends Interceptor {
  /// Endpoints that don't require authentication
  static const _publicEndpoints = [
    '/auth/signin',
    '/auth/signup',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/verify-email',
    '/tenants/by-subdomain/',
  ];
  
  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    // Skip auth header for public endpoints
    if (_isPublicEndpoint(options.path)) {
      return handler.next(options);
    }
    
    // Add JWT token if available
    final token = await SecureStorage.getToken();
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    
    return handler.next(options);
  }
  
  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    // Handle 401 Unauthorized - token expired
    if (err.response?.statusCode == 401) {
      // Try to refresh token
      final refreshed = await _tryRefreshToken();
      if (refreshed) {
        // Retry the original request
        try {
          final response = await _retryRequest(err.requestOptions);
          return handler.resolve(response);
        } catch (e) {
          // Refresh failed, clear tokens
          await SecureStorage.clearAll();
        }
      }
    }
    
    return handler.next(err);
  }
  
  bool _isPublicEndpoint(String path) {
    return _publicEndpoints.any((endpoint) => path.contains(endpoint));
  }
  
  Future<bool> _tryRefreshToken() async {
    try {
      final refreshToken = await SecureStorage.getRefreshToken();
      final user = await SecureStorage.getUser();
      
      if (refreshToken == null || user == null) return false;
      
      final response = await Dio().post(
        '${ApiConfig.baseUrl}${ApiConfig.refreshToken}',
        data: {
          'email': user.email,
          'refreshToken': refreshToken,
        },
        options: Options(headers: ApiConfig.defaultHeaders),
      );
      
      if (response.statusCode == 200) {
        final newToken = response.data['AccessToken'] ?? response.data['token'];
        if (newToken != null) {
          await SecureStorage.saveToken(newToken);
          return true;
        }
      }
      
      return false;
    } catch (e) {
      return false;
    }
  }
  
  Future<Response> _retryRequest(RequestOptions options) async {
    final token = await SecureStorage.getToken();
    options.headers['Authorization'] = 'Bearer $token';
    return ApiClient.instance.fetch(options);
  }
}

/// Interceptor for logging requests and responses (debug only)
class _LoggingInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    _log('🚀 REQUEST[${options.method}] => ${options.uri}');
    _log('Headers: ${_sanitizeHeaders(options.headers)}');
    if (options.data != null) {
      _log('Body: ${_sanitizeBody(options.data)}');
    }
    handler.next(options);
  }
  
  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    _log('✅ RESPONSE[${response.statusCode}] <= ${response.requestOptions.uri}');
    handler.next(response);
  }
  
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    _log('❌ ERROR[${err.response?.statusCode}] => ${err.requestOptions.uri}');
    _log('Message: ${err.message}');
    handler.next(err);
  }
  
  void _log(String message) {
    // Only log in debug mode
    assert(() {
      print('[API] $message');
      return true;
    }());
  }
  
  Map<String, dynamic> _sanitizeHeaders(Map<String, dynamic> headers) {
    final sanitized = Map<String, dynamic>.from(headers);
    // Hide sensitive headers
    if (sanitized.containsKey('Authorization')) {
      sanitized['Authorization'] = 'Bearer ***';
    }
    if (sanitized.containsKey('X-API-Key')) {
      sanitized['X-API-Key'] = '***';
    }
    return sanitized;
  }
  
  dynamic _sanitizeBody(dynamic body) {
    if (body is Map) {
      final sanitized = Map<String, dynamic>.from(body);
      // Hide password fields
      if (sanitized.containsKey('password')) {
        sanitized['password'] = '***';
      }
      if (sanitized.containsKey('newPassword')) {
        sanitized['newPassword'] = '***';
      }
      return sanitized;
    }
    return body;
  }
}

/// Interceptor for handling errors
class _ErrorInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    // Transform network errors into user-friendly messages
    if (err.type == DioExceptionType.connectionTimeout ||
        err.type == DioExceptionType.sendTimeout ||
        err.type == DioExceptionType.receiveTimeout) {
      err = DioException(
        requestOptions: err.requestOptions,
        error: 'Connection timed out. Please check your internet connection.',
        type: err.type,
      );
    } else if (err.type == DioExceptionType.connectionError) {
      err = DioException(
        requestOptions: err.requestOptions,
        error: 'Unable to connect to server. Please check your internet connection.',
        type: err.type,
      );
    }
    
    handler.next(err);
  }
}

/// Custom exception for API errors
class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final String? code;
  final dynamic data;
  
  ApiException({
    required this.message,
    this.statusCode,
    this.code,
    this.data,
  });
  
  factory ApiException.fromDioError(DioException error) {
    String message = 'An unexpected error occurred';
    String? code;
    
    if (error.response != null) {
      final data = error.response!.data;
      if (data is Map) {
        message = data['message'] ?? data['error'] ?? message;
        code = data['code'];
      }
    } else if (error.error != null) {
      message = error.error.toString();
    }
    
    return ApiException(
      message: message,
      statusCode: error.response?.statusCode,
      code: code,
      data: error.response?.data,
    );
  }
  
  @override
  String toString() => message;
}
