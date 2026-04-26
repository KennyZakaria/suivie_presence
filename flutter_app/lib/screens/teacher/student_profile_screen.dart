import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../constants/app_theme.dart';
import '../../models/user.dart';
import '../../models/attendance.dart';
import '../../models/review.dart';
import '../../services/attendance_service.dart';
import '../../services/review_service.dart';
import '../../utils/helpers.dart';
import '../widgets/status_badge.dart';
import '../widgets/empty_state.dart';
import 'add_review_screen.dart';

class StudentProfileScreen extends StatefulWidget {
  final UserModel student;
  final String classId;
  const StudentProfileScreen(
      {super.key, required this.student, required this.classId});

  @override
  State<StudentProfileScreen> createState() => _StudentProfileScreenState();
}

class _StudentProfileScreenState extends State<StudentProfileScreen> {
  AttendanceSummary? _summary;
  List<AttendanceRecord> _records = [];
  List<Review> _reviews = [];
  bool _loading = true;
  int _reviewTab = 0; // 0=positive, 1=negative, 2=discipline
  final _service = AttendanceService();
  final _reviewService = ReviewService();

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final res = await Future.wait([
        _service.getStudentSummary(widget.student.id),
        _service.getStudentAttendance(widget.student.id),
        _reviewService.getStudentReviews(widget.student.id),
      ]);
      _summary = res[0] as AttendanceSummary;
      _records = (res[1] as List<AttendanceRecord>).take(10).toList();
      _reviews = res[2] as List<Review>;
    } catch (_) {
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.student;
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Text(s.fullName),
        actions: [
          TextButton.icon(
            onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(
                    builder: (_) =>
                        AddReviewScreen(student: s, classId: widget.classId))),
            icon: const Icon(Icons.comment_outlined, color: AppTheme.primary),
            label: const Text('Commentaire',
                style: TextStyle(
                    color: AppTheme.primary, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(children: [
                // Profile card
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppTheme.border)),
                  child: Row(children: [
                    CircleAvatar(
                      radius: 30,
                      backgroundColor: AppTheme.primaryLight,
                      child: Text(s.initials,
                          style: const TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.primary)),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                        child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                          Text(s.fullName,
                              style: const TextStyle(
                                  fontSize: 16, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 2),
                          Text(s.email,
                              style: const TextStyle(
                                  color: AppTheme.textSecondary, fontSize: 13)),
                          if (s.phone != null)
                            Text(s.phone!,
                                style: const TextStyle(
                                    color: AppTheme.textSecondary,
                                    fontSize: 13)),
                        ])),
                  ]),
                ),
                const SizedBox(height: 16),

                // Attendance summary with pie chart
                if (_summary != null && _summary!.total > 0) ...[
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppTheme.border)),
                    child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Aperçu des présences',
                              style: TextStyle(
                                  fontWeight: FontWeight.bold, fontSize: 15)),
                          const SizedBox(height: 16),
                          Row(children: [
                            SizedBox(
                              height: 120,
                              width: 120,
                              child: PieChart(PieChartData(
                                sectionsSpace: 3,
                                centerSpaceRadius: 30,
                                sections: [
                                  PieChartSectionData(
                                      value: _summary!.present.toDouble(),
                                      color: AppTheme.success,
                                      radius: 28,
                                      showTitle: false),
                                  PieChartSectionData(
                                      value: _summary!.absent.toDouble(),
                                      color: AppTheme.error,
                                      radius: 28,
                                      showTitle: false),
                                  PieChartSectionData(
                                      value: _summary!.late.toDouble(),
                                      color: AppTheme.warning,
                                      radius: 28,
                                      showTitle: false),
                                ],
                              )),
                            ),
                            const SizedBox(width: 20),
                            Expanded(
                                child: Column(children: [
                              _LegendItem(
                                  color: AppTheme.success,
                                  label: 'Présent',
                                  count: _summary!.present,
                                  pct: _summary!.presentPercentage),
                              const SizedBox(height: 8),
                              _LegendItem(
                                  color: AppTheme.error,
                                  label: 'Absent',
                                  count: _summary!.absent,
                                  pct: _summary!.absentPercentage),
                              const SizedBox(height: 8),
                              _LegendItem(
                                  color: AppTheme.warning,
                                  label: 'En retard',
                                  count: _summary!.late,
                                  pct: _summary!.latePercentage),
                            ])),
                          ]),
                          const SizedBox(height: 12),
                          Center(
                              child: Column(children: [
                            Text(
                                '${_summary!.presentPercentage.toStringAsFixed(1)}%',
                                style: TextStyle(
                                    fontSize: 28,
                                    fontWeight: FontWeight.bold,
                                    color: attendanceRateColor(
                                        _summary!.presentPercentage))),
                            Text(
                                attendanceRateLabel(
                                    _summary!.presentPercentage),
                                style: TextStyle(
                                    color: attendanceRateColor(
                                        _summary!.presentPercentage),
                                    fontWeight: FontWeight.w500)),
                          ])),
                        ]),
                  ),
                  const SizedBox(height: 16),
                ],

                // Reviews / Comments section
                _buildReviewsSection(),
                const SizedBox(height: 16),

                // Recent attendance
                Container(
                  decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppTheme.border)),
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Padding(
                          padding: EdgeInsets.fromLTRB(16, 16, 16, 8),
                          child: Text('Présences récentes',
                              style: TextStyle(
                                  fontWeight: FontWeight.bold, fontSize: 15)),
                        ),
                        if (_records.isEmpty)
                          const Padding(
                            padding: EdgeInsets.all(24),
                            child: Center(
                                child: Text('Aucun enregistrement',
                                    style: TextStyle(
                                        color: AppTheme.textSecondary))),
                          )
                        else
                          ...(_records.map((r) => ListTile(
                                leading: StatusBadge(status: r.status),
                                title: Text(r.date,
                                    style: const TextStyle(
                                        fontWeight: FontWeight.w500,
                                        fontSize: 14)),
                                subtitle: r.notes != null
                                    ? Text(r.notes!,
                                        style: const TextStyle(fontSize: 12))
                                    : null,
                                dense: true,
                              ))),
                      ]),
                ),
              ]),
            ),
    );
  }

  Widget _buildReviewsSection() {
    final positiveComments = _reviews
        .where((r) =>
            r.reviewType == ReviewType.comment &&
            r.sentiment == ReviewSentiment.positive)
        .toList();
    final negativeComments = _reviews
        .where((r) =>
            r.reviewType == ReviewType.comment &&
            r.sentiment == ReviewSentiment.negative)
        .toList();
    final conseils = _reviews
        .where((r) => r.reviewType == ReviewType.conseilDiscipline)
        .toList();

    final tabs = [
      _TabInfo('Positif', positiveComments.length, const Color(0xFF16A34A),
          Icons.thumb_up_outlined),
      _TabInfo('Négatif', negativeComments.length, const Color(0xFFDC2626),
          Icons.thumb_down_outlined),
      _TabInfo('Discipline', conseils.length, const Color(0xFFEA580C),
          Icons.gavel_outlined),
    ];
    final filtered = [positiveComments, negativeComments, conseils][_reviewTab];

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Padding(
          padding: EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: Text('Commentaires & Discipline',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
        ),
        // Tab buttons
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Row(
            children: List.generate(tabs.length, (i) {
              final t = tabs[i];
              final selected = _reviewTab == i;
              return Expanded(
                child: GestureDetector(
                  onTap: () => setState(() => _reviewTab = i),
                  child: Container(
                    margin: EdgeInsets.only(right: i < 2 ? 8 : 0),
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    decoration: BoxDecoration(
                      color: selected
                          ? t.color.withOpacity(0.12)
                          : Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: selected ? t.color : Colors.transparent,
                        width: 1.5,
                      ),
                    ),
                    child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(t.icon,
                              size: 14,
                              color:
                                  selected ? t.color : AppTheme.textSecondary),
                          const SizedBox(width: 4),
                          Text(t.label,
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: selected
                                    ? FontWeight.bold
                                    : FontWeight.w500,
                                color:
                                    selected ? t.color : AppTheme.textSecondary,
                              )),
                          const SizedBox(width: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 5, vertical: 1),
                            decoration: BoxDecoration(
                              color: selected
                                  ? t.color.withOpacity(0.2)
                                  : Colors.grey.shade300,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text('${t.count}',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: selected
                                      ? t.color
                                      : AppTheme.textSecondary,
                                )),
                          ),
                        ]),
                  ),
                ),
              );
            }),
          ),
        ),
        const SizedBox(height: 8),
        if (filtered.isEmpty)
          const Padding(
            padding: EdgeInsets.all(24),
            child: Center(
                child: Text('Aucun commentaire',
                    style: TextStyle(color: AppTheme.textSecondary))),
          )
        else
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(12, 4, 12, 12),
            itemCount: filtered.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (_, i) {
              final r = filtered[i];
              final isComment = r.reviewType == ReviewType.comment;
              final Color badgeColor;
              final Color badgeBg;
              final String badgeLabel;
              final IconData badgeIcon;

              if (isComment) {
                final isPositive = r.sentiment == ReviewSentiment.positive;
                badgeColor = isPositive
                    ? const Color(0xFF16A34A)
                    : const Color(0xFFDC2626);
                badgeBg = isPositive
                    ? const Color(0xFFDCFCE7)
                    : const Color(0xFFFEE2E2);
                badgeLabel = isPositive ? 'Positif' : 'Négatif';
                badgeIcon = isPositive
                    ? Icons.thumb_up_outlined
                    : Icons.thumb_down_outlined;
              } else {
                badgeColor = r.level?.color ?? const Color(0xFFEA580C);
                badgeBg = r.level?.bgColor ?? const Color(0xFFFFEDD5);
                badgeLabel = r.level?.label ?? 'Conseil';
                badgeIcon = Icons.gavel_outlined;
              }

              return Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: badgeBg.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: badgeBg, width: 1.2),
                ),
                child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(children: [
                        Icon(badgeIcon, color: badgeColor, size: 16),
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: badgeBg,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(badgeLabel,
                              style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: badgeColor)),
                        ),
                        const Spacer(),
                        if (r.isResolved)
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFFDCFCE7),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text('Résolu',
                                style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: AppTheme.success)),
                          ),
                        const SizedBox(width: 6),
                        Text(formatDate(r.date),
                            style: const TextStyle(
                                color: AppTheme.textSecondary, fontSize: 11)),
                      ]),
                      const SizedBox(height: 6),
                      Text(r.title,
                          style: const TextStyle(
                              fontWeight: FontWeight.w600, fontSize: 13)),
                      if (r.description.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(r.description,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                                color: AppTheme.textSecondary,
                                fontSize: 12,
                                height: 1.4)),
                      ],
                    ]),
              );
            },
          ),
      ]),
    );
  }
}

class _TabInfo {
  final String label;
  final int count;
  final Color color;
  final IconData icon;
  const _TabInfo(this.label, this.count, this.color, this.icon);
}

class _LegendItem extends StatelessWidget {
  final Color color;
  final String label;
  final int count;
  final double pct;
  const _LegendItem(
      {required this.color,
      required this.label,
      required this.count,
      required this.pct});

  @override
  Widget build(BuildContext context) => Row(children: [
        Container(
            width: 10,
            height: 10,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 8),
        Expanded(child: Text(label, style: const TextStyle(fontSize: 13))),
        Text('$count (${pct.toStringAsFixed(0)}%)',
            style: TextStyle(
                fontSize: 12, color: color, fontWeight: FontWeight.w600)),
      ]);
}
