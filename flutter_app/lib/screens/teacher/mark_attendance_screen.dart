import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../constants/app_theme.dart';
import '../../models/class_model.dart';
import '../../models/user.dart';
import '../../models/attendance.dart';
import '../../providers/auth_provider.dart';
import '../../services/attendance_service.dart';
import '../../utils/helpers.dart';

class MarkAttendanceScreen extends StatefulWidget {
  final ClassModel classModel;
  final List<UserModel> students;

  const MarkAttendanceScreen({super.key, required this.classModel, required this.students});

  @override
  State<MarkAttendanceScreen> createState() => _MarkAttendanceScreenState();
}

class _MarkAttendanceScreenState extends State<MarkAttendanceScreen> {
  late DateTime _selectedDate;
  late List<BulkAttendanceEntry> _entries;
  final Map<String, TextEditingController> _noteControllers = {};
  final Map<String, bool> _noteExpanded = {};
  bool _loading = false;
  final _service = AttendanceService();

  @override
  void initState() {
    super.initState();
    _selectedDate = DateTime.now();
    _entries = widget.students.map((s) => BulkAttendanceEntry(studentId: s.id)).toList();
    for (final s in widget.students) {
      _noteControllers[s.id] = TextEditingController();
      _noteExpanded[s.id] = false;
    }
  }

  @override
  void dispose() {
    for (final c in _noteControllers.values) c.dispose();
    super.dispose();
  }

  void _setStatus(String studentId, AttendanceStatus status) {
    setState(() {
      final e = _entries.firstWhere((e) => e.studentId == studentId);
      e.status = status;
    });
  }

  void _setAllPresent() {
    setState(() => _entries.forEach((e) => e.status = AttendanceStatus.present));
  }

