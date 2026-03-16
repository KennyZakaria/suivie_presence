class NotificationModel {
  final String id;
  final String userId;
  final String title;
  final String body;
  final Map<String, dynamic> data;
  final bool isRead;
  final String? createdAt;

  NotificationModel({
    required this.id,
    required this.userId,
    required this.title,
    required this.body,
    this.data = const {},
    this.isRead = false,
    this.createdAt,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) => NotificationModel(
        id: json['id'] ?? '',
        userId: json['user_id'] ?? '',
        title: json['title'] ?? '',
        body: json['body'] ?? '',
        data: Map<String, dynamic>.from(json['data'] ?? {}),
        isRead: json['is_read'] ?? false,
        createdAt: json['created_at'],
      );
}
