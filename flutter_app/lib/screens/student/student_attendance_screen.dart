import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:provider/provider.dart';
import '../../constants/app_theme.dart';
import '../../models/attendance.dart';
import '../../models/justification.dart';
import '../../providers/auth_provider.dart';
import '../../services/attendance_service.dart';
import '../../services/justification_service.dart';
import '../../utils/helpers.dart';
import '../widgets/status_badge.dart';
import '../widgets/empty_state.dart';
import 'submit_justification_screen.dart';

class StudentAttendanceScreen extends StatefulWidget {
  const StudentAttendanceScreen({super.key});
  @override
  State<StudentAttendanceScreen> createState() =>
      _StudentAttendanceScreenState();
}

class _StudentAttendanceScreenState extends State<StudentAttendanceScreen> {
  AttendanceSummary? _summary;
  List<AttendanceRecord> _records = [];
  List<Justification> _justifications = [];
  bool _loading = true;
  final _service = AttendanceService();
  final _justService = JustificationService();

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    final userId = context.read<AuthProvider>().user!.id;
    try {
      final res = await Future.wait([
        _service.getStudentSummary(userId),
        _service.getStudentAttendance(userId),
      ]);
      _summary = res[0] as AttendanceSummary;
      _records = res[1] as List<AttendanceRecord>;
    } catch (_) {}
    // Load justifications separately so a failure doesn't break attendance
    try {
      _justifications = await _justService.getMyJustifications();
    } catch (_) {
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(title: const Text('My Attendance')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Summary circle
                  if (_summary != null) ...[
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: AppTheme.border)),
                      child: Column(children: [
                        SizedBox(
                          height: 160,
                          width: 160,
                          child: Stack(alignment: Alignment.center, children: [
                            PieChart(PieChartData(
                              sectionsSpace: 3,
                              centerSpaceRadius: 55,
                              sections: _summary!.total == 0
                                  ? [
                                      PieChartSectionData(
                                          value: 1,
                                          color: Colors.grey.shade200,
                                          radius: 22,
                                          showTitle: false),
                                    ]
                                  : [
                                      PieChartSectionData(
                                          value: _summary!.present.toDouble(),
                                          color: AppTheme.success,
                                          radius: 22,
                                          showTitle: false),
                                      PieChartSectionData(
                                          value: _summary!.absent.toDouble(),
                                          color: AppTheme.error,
                                          radius: 22,
                                          showTitle: false),
                                      PieChartSectionData(
                                          value: _summary!.late.toDouble(),
                                          color: AppTheme.warning,
                                          radius: 22,
                                          showTitle: false),
                                    ],
                            )),
                            Column(mainAxisSize: MainAxisSize.min, children: [
                              Text(
                                  '${_summary!.presentPercentage.toStringAsFixed(1)}%',
                                  style: TextStyle(
                                      fontSize: 26,
                                      fontWeight: FontWeight.bold,
                                      color: attendanceRateColor(
                                          _summary!.presentPercentage))),
                              Text(
                                  attendanceRateLabel(
                                      _summary!.presentPercentage),
                                  style: TextStyle(
                                      fontSize: 11,
                                      color: attendanceRateColor(
                                          _summary!.presentPercentage),
                                      fontWeight: FontWeight.w500)),
                            ]),
                          ]),
                        ),
                        const SizedBox(height: 20),
                        Row(children: [
                          _StatChip(
                              count: _summary!.present,
                              label: 'Present',
                              color: AppTheme.success),
                          const SizedBox(width: 8),
                          _StatChip(
                              count: _summary!.absent,
                              label: 'Absent',
                              color: AppTheme.error),
                          const SizedBox(width: 8),
                          _StatChip(
                              count: _summary!.late,
                              label: 'Late',
                              color: AppTheme.warning),
                        ]),
                        const SizedBox(height: 8),
                        Text('${_summary!.total} total sessions recorded',
                            style: const TextStyle(
                                color: AppTheme.textSecondary, fontSize: 12)),
                      ]),
                    ),
                    const SizedBox(height: 20),
                  ],

                  // Records list
                  const Text('Attendance History',
                      style:
                          TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 12),
                  if (_records.isEmpty)
                    const EmptyState(
                        icon: Icons.assignment_outlined,
                        message: 'No attendance records yet')
                  else
                    ...(_records.map((r) {
                      final justification =
                          _justifications.cast<Justification?>().firstWhere(
                                (j) => j!.attendanceId == r.id,
                                orElse: () => null,
                              );
                      return Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppTheme.border),
                        ),
                        child: Column(children: [
                          Row(children: [
                            Container(
                              width: 42,
                              height: 42,
                              decoration: BoxDecoration(
                                color: r.status.bgColor,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Icon(_statusIcon(r.status),
                                  color: r.status.color, size: 22),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                                child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                  Text(formatDate(r.date),
                                      style: const TextStyle(
                                          fontWeight: FontWeight.w600,
                                          fontSize: 14)),
                                  if (r.notes != null && r.notes!.isNotEmpty)
                                    Text(r.notes!,
                                        style: const TextStyle(
                                            color: AppTheme.textSecondary,
                                            fontSize: 12)),
                                ])),
                            StatusBadge(status: r.status),
                          ]),
                          // Justify button or justification status
                          if (r.status == AttendanceStatus.absent) ...[
                            const SizedBox(height: 8),
                            if (r.justified)
                              Container(
                                width: double.infinity,
                                padding:
                                    const EdgeInsets.symmetric(vertical: 6),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFDCFCE7),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(Icons.check_circle,
                                          color: AppTheme.success, size: 14),
                                      SizedBox(width: 4),
                                      Text('Justifiée',
                                          style: TextStyle(
                                              color: AppTheme.success,
                                              fontSize: 12,
                                              fontWeight: FontWeight.w600)),
                                    ]),
                              )
                            else if (justification != null)
                              Container(
                                width: double.infinity,
                                padding:
                                    const EdgeInsets.symmetric(vertical: 6),
                                decoration: BoxDecoration(
                                  color: justification.status.bgColor,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(justification.status.icon,
                                          color: justification.status.color,
                                          size: 14),
                                      const SizedBox(width: 4),
                                      Text(justification.status.label,
                                          style: TextStyle(
                                              color: justification.status.color,
                                              fontSize: 12,
                                              fontWeight: FontWeight.w600)),
                                    ]),
                              )
                            else
                              SizedBox(
                                width: double.infinity,
                                child: OutlinedButton.icon(
                                  onPressed: () async {
                                    final result = await Navigator.push<bool>(
                                      context,
                                      MaterialPageRoute(
                                          builder: (_) =>
                                              SubmitJustificationScreen(
                                                  record: r)),
                                    );
                                    if (result == true) _loadData();
                                  },
                                  icon: const Icon(Icons.upload_file_outlined,
                                      size: 16),
                                  label: const Text('Justifier',
                                      style: TextStyle(fontSize: 12)),
                                  style: OutlinedButton.styleFrom(
                                    padding:
                                        const EdgeInsets.symmetric(vertical: 6),
                                    shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(8)),
                                    side: const BorderSide(
                                        color: AppTheme.primary),
                                  ),
                                ),
                              ),
                          ],
                        ]),
                      );
                    })),
                ],
              ),
            ),
    );
  }

  IconData _statusIcon(AttendanceStatus s) {
    switch (s) {
      case AttendanceStatus.present:
        return Icons.check_circle_outline;
      case AttendanceStatus.absent:
        return Icons.cancel_outlined;
      case AttendanceStatus.late:
        return Icons.access_time_outlined;
    }
  }
}

class _StatChip extends StatelessWidget {
  final int count;
  final String label;
  final Color color;
  const _StatChip(
      {required this.count, required this.label, required this.color});

  @override
  Widget build(BuildContext context) => Expanded(
          child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
            color: color.withOpacity(0.08),
            borderRadius: BorderRadius.circular(10)),
        child: Column(children: [
          Text('$count',
              style: TextStyle(
                  fontSize: 22, fontWeight: FontWeight.bold, color: color)),
          Text(label,
              style: TextStyle(
                  fontSize: 11, color: color, fontWeight: FontWeight.w500)),
        ]),
      ));
}
