class UserModel {
  final String id;
  final String email;
  final String fullName;
  final String role;
  final String? phone;
  final String? profileImageUrl;
  final List<String> classIds;
  final bool isActive;
  final bool mustChangePassword;
  final String? fcmToken;
  final String? createdAt;

  UserModel({
    required this.id,
    required this.email,
    required this.fullName,
    required this.role,
    this.phone,
    this.profileImageUrl,
    this.classIds = const [],
    this.isActive = true,
    this.mustChangePassword = false,
    this.fcmToken,
    this.createdAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) => UserModel(
        id: json['id'] ?? '',
        email: json['email'] ?? '',
        fullName: json['full_name'] ?? '',
        role: json['role'] ?? '',
        phone: json['phone'],
        profileImageUrl: json['profile_image_url'],
        classIds: List<String>.from(json['class_ids'] ?? []),
        isActive: json['is_active'] ?? true,
        mustChangePassword: json['must_change_password'] ?? false,
        fcmToken: json['fcm_token'],
        createdAt: json['created_at'],
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'full_name': fullName,
        'role': role,
        'phone': phone,
        'profile_image_url': profileImageUrl,
        'class_ids': classIds,
        'is_active': isActive,
        'must_change_password': mustChangePassword,
        'fcm_token': fcmToken,
        'created_at': createdAt,
      };

  UserModel copyWith({
    String? id, String? email, String? fullName, String? role,
    String? phone, String? profileImageUrl, List<String>? classIds,
    bool? isActive, bool? mustChangePassword, String? fcmToken,
  }) =>
      UserModel(
        id: id ?? this.id,
        email: email ?? this.email,
        fullName: fullName ?? this.fullName,
        role: role ?? this.role,
        phone: phone ?? this.phone,
        profileImageUrl: profileImageUrl ?? this.profileImageUrl,
        classIds: classIds ?? this.classIds,
        isActive: isActive ?? this.isActive,
        mustChangePassword: mustChangePassword ?? this.mustChangePassword,
        fcmToken: fcmToken ?? this.fcmToken,
        createdAt: createdAt,
      );

  bool get isTeacher => role == 'teacher';
  bool get isStudent => role == 'student';
  bool get isAdmin => role == 'admin';

  String get initials {
    final parts = fullName.trim().split(' ');
    if (parts.length >= 2) return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    return fullName.isNotEmpty ? fullName[0].toUpperCase() : '?';
  }
}
