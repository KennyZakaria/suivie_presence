import 'package:shared_preferences/shared_preferences.dart';

class SecureStorage {
  static const _tokenKey = 'auth_token';
  static const _userKey = 'auth_user';
  static const _sessionKey = 'session_id';
  static const _termsAcceptedPrefix = 'terms_accepted_';

  static Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  static Future<void> saveSessionId(String sessionId) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_sessionKey, sessionId);
  }

  static Future<String?> getSessionId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_sessionKey);
  }

  static Future<void> saveUser(String userJson) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_userKey, userJson);
  }

  static Future<String?> getUser() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_userKey);
  }

  static Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userKey);
    await prefs.remove(_sessionKey);
  }

  // --- Terms Acceptance ---
  static Future<bool> hasAcceptedTerms(String userId) async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool('$_termsAcceptedPrefix$userId') ?? false;
  }

  static Future<void> setTermsAccepted(String userId) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('$_termsAcceptedPrefix$userId', true);
  }
}
