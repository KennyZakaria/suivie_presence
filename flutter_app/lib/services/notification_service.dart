import '../constants/api_constants.dart';
import '../models/notification_model.dart';
import 'api_service.dart';

class NotificationService {
  final _api = ApiService();

  Future<List<NotificationModel>> getNotifications() async {
    final res = await _api.get(ApiConstants.notifications);
    return (res as List).map((e) => NotificationModel.fromJson(e)).toList();
  }

  Future<void> markRead(String id) async {
    await _api.put(ApiConstants.markNotifRead(id), {});
  }

  Future<void> markAllRead() async {
    await _api.put(ApiConstants.markAllRead, {});
  }
}
