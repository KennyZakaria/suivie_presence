import '../constants/api_constants.dart';
import '../models/class_model.dart';
import '../models/user.dart';
import 'api_service.dart';

class ClassService {
  final _api = ApiService();

  Future<List<ClassModel>> getMyClasses() async {
    final res = await _api.get(ApiConstants.classes);
    return (res as List).map((e) => ClassModel.fromJson(e)).toList();
  }

  Future<ClassModel> getClassDetail(String classId) async {
    final res = await _api.get(ApiConstants.classById(classId));
    return ClassModel.fromJson(res as Map<String, dynamic>);
  }

  Future<List<UserModel>> getClassStudents(String classId) async {
    final res = await _api.get(ApiConstants.classStudents(classId));
    return (res as List).map((e) => UserModel.fromJson(e)).toList();
  }
}
