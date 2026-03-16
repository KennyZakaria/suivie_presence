import 'package:flutter/material.dart';

// ── Review level (used for conseil de discipline) ─────────────────────────
enum ReviewLevel { level1, level2, level3 }

extension ReviewLevelExt on ReviewLevel {
  int get value {
    switch (this) {
      case ReviewLevel.level1:
        return 1;
      case ReviewLevel.level2:
        return 2;
      case ReviewLevel.level3:
        return 3;
    }
  }

  String get label {
    switch (this) {
      case ReviewLevel.level1:
        return 'Niveau 1 – Avertissement';
      case ReviewLevel.level2:
        return 'Niveau 2 – Contact parent';
      case ReviewLevel.level3:
        return 'Niveau 3 – Suspension';
    }
  }

  Color get color {
    switch (this) {
      case ReviewLevel.level1:
        return const Color(0xFFD97706);
      case ReviewLevel.level2:
        return const Color(0xFFEA580C);
      case ReviewLevel.level3:
        return const Color(0xFFDC2626);
    }
  }

  Color get bgColor {
    switch (this) {
      case ReviewLevel.level1:
        return const Color(0xFFFEF3C7);
      case ReviewLevel.level2:
        return const Color(0xFFFFEDD5);
      case ReviewLevel.level3:
        return const Color(0xFFFEE2E2);
    }
  }

  static ReviewLevel fromInt(int v) {
    switch (v) {
      case 1:
        return ReviewLevel.level1;
      case 2:
        return ReviewLevel.level2;
      case 3:
        return ReviewLevel.level3;
      default:
        return ReviewLevel.level1;
    }
  }
}

// ── Sentiment (used for teacher comments) ────────────────────────────────
enum ReviewSentiment { positive, negative }

extension ReviewSentimentExt on ReviewSentiment {
  String get value =>
      this == ReviewSentiment.positive ? 'positive' : 'negative';

  String get label => this == ReviewSentiment.positive ? 'Positif' : 'Négatif';

  Color get color => this == ReviewSentiment.positive
      ? const Color(0xFF16A34A)
      : const Color(0xFFDC2626);

  Color get bgColor => this == ReviewSentiment.positive
      ? const Color(0xFFDCFCE7)
      : const Color(0xFFFEE2E2);

  IconData get icon => this == ReviewSentiment.positive
      ? Icons.thumb_up_outlined
      : Icons.thumb_down_outlined;

  static ReviewSentiment fromString(String? v) =>
      v == 'positive' ? ReviewSentiment.positive : ReviewSentiment.negative;
}

// ── Review type ───────────────────────────────────────────────────────────
enum ReviewType { comment, conseilDiscipline }

extension ReviewTypeExt on ReviewType {
  String get value =>
      this == ReviewType.comment ? 'comment' : 'conseil_discipline';

  static ReviewType fromString(String? v) =>
      v == 'comment' ? ReviewType.comment : ReviewType.conseilDiscipline;
}

class Review {
  final String id;
  final String studentId;
  final String teacherId;
  final String classId;
  final ReviewType reviewType;
  final ReviewLevel? level;
  final ReviewSentiment? sentiment;
  final String title;
  final String description;
  final String date;
  final bool isResolved;
  final String? createdAt;

  Review({
    required this.id,
    required this.studentId,
    required this.teacherId,
    required this.classId,
    required this.reviewType,
    this.level,
    this.sentiment,
    required this.title,
    required this.description,
    required this.date,
    required this.isResolved,
    this.createdAt,
  });

  factory Review.fromJson(Map<String, dynamic> json) => Review(
        id: json['id'] ?? '',
        studentId: json['student_id'] ?? '',
        teacherId: json['teacher_id'] ?? '',
        classId: json['class_id'] ?? '',
        reviewType: ReviewTypeExt.fromString(json['review_type'] as String?),
        level: json['level'] != null
            ? ReviewLevelExt.fromInt(json['level'] as int)
            : null,
        sentiment: json['sentiment'] != null
            ? ReviewSentimentExt.fromString(json['sentiment'] as String?)
            : null,
        title: json['title'] ?? '',
        description: json['description'] ?? '',
        date: json['date'] ?? '',
        isResolved: json['is_resolved'] ?? false,
        createdAt: json['created_at'],
      );
}
