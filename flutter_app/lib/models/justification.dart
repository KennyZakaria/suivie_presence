import 'package:flutter/material.dart';

enum JustificationStatus { pending, accepted, rejected }

extension JustificationStatusExt on JustificationStatus {
  String get value {
    switch (this) {
      case JustificationStatus.pending:
        return 'pending';
      case JustificationStatus.accepted:
        return 'accepted';
      case JustificationStatus.rejected:
        return 'rejected';
    }
  }

  String get label {
    switch (this) {
      case JustificationStatus.pending:
        return 'En attente';
      case JustificationStatus.accepted:
        return 'Acceptée';
      case JustificationStatus.rejected:
        return 'Rejetée';
    }
  }

  Color get color {
    switch (this) {
      case JustificationStatus.pending:
        return const Color(0xFFF59E0B);
      case JustificationStatus.accepted:
        return const Color(0xFF22C55E);
      case JustificationStatus.rejected:
        return const Color(0xFFEF4444);
    }
  }

  Color get bgColor {
    switch (this) {
      case JustificationStatus.pending:
        return const Color(0xFFFEF3C7);
      case JustificationStatus.accepted:
        return const Color(0xFFDCFCE7);
      case JustificationStatus.rejected:
        return const Color(0xFFFEE2E2);
    }
  }

  IconData get icon {
    switch (this) {
      case JustificationStatus.pending:
        return Icons.hourglass_empty;
      case JustificationStatus.accepted:
        return Icons.check_circle_outline;
      case JustificationStatus.rejected:
        return Icons.cancel_outlined;
    }
  }

  static JustificationStatus fromString(String s) {
    switch (s) {
      case 'accepted':
        return JustificationStatus.accepted;
      case 'rejected':
        return JustificationStatus.rejected;
      default:
        return JustificationStatus.pending;
    }
  }
}

class Justification {
  final String id;
  final String studentId;
  final String attendanceId;
  final String reason;
  final String? documentUrl;
  final JustificationStatus status;
  final String? adminComment;
  final String? createdAt;
  final String? reviewedAt;
  final String? date;
  final String? classId;
  final String? studentName;

  Justification({
    required this.id,
    required this.studentId,
    required this.attendanceId,
    required this.reason,
    this.documentUrl,
    required this.status,
    this.adminComment,
    this.createdAt,
    this.reviewedAt,
    this.date,
    this.classId,
    this.studentName,
  });

  factory Justification.fromJson(Map<String, dynamic> json) => Justification(
        id: json['id'] ?? '',
        studentId: json['student_id'] ?? '',
        attendanceId: json['attendance_id'] ?? '',
        reason: json['reason'] ?? '',
        documentUrl: json['document_url'],
        status: JustificationStatusExt.fromString(json['status'] ?? 'pending'),
        adminComment: json['admin_comment'],
        createdAt: json['created_at'],
        reviewedAt: json['reviewed_at'],
        date: json['date'],
        classId: json['class_id'],
        studentName: json['student_name'],
      );
}
