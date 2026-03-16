import '../constants/api_constants.dart';
import '../models/justification.dart';
import 'api_service.dart';

class JustificationService {
  final _api = ApiService();

  Future<Justification> submitJustification({
    required String attendanceId,
    required String reason,
    List<int>? fileBytes,
    String? fileName,
  }) async {
    final res = await _api.multipart(
      ApiConstants.justifications,
      fields: {
        'attendance_id': attendanceId,
        'reason': reason,
      },
      fileBytes: fileBytes,
      fileName: fileName,
    );
    return Justification.fromJson(res as Map<String, dynamic>);
  }

  Future<List<Justification>> getMyJustifications() async {
    final res = await _api.get(ApiConstants.myJustifications);
    return (res as List)
        .map((e) => Justification.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<Justification>> getStudentJustifications(String studentId) async {
    final res = await _api.get(ApiConstants.studentJustifications(studentId));
    return (res as List)
        .map((e) => Justification.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
