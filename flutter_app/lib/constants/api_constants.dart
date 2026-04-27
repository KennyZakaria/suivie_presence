class ApiConstants {
  // Change this to your backend URL
  // Android emulator: http://10.0.2.2:8001/api/v1
  // iOS simulator:    http://localhost:8001/api/v1
  // Physical device:  http://<your-local-ip>:8001/api/v1
  //static const String baseUrl = 'http://localhost:8000/api/v1';
  static const String baseUrl = "https://suivie-presence.onrender.com/api/v1";
  // Auth
  static const String login = '/auth/login';
  static const String logout = '/auth/logout';
  static const String me = '/auth/me';
  static const String changePassword = '/auth/change-password';
  static const String forceChangePassword = '/auth/force-change-password';
  static const String fcmToken = '/auth/fcm-token';
  static const String acceptTerms = '/auth/accept-terms';

  // Classes
  static const String classes = '/classes';
  static String classById(String id) => '/classes/$id';
  static String classStudents(String id) => '/classes/$id/students';

  // Attendance
  static const String attendanceBulk = '/attendance/bulk';
  static String attendanceByClass(String classId) =>
      '/attendance/class/$classId';
  static String attendanceByStudent(String studentId) =>
      '/attendance/student/$studentId';
  static String attendanceSummary(String studentId) =>
      '/attendance/student/$studentId/summary';
  static String attendanceRecord(String recordId) => '/attendance/$recordId';

  // Reviews
  static const String reviews = '/reviews';
  static const String reviewComment = '/reviews/comment';
  static const String reviewConseilDiscipline = '/reviews/conseil-discipline';
  static String reviewsByStudent(String studentId) =>
      '/reviews/student/$studentId';
  static String resolveReview(String reviewId) => '/reviews/$reviewId/resolve';

  // Notifications
  static const String notifications = '/notifications';
  static String markNotifRead(String id) => '/notifications/$id/read';
  static const String markAllRead = '/notifications/read-all';

  // Justifications
  static const String justifications = '/justifications';
  static const String myJustifications = '/justifications/my';
  static String studentJustifications(String studentId) =>
      '/justifications/student/$studentId';
}
