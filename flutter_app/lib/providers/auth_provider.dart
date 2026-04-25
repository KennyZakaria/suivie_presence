import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import '../models/user.dart';
import '../services/auth_service.dart';
import '../utils/secure_storage.dart';

class AuthProvider extends ChangeNotifier {
  UserModel? _user;
  String? _token;
  bool _isLoading = false;
  String? _error;

  UserModel? get user => _user;
  String? get token => _token;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _token != null && _user != null;
  bool get mustChangePassword => _user?.mustChangePassword ?? false;

  final _authService = AuthService();

  Future<void> checkAuthStatus() async {
    final token = await SecureStorage.getToken();
    final userJson = await SecureStorage.getUser();
    if (token != null && userJson != null) {
      if (_isJwtExpired(token)) {
        await SecureStorage.clear();
        notifyListeners();
        return;
      }
      _token = token;
      _user = UserModel.fromJson(jsonDecode(userJson));
      notifyListeners();
    }
  }

  /// Decodes the JWT payload locally and checks the [exp] claim.
  /// Returns true if the token is expired or malformed.
  bool _isJwtExpired(String token) {
    try {
      final parts = token.split('.');
      if (parts.length != 3) return true;
      // Pad base64url to a multiple of 4
      String payload = parts[1];
      switch (payload.length % 4) {
        case 2:
          payload += '==';
          break;
        case 3:
          payload += '=';
          break;
      }
      final decoded = utf8.decode(
        Uint8List.fromList(base64Url.decode(payload)),
      );
      final map = jsonDecode(decoded) as Map<String, dynamic>;
      final exp = map['exp'];
      if (exp == null) return false;
      final expiry =
          DateTime.fromMillisecondsSinceEpoch((exp as int) * 1000, isUtc: true);
      return DateTime.now().toUtc().isAfter(expiry);
    } catch (_) {
      return true;
    }
  }

  Future<void> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await _authService.login(email, password);
      _token = res['access_token'];
      _user = UserModel.fromJson(res['user']);
      await SecureStorage.saveToken(_token!);
      await SecureStorage.saveUser(jsonEncode(_user!.toJson()));
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> refreshUser() async {
    try {
      _user = await _authService.getMe();
      await SecureStorage.saveUser(jsonEncode(_user!.toJson()));
      notifyListeners();
    } catch (_) {}
  }

  void updateMustChangePassword(bool val) {
    if (_user != null) {
      _user = _user!.copyWith(mustChangePassword: val);
      SecureStorage.saveUser(jsonEncode(_user!.toJson()));
      notifyListeners();
    }
  }

  Future<void> logout() async {
    _user = null;
    _token = null;
    _error = null;
    await SecureStorage.clear();
    notifyListeners();
  }
}
