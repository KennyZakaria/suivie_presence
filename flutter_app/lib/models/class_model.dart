class ClassModel {
  final String id;
  final String name;
  final String subject;
  final String grade;
  final String? teacherId;
  final List<String> studentIds;
  final Map<String, dynamic> schedule;
  final bool isActive;
  final String? createdAt;

  ClassModel({
    required this.id,
    required this.name,
    required this.subject,
    required this.grade,
    this.teacherId,
    this.studentIds = const [],
    this.schedule = const {},
    this.isActive = true,
    this.createdAt,
  });

  factory ClassModel.fromJson(Map<String, dynamic> json) => ClassModel(
        id: json['id'] ?? '',
        name: json['name'] ?? '',
        subject: json['subject'] ?? '',
        grade: json['grade'] ?? '',
        teacherId: json['teacher_id'],
        studentIds: List<String>.from(json['student_ids'] ?? []),
        schedule: Map<String, dynamic>.from(json['schedule'] ?? {}),
        isActive: json['is_active'] ?? true,
        createdAt: json['created_at'],
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'subject': subject,
        'grade': grade,
        'teacher_id': teacherId,
        'student_ids': studentIds,
        'schedule': schedule,
        'is_active': isActive,
        'created_at': createdAt,
      };

  int get studentCount => studentIds.length;
}
