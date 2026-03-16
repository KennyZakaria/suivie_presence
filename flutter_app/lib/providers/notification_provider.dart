import 'package:flutter/foundation.dart';
import '../models/notification_model.dart';
import '../services/notification_service.dart';

class NotificationProvider extends ChangeNotifier {
  List<NotificationModel> _notifications = [];
  bool _isLoading = false;

  List<NotificationModel> get notifications => _notifications;
  bool get isLoading => _isLoading;
  int get unreadCount => _notifications.where((n) => !n.isRead).length;

  final _service = NotificationService();

  Future<void> fetchNotifications() async {
    _isLoading = true;
    notifyListeners();
    try {
      _notifications = await _service.getNotifications();
    } catch (_) {}
    finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> markRead(String id) async {
    await _service.markRead(id);
    _notifications = _notifications
        .map((n) => n.id == id ? NotificationModel(
              id: n.id, userId: n.userId, title: n.title,
              body: n.body, data: n.data, isRead: true, createdAt: n.createdAt)
            : n)
        .toList();
    notifyListeners();
  }

  Future<void> markAllRead() async {
    await _service.markAllRead();
    _notifications = _notifications
        .map((n) => NotificationModel(
              id: n.id, userId: n.userId, title: n.title,
              body: n.body, data: n.data, isRead: true, createdAt: n.createdAt))
        .toList();
    notifyListeners();
  }
}
