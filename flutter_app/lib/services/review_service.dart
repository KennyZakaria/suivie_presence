import '../constants/api_constants.dart';
import '../models/review.dart';
import 'api_service.dart';

class ReviewService {
  final _api = ApiService();

  /// Teacher creates a positive or negative comment about a student.
  Future<Review> createComment({
    required String studentId,
    required String classId,
    required String sentiment, // 'positive' | 'negative'
    required String title,
    required String description,
    required String date,
  }) async {
    final res = await _api.post(ApiConstants.reviewComment, {
      'student_id': studentId,
      'class_id': classId,
      'sentiment': sentiment,
      'title': title,
      'description': description,
      'date': date,
    });
    return Review.fromJson(res as Map<String, dynamic>);
  }

  Future<List<Review>> getMyReviews() async {
    final res = await _api.get(ApiConstants.reviews);
    return (res as List).map((e) => Review.fromJson(e)).toList();
  }

  Future<List<Review>> getStudentReviews(String studentId) async {
    final res = await _api.get(ApiConstants.reviewsByStudent(studentId));
    return (res as List).map((e) => Review.fromJson(e)).toList();
  }
}
