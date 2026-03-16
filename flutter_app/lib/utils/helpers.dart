import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

String formatDate(String isoDate) {
  try {
    final dt = DateTime.parse(isoDate);
    return DateFormat('MMM d, yyyy').format(dt);
  } catch (_) {
    return isoDate;
  }
}

String formatDateTime(String isoDate) {
  try {
    final dt = DateTime.parse(isoDate);
    return DateFormat('MMM d, yyyy · h:mm a').format(dt);
  } catch (_) {
    return isoDate;
  }
}

String todayString() => DateFormat('yyyy-MM-dd').format(DateTime.now());

String formatDateForDisplay(DateTime dt) => DateFormat('EEEE, MMM d, yyyy').format(dt);

Color statusColor(String status) {
  switch (status) {
    case 'present': return const Color(0xFF22C55E);
    case 'absent':  return const Color(0xFFEF4444);
    case 'late':    return const Color(0xFFF97316);
    default:        return Colors.grey;
  }
}

Color statusBgColor(String status) {
  switch (status) {
    case 'present': return const Color(0xFFDCFCE7);
    case 'absent':  return const Color(0xFFFEE2E2);
    case 'late':    return const Color(0xFFFFEDD5);
    default:        return Colors.grey.shade100;
  }
}

String capitalize(String s) =>
    s.isEmpty ? s : '${s[0].toUpperCase()}${s.substring(1)}';

String attendanceRateLabel(double rate) {
  if (rate >= 85) return 'Excellent';
  if (rate >= 70) return 'Good';
  if (rate >= 50) return 'At Risk';
  return 'Critical';
}

Color attendanceRateColor(double rate) {
  if (rate >= 85) return const Color(0xFF22C55E);
  if (rate >= 70) return const Color(0xFF3B82F6);
  if (rate >= 50) return const Color(0xFFF97316);
  return const Color(0xFFEF4444);
}
