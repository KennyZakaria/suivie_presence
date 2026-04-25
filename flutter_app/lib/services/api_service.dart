import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../constants/api_constants.dart';
import '../main.dart';
import '../utils/secure_storage.dart';

const _kTimeout = Duration(seconds: 30);

class ApiException implements Exception {
  final String message;
  final int? statusCode;
  ApiException(this.message, {this.statusCode});
  @override
  String toString() => message;
}

class ApiService {
  Future<Map<String, String>> _headers({bool auth = true}) async {
    final headers = <String, String>{'Content-Type': 'application/json'};
    if (auth) {
      final token = await SecureStorage.getToken();
      if (token != null) headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  Uri _uri(String path, [Map<String, dynamic>? queryParams]) {
    final uri = Uri.parse('${ApiConstants.baseUrl}$path');
    if (queryParams != null && queryParams.isNotEmpty) {
      return uri.replace(
          queryParameters:
              queryParams.map((k, v) => MapEntry(k, v.toString())));
    }
    return uri;
  }

  dynamic _handle(http.Response res) {
    if (res.statusCode == 401) {
      SecureStorage.clear();
      navigatorKey.currentState
          ?.pushNamedAndRemoveUntil('/login', (_) => false);
      throw ApiException('Session expired. Please log in again.',
          statusCode: 401);
    }
    final body = jsonDecode(res.body);
    if (res.statusCode >= 200 && res.statusCode < 300) return body;
    final detail =
        body is Map ? (body['detail'] ?? 'Request failed') : 'Request failed';
    throw ApiException(detail.toString(), statusCode: res.statusCode);
  }

  Future<dynamic> get(String path,
      {Map<String, dynamic>? query, bool auth = true}) async {
    final res = await http
        .get(_uri(path, query), headers: await _headers(auth: auth))
        .timeout(_kTimeout);
    return _handle(res);
  }

  Future<dynamic> post(String path, Map<String, dynamic> body,
      {bool auth = true}) async {
    final res = await http
        .post(_uri(path),
            headers: await _headers(auth: auth), body: jsonEncode(body))
        .timeout(_kTimeout);
    return _handle(res);
  }

  Future<dynamic> put(String path, Map<String, dynamic> body,
      {bool auth = true}) async {
    final res = await http
        .put(_uri(path),
            headers: await _headers(auth: auth), body: jsonEncode(body))
        .timeout(_kTimeout);
    return _handle(res);
  }

  Future<dynamic> delete(String path, {bool auth = true}) async {
    final res = await http
        .delete(_uri(path), headers: await _headers(auth: auth))
        .timeout(_kTimeout);
    return _handle(res);
  }

  dynamic _handleStreamed(http.StreamedResponse res, String body) {
    if (res.statusCode == 401) {
      SecureStorage.clear();
      navigatorKey.currentState
          ?.pushNamedAndRemoveUntil('/login', (_) => false);
      throw ApiException('Session expired. Please log in again.',
          statusCode: 401);
    }
    final decoded = jsonDecode(body);
    if (res.statusCode >= 200 && res.statusCode < 300) return decoded;
    final detail = decoded is Map
        ? (decoded['detail'] ?? 'Request failed')
        : 'Request failed';
    throw ApiException(detail.toString(), statusCode: res.statusCode);
  }

  Future<dynamic> multipart(
    String path, {
    required Map<String, String> fields,
    List<int>? fileBytes,
    String? fileName,
    String fileField = 'document',
  }) async {
    final request = http.MultipartRequest('POST', _uri(path));
    final token = await SecureStorage.getToken();
    if (token != null) request.headers['Authorization'] = 'Bearer $token';
    request.fields.addAll(fields);
    if (fileBytes != null) {
      request.files.add(http.MultipartFile.fromBytes(
        fileField,
        fileBytes,
        filename: fileName ?? 'document.jpg',
      ));
    }
    final streamed = await request.send().timeout(const Duration(seconds: 30));
    final body = await streamed.stream.bytesToString();
    return _handleStreamed(streamed, body);
  }
}
