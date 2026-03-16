import '../constants/api_constants.dart';
import '../models/attendance.dart';
import 'api_service.dart';

class AttendanceService {
  final _api = ApiService();

  Future<List<AttendanceRecord>> bulkMarkAttendance({
    required String classId,
    required String date,
    required List<BulkAttendanceEntry> records,
  }) async {
    final res = await _api.post(ApiConstants.attendanceBulk, {
      'class_id': classId,
      'date': date,
      'records': records.map((r) => r.toJson()).toList(),
    });
    return (res as List).map((e) => AttendanceRecord.fromJson(e)).toList();
  }

  Future<List<AttendanceRecord>> getClassAttendance(String classId, String date) async {
    final res = await _api.get(ApiConstants.attendanceByClass(classId), query: {'date': date});
    return (res as List).map((e) => AttendanceRecord.fromJson(e)).toList();
  }

  Future<List<AttendanceRecord>> getStudentAttendance(String studentId,
      {String? startDate, String? endDate}) async {
    final query = <String, dynamic>{};
    if (startDate != null) query['start_date'] = startDate;
    if (endDate != null) query['end_date'] = endDate;
    final res = await _api.get(ApiConstants.attendanceByStudent(studentId),
        query: query.isEmpty ? null : query);
    return (res as List).map((e) => AttendanceRecord.fromJson(e)).toList();
  }

  Future<AttendanceSummary> getStudentSummary(String studentId) async {
    final res = await _api.get(ApiConstants.attendanceSummary(studentId));
    return AttendanceSummary.fromJson(res as Map<String, dynamic>);
  }
}
