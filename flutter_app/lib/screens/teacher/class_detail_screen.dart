import 'package:flutter/material.dart';
import '../../constants/app_theme.dart';
import '../../models/class_model.dart';
import '../../models/user.dart';
import '../../models/attendance.dart';
import '../../services/class_service.dart';
import '../../services/attendance_service.dart';
import '../../utils/helpers.dart';
import '../widgets/empty_state.dart';
import '../widgets/status_badge.dart';
import 'mark_attendance_screen.dart';
import 'student_profile_screen.dart';

class ClassDetailScreen extends StatefulWidget {
  final ClassModel classModel;
  const ClassDetailScreen({super.key, required this.classModel});
  @override
  State<ClassDetailScreen> createState() => _ClassDetailScreenState();
}

class _ClassDetailScreenState extends State<ClassDetailScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<UserModel> _students = [];
  List<AttendanceRecord> _attendance = [];
  bool _loadingStudents = true;
  bool _loadingAtt = false;
  String _dateFilter = todayString();

  final _classService = ClassService();
  final _attService = AttendanceService();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadStudents();
    _tabController.addListener(() {
      if (_tabController.index == 1 && !_tabController.indexIsChanging)
        _loadAttendance();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadStudents() async {
    setState(() => _loadingStudents = true);
    try {
      _students = await _classService.getClassStudents(widget.classModel.id);
    } catch (_) {
    } finally {
      if (mounted) setState(() => _loadingStudents = false);
    }
  }

  Future<void> _loadAttendance() async {
    setState(() => _loadingAtt = true);
    try {
      _attendance = await _attService.getClassAttendance(
          widget.classModel.id, _dateFilter);
    } catch (_) {
    } finally {
      if (mounted) setState(() => _loadingAtt = false);
    }
  }

  String _studentName(String studentId) {
    try {
      return _students.firstWhere((s) => s.id == studentId).fullName;
    } catch (_) {
      return studentId;
    }
  }

  @override
  Widget build(BuildContext context) {
    final cls = widget.classModel;
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Text(cls.name),
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppTheme.primary,
          unselectedLabelColor: AppTheme.textSecondary,
          indicatorColor: AppTheme.primary,
          tabs: [
            Tab(text: 'Students (${_students.length})'),
            const Tab(text: 'Attendance'),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          final result = await Navigator.push(
              context,
              MaterialPageRoute(
                  builder: (_) => MarkAttendanceScreen(
                      classModel: cls, students: _students)));
          if (result == true) _loadAttendance();
        },
        backgroundColor: AppTheme.primary,
        icon: const Icon(Icons.edit_note_rounded, color: Colors.white),
        label: const Text('Mark Attendance',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // Students Tab
          _loadingStudents
              ? const Center(child: CircularProgressIndicator())
              : _students.isEmpty
                  ? const EmptyState(
                      icon: Icons.people_outline,
                      message: 'No students in this class')
                  : ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: _students.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 8),
                      itemBuilder: (_, i) {
                        final s = _students[i];
                        return Material(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          child: InkWell(
                            borderRadius: BorderRadius.circular(12),
                            onTap: () => Navigator.push(
                                context,
                                MaterialPageRoute(
                                    builder: (_) => StudentProfileScreen(
                                        student: s, classId: cls.id))),
                            child: Padding(
                              padding: const EdgeInsets.all(14),
                              child: Row(children: [
                                CircleAvatar(
                                  backgroundColor: AppTheme.primaryLight,
                                  child: Text(s.initials,
                                      style: const TextStyle(
                                          color: AppTheme.primary,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 13)),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                    child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(s.fullName,
                                        style: const TextStyle(
                                            fontWeight: FontWeight.w600)),
                                    Text(s.email,
                                        style: const TextStyle(
                                            color: AppTheme.textSecondary,
                                            fontSize: 12)),
                                  ],
                                )),
                                const Icon(Icons.chevron_right_rounded,
                                    color: AppTheme.textSecondary),
                              ]),
                            ),
                          ),
                        );
                      },
                    ),

          // Attendance Tab
          Column(
            children: [
              Container(
                color: Colors.white,
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Row(children: [
                  const Text('Date:',
                      style: TextStyle(fontWeight: FontWeight.w500)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: GestureDetector(
                      onTap: () async {
                        final d = await showDatePicker(
                          context: context,
                          initialDate: DateTime.now(),
                          firstDate: DateTime(2020),
                          lastDate: DateTime.now(),
                        );
                        if (d != null) {
                          setState(() => _dateFilter =
                              '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}');
                          _loadAttendance();
                        }
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                            color: AppTheme.primaryLight,
                            borderRadius: BorderRadius.circular(8)),
                        child: Row(children: [
                          const Icon(Icons.calendar_today_outlined,
                              size: 16, color: AppTheme.primary),
                          const SizedBox(width: 8),
                          Text(_dateFilter,
                              style: const TextStyle(
                                  color: AppTheme.primary,
                                  fontWeight: FontWeight.w500)),
                        ]),
                      ),
                    ),
                  ),
                ]),
              ),
              Expanded(
                child: _loadingAtt
                    ? const Center(child: CircularProgressIndicator())
                    : _attendance.isEmpty
                        ? const EmptyState(
                            icon: Icons.assignment_outlined,
                            message: 'No attendance for this date')
                        : ListView.separated(
                            padding: const EdgeInsets.all(16),
                            itemCount: _attendance.length,
                            separatorBuilder: (_, __) =>
                                const SizedBox(height: 8),
                            itemBuilder: (_, i) {
                              final a = _attendance[i];
                              return Container(
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: AppTheme.border),
                                ),
                                child: Row(children: [
                                  Expanded(
                                      child: Text(_studentName(a.studentId),
                                          style: const TextStyle(
                                              fontWeight: FontWeight.w500))),
                                  StatusBadge(status: a.status),
                                ]),
                              );
                            },
                          ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
