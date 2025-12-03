/// User Model for MedChat Mobile App
/// 
/// Represents a user in the multi-tenant system.
/// Maps to the backend user response structure.

class UserModel {
  final int id;
  final String email;
  final String name;
  final String tenantId;
  final String? phone;
  final String? avatarUrl;
  
  UserModel({
    required this.id,
    required this.email,
    required this.name,
    required this.tenantId,
    this.phone,
    this.avatarUrl,
  });
  
  /// Create from JSON (API response)
  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      email: json['email'] ?? '',
      name: json['name'] ?? '',
      tenantId: json['tenant_id'] ?? json['tenantId'] ?? '',
      phone: json['phone'],
      avatarUrl: json['avatar_url'] ?? json['avatarUrl'],
    );
  }
  
  /// Convert to JSON (for storage)
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'name': name,
      'tenant_id': tenantId,
      'phone': phone,
      'avatar_url': avatarUrl,
    };
  }
  
  /// Create a copy with updated fields
  UserModel copyWith({
    int? id,
    String? email,
    String? name,
    String? tenantId,
    String? phone,
    String? avatarUrl,
  }) {
    return UserModel(
      id: id ?? this.id,
      email: email ?? this.email,
      name: name ?? this.name,
      tenantId: tenantId ?? this.tenantId,
      phone: phone ?? this.phone,
      avatarUrl: avatarUrl ?? this.avatarUrl,
    );
  }
  
  /// Get display name (first name or full name)
  String get displayName {
    final parts = name.split(' ');
    return parts.isNotEmpty ? parts.first : name;
  }
  
  /// Get initials for avatar
  String get initials {
    final parts = name.split(' ').where((p) => p.isNotEmpty).toList();
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts[0][0].toUpperCase();
    return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
  }
  
  @override
  String toString() => 'UserModel(id: $id, email: $email, name: $name)';
  
  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is UserModel && other.id == id && other.email == email;
  }
  
  @override
  int get hashCode => id.hashCode ^ email.hashCode;
}