  Future<void> _pickDate() async {
    final d = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
    );
    if (d != null) setState(() => _selectedDate = d);
  }

  String get _dateString =>
      '${_selectedDate.year.toString().padLeft(4, '0')}-${_selectedDate.month.toString().padLeft(2, '0')}-${_selectedDate.day.toString().padLeft(2, '0')}';

  Future<void> _submit() async {
    setState(() => _loading = true);
    try {
      for (final e in _entries) {
        e.notes = _noteControllers[e.studentId]?.text.isEmpty == true
            ? null : _noteControllers[e.studentId]?.text;
      }
      final teacherId = context.read<AuthProvider>().user!.id;
      await _service.bulkMarkAttendance(
        classId: widget.classModel.id,
        date: _dateString,
        records: _entries,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Présences enregistrées !'), backgroundColor: AppTheme.success, behavior: SnackBarBehavior.floating),
      );
      Navigator.pop(context, true);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString()), backgroundColor: AppTheme.error, behavior: SnackBarBehavior.floating),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final presentCount = _entries.where((e) => e.status == AttendanceStatus.present).length;
    final absentCount = _entries.where((e) => e.status == AttendanceStatus.absent).length;
    final lateCount   = _entries.where((e) => e.status == AttendanceStatus.late).length;

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Text(widget.classModel.name),
        actions: [
          TextButton(
            onPressed: _setAllPresent,
            child: const Text('Tous présents', style: TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
      body: Column(
        children: [
          // Header
          Container(
            color: Colors.white,
            padding: const EdgeInsets.all(16),
            child: Column(children: [
              // Date selector
              GestureDetector(
                onTap: _pickDate,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  decoration: BoxDecoration(color: AppTheme.primaryLight, borderRadius: BorderRadius.circular(10)),
                  child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                    const Icon(Icons.calendar_today, size: 18, color: AppTheme.primary),
                    const SizedBox(width: 8),
                    Text(formatDateForDisplay(_selectedDate),
                        style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w600, fontSize: 15)),
                    const SizedBox(width: 8),
                    const Icon(Icons.expand_more, size: 18, color: AppTheme.primary),
                  ]),
                ),
              ),
              const SizedBox(height: 12),
              // Summary counts
              Row(children: [
                _CountChip(count: presentCount, label: 'Présents', color: AppTheme.success),
                const SizedBox(width: 8),
                _CountChip(count: absentCount, label: 'Absents', color: AppTheme.error),
                const SizedBox(width: 8),
                _CountChip(count: lateCount, label: 'En retard', color: AppTheme.warning),
              ]),
            ]),
          ),

          // Student list
          Expanded(
            child: widget.students.isEmpty
                ? const Center(child: Text('Aucun élève dans cette classe', style: TextStyle(color: AppTheme.textSecondary)))
                : ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: widget.students.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (_, i) {
                      final student = widget.students[i];
                      final entry = _entries.firstWhere((e) => e.studentId == student.id);
                      final noteExpanded = _noteExpanded[student.id] ?? false;

                      return Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: AppTheme.border),
                        ),
                        child: Column(children: [
                          Padding(
                            padding: const EdgeInsets.all(14),
                            child: Row(children: [
                              // Avatar
                              CircleAvatar(
                                backgroundColor: AppTheme.primaryLight,
                                child: Text(student.initials,
                                    style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold, fontSize: 12)),
                              ),
                              const SizedBox(width: 12),
                              // Name
                              Expanded(child: Text(student.fullName,
                                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14))),
                              // Status buttons
                              Row(children: [
                                _StatusButton(
                                  label: 'P', color: AppTheme.success,
                                  selected: entry.status == AttendanceStatus.present,
                                  onTap: () => _setStatus(student.id, AttendanceStatus.present),
                                ),
                                const SizedBox(width: 6),
                                _StatusButton(
                                  label: 'L', color: AppTheme.warning,
                                  selected: entry.status == AttendanceStatus.late,
                                  onTap: () => _setStatus(student.id, AttendanceStatus.late),
                                ),
                                const SizedBox(width: 6),
                                _StatusButton(
                                  label: 'A', color: AppTheme.error,
                                  selected: entry.status == AttendanceStatus.absent,
                                  onTap: () => _setStatus(student.id, AttendanceStatus.absent),
                                ),
                                // Note toggle
                                const SizedBox(width: 8),
                                GestureDetector(
                                  onTap: () => setState(() => _noteExpanded[student.id] = !noteExpanded),
                                  child: Icon(
                                    noteExpanded ? Icons.note_outlined : Icons.note_add_outlined,
                                    size: 20,
                                    color: AppTheme.textSecondary,
                                  ),
                                ),
                              ]),
                            ]),
                          ),
                          // Notes field (expandable)
                          if (noteExpanded)
                            Padding(
                              padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
                              child: TextField(
                                controller: _noteControllers[student.id],
                                decoration: const InputDecoration(
                                  hintText: 'Add a note (optional)...',
                                  hintStyle: TextStyle(fontSize: 13),
                                  isDense: true,
                                  contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                ),
                                style: const TextStyle(fontSize: 13),
                                maxLines: 2,
                              ),
                            ),
                        ]),
                      );
                    },
                  ),
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: ElevatedButton(
            onPressed: _loading ? null : _submit,
            style: ElevatedButton.styleFrom(minimumSize: const Size.fromHeight(52)),
            child: _loading
                ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : Text('Save Attendance · ${widget.students.length} students',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
          ),
        ),
      ),
    );
  }
}

class _StatusButton extends StatelessWidget {
  final String label;
  final Color color;
  final bool selected;
  final VoidCallback onTap;

  const _StatusButton({required this.label, required this.color, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        width: 34, height: 34,
        decoration: BoxDecoration(
          color: selected ? color : color.withOpacity(0.08),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: selected ? color : color.withOpacity(0.3), width: 1.5),
        ),
        child: Center(
          child: Text(label, style: TextStyle(
            color: selected ? Colors.white : color,
            fontWeight: FontWeight.bold,
            fontSize: 13,
          )),
        ),
      ),
    );
  }
}

class _CountChip extends StatelessWidget {
  final int count;
  final String label;
  final Color color;

  const _CountChip({required this.count, required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(child: Container(
      padding: const EdgeInsets.symmetric(vertical: 8),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(children: [
        Text('$count', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color)),
        Text(label, style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.w500)),
      ]),
    ));
  }
}
