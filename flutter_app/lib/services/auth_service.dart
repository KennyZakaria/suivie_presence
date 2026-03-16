import '../constants/api_constants.dart';
import '../models/user.dart';
import 'api_service.dart';

class AuthService {
  final _api = ApiService();

  Future<Map<String, dynamic>> login(String email, String password) async {
    final res = await _api.post(
      ApiConstants.login,
      {'email': email, 'password': password},
      auth: false,
    );
    return res as Map<String, dynamic>;
  }

  Future<UserModel> getMe() async {
    final res = await _api.get(ApiConstants.me);
    return UserModel.fromJson(res as Map<String, dynamic>);
  }

  Future<void> changePassword(String oldPassword, String newPassword) async {
    await _api.post(ApiConstants.changePassword, {
      'old_password': oldPassword,
      'new_password': newPassword,
    });
  }

  Future<void> forceChangePassword(String newPassword) async {
    await _api.post(ApiConstants.forceChangePassword, {'new_password': newPassword});
  }

  Future<void> updateFcmToken(String token) async {
    await _api.put(ApiConstants.fcmToken, {'fcm_token': token});
  }
}
