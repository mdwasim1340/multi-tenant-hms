/// Auth Response Models for MedChat Mobile App
/// 
/// Models for authentication API responses including:
/// - Sign in response with tokens and user data
/// - Roles and permissions

import 'user_model.dart';

/// Response from /auth/signin endpoint
class AuthResponse {
  final String token;
  final String? refreshToken;
  final int? expiresIn;
  final UserModel user;
  final List<Role> roles;
  final List<Permission> permissions;
  final List<AccessibleApplication> accessibleApplications;
  
  AuthResponse({
    required this.token,
    this.refreshToken,
    this.expiresIn,
    required this.user,
    this.roles = const [],
    this.permissions = const [],
    this.accessibleApplications = const [],
  });
  
  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      token: json['token'] ?? '',
      refreshToken: json['refreshToken'],
      expiresIn: json['expiresIn'],
      user: UserModel.fromJson(json['user'] ?? {}),
      roles: (json['roles'] as List?)
          ?.map((r) => Role.fromJson(r))
          .toList() ?? [],
      permissions: (json['permissions'] as List?)
          ?.map((p) => Permission.fromJson(p))
          .toList() ?? [],
      accessibleApplications: (json['accessibleApplications'] as List?)
          ?.map((a) => AccessibleApplication.fromJson(a))
          .toList() ?? [],
    );
  }
  
  /// Check if user has a specific permission
  bool hasPermission(String resource, String action) {
    return permissions.any(
      (p) => p.resource == resource && p.action == action,
    );
  }
  
  /// Check if user has a specific role
  bool hasRole(String roleName) {
    return roles.any((r) => r.name.toLowerCase() == roleName.toLowerCase());
  }
}

/// User role in the system
class Role {
  final int id;
  final String name;
  final String? description;
  
  Role({
    required this.id,
    required this.name,
    this.description,
  });
  
  factory Role.fromJson(Map<String, dynamic> json) {
    return Role(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      name: json['name'] ?? '',
      description: json['description'],
    );
  }
  
  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'description': description,
  };
}

/// Permission for resource access
class Permission {
  final String resource;
  final String action;
  
  Permission({
    required this.resource,
    required this.action,
  });
  
  factory Permission.fromJson(Map<String, dynamic> json) {
    return Permission(
      resource: json['resource'] ?? '',
      action: json['action'] ?? '',
    );
  }
  
  Map<String, dynamic> toJson() => {
    'resource': resource,
    'action': action,
  };
  
  /// Permission string format: "resource:action"
  String get permissionString => '$resource:$action';
}

/// Accessible application for the user
class AccessibleApplication {
  final String applicationId;
  final String name;
  final bool hasAccess;
  final List<String> requiredPermissions;
  
  AccessibleApplication({
    required this.applicationId,
    required this.name,
    required this.hasAccess,
    this.requiredPermissions = const [],
  });
  
  factory AccessibleApplication.fromJson(Map<String, dynamic> json) {
    return AccessibleApplication(
      applicationId: json['application_id'] ?? json['applicationId'] ?? '',
      name: json['name'] ?? '',
      hasAccess: json['has_access'] ?? json['hasAccess'] ?? false,
      requiredPermissions: (json['required_permissions'] as List?)
          ?.map((p) => p.toString())
          .toList() ?? [],
    );
  }
}

/// MFA Challenge response (when MFA is required)
class MfaChallengeResponse {
  final String challengeName;
  final String session;
  
  MfaChallengeResponse({
    required this.challengeName,
    required this.session,
  });
  
  factory MfaChallengeResponse.fromJson(Map<String, dynamic> json) {
    return MfaChallengeResponse(
      challengeName: json['ChallengeName'] ?? '',
      session: json['Session'] ?? '',
    );
  }
  
  bool get isMfaRequired => challengeName.isNotEmpty;
}
