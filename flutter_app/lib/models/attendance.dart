import 'package:flutter/material.dart';

enum AttendanceStatus { present, absent, late }

extension AttendanceStatusExt on AttendanceStatus {
  String get value {
    switch (this) {
      case AttendanceStatus.present:
        return 'present';
      case AttendanceStatus.absent:
        return 'absent';
      case AttendanceStatus.late:
        return 'late';
    }
  }

  String get label {
    switch (this) {
      case AttendanceStatus.present:
        return 'Présent';
      case AttendanceStatus.absent:
        return 'Absent';
      case AttendanceStatus.late:
        return 'En retard';
    }
  }

  Color get color {
    switch (this) {
      case AttendanceStatus.present:
        return const Color(0xFF22C55E);
      case AttendanceStatus.absent:
        return const Color(0xFFEF4444);
      case AttendanceStatus.late:
        return const Color(0xFFF97316);
    }
  }

  Color get bgColor {
    switch (this) {
      case AttendanceStatus.present:
        return const Color(0xFFDCFCE7);
      case AttendanceStatus.absent:
        return const Color(0xFFFEE2E2);
      case AttendanceStatus.late:
        return const Color(0xFFFFEDD5);
    }
  }

  static AttendanceStatus fromString(String s) {
    switch (s) {
      case 'present':
        return AttendanceStatus.present;
      case 'absent':
        return AttendanceStatus.absent;
      case 'late':
        return AttendanceStatus.late;
      default:
        return AttendanceStatus.present;
    }
  }
}

class AttendanceRecord {
  final String id;
  final String classId;
  final String studentId;
  final String teacherId;
  final String date;
  final AttendanceStatus status;
  final String? notes;
  final String? createdAt;
  final bool justified;

  AttendanceRecord({
    required this.id,
    required this.classId,
    required this.studentId,
    required this.teacherId,
    required this.date,
    required this.status,
    this.notes,
    this.createdAt,
    this.justified = false,
  });

  factory AttendanceRecord.fromJson(Map<String, dynamic> json) =>
      AttendanceRecord(
        id: json['id'] ?? '',
        classId: json['class_id'] ?? '',
        studentId: json['student_id'] ?? '',
        teacherId: json['teacher_id'] ?? '',
        date: json['date'] ?? '',
        status: AttendanceStatusExt.fromString(json['status'] ?? 'present'),
        notes: json['notes'],
        createdAt: json['created_at'],
        justified: json['justified'] ?? false,
      );
}

class AttendanceSummary {
  final String studentId;
  final int total;
  final int present;
  final int absent;
  final int late;
  final double presentPercentage;
  final double absentPercentage;
  final double latePercentage;

  AttendanceSummary({
    required this.studentId,
    required this.total,
    required this.present,
    required this.absent,
    required this.late,
    required this.presentPercentage,
    required this.absentPercentage,
    required this.latePercentage,
  });

  factory AttendanceSummary.fromJson(Map<String, dynamic> json) =>
      AttendanceSummary(
        studentId: json['student_id'] ?? '',
        total: json['total'] ?? 0,
        present: json['present'] ?? 0,
        absent: json['absent'] ?? 0,
        late: json['late'] ?? 0,
        presentPercentage: (json['present_percentage'] ?? 0).toDouble(),
        absentPercentage: (json['absent_percentage'] ?? 0).toDouble(),
        latePercentage: (json['late_percentage'] ?? 0).toDouble(),
      );
}

class BulkAttendanceEntry {
  final String studentId;
  AttendanceStatus status;
  String? notes;

  BulkAttendanceEntry({
    required this.studentId,
    this.status = AttendanceStatus.present,
    this.notes,
  });

  Map<String, dynamic> toJson() => {
        'student_id': studentId,
        'status': status.value,
        'notes': notes,
      };
}
