import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../constants/app_theme.dart';
import '../../models/user.dart';
import '../../models/review.dart';
import '../../providers/auth_provider.dart';
import '../../services/review_service.dart';
import '../../utils/helpers.dart';

class AddReviewScreen extends StatefulWidget {
  final UserModel student;
  final String classId;
  const AddReviewScreen(
      {super.key, required this.student, required this.classId});

  @override
  State<AddReviewScreen> createState() => _AddReviewScreenState();
}

class _AddReviewScreenState extends State<AddReviewScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  ReviewSentiment _sentiment = ReviewSentiment.positive;
  DateTime _date = DateTime.now();
  bool _loading = false;
  final _service = ReviewService();

  @override
  void dispose() {
    _titleCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      await _service.createComment(
        studentId: widget.student.id,
        classId: widget.classId,
        sentiment: _sentiment.value,
        title: _titleCtrl.text.trim(),
        description: _descCtrl.text.trim(),
        date:
            '${_date.year.toString().padLeft(4, '0')}-${_date.month.toString().padLeft(2, '0')}-${_date.day.toString().padLeft(2, '0')}',
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Commentaire ajouté avec succès'),
            backgroundColor: AppTheme.success,
            behavior: SnackBarBehavior.floating),
      );
      Navigator.pop(context, true);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text(e.toString()),
            backgroundColor: AppTheme.error,
            behavior: SnackBarBehavior.floating),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(title: Text('Commentaire – ${widget.student.fullName}')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            // Sentiment selection
            const Text('Type de commentaire',
                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
            const SizedBox(height: 10),
            Row(children: [
              Expanded(
                child: GestureDetector(
                  onTap: () =>
                      setState(() => _sentiment = ReviewSentiment.positive),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    decoration: BoxDecoration(
                      color: _sentiment == ReviewSentiment.positive
                          ? ReviewSentiment.positive.bgColor
                          : Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                          color: _sentiment == ReviewSentiment.positive
                              ? ReviewSentiment.positive.color
                              : AppTheme.border,
                          width:
                              _sentiment == ReviewSentiment.positive ? 2 : 1),
                    ),
                    child: Column(children: [
                      Icon(
                        Icons.thumb_up_outlined,
                        color: _sentiment == ReviewSentiment.positive
                            ? ReviewSentiment.positive.color
                            : AppTheme.textSecondary,
                        size: 26,
                      ),
                      const SizedBox(height: 6),
                      Text('Positif',
                          style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                              color: _sentiment == ReviewSentiment.positive
                                  ? ReviewSentiment.positive.color
                                  : AppTheme.textSecondary)),
                    ]),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: GestureDetector(
                  onTap: () =>
                      setState(() => _sentiment = ReviewSentiment.negative),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    decoration: BoxDecoration(
                      color: _sentiment == ReviewSentiment.negative
                          ? ReviewSentiment.negative.bgColor
                          : Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                          color: _sentiment == ReviewSentiment.negative
                              ? ReviewSentiment.negative.color
                              : AppTheme.border,
                          width:
                              _sentiment == ReviewSentiment.negative ? 2 : 1),
                    ),
                    child: Column(children: [
                      Icon(
                        Icons.thumb_down_outlined,
                        color: _sentiment == ReviewSentiment.negative
                            ? ReviewSentiment.negative.color
                            : AppTheme.textSecondary,
                        size: 26,
                      ),
                      const SizedBox(height: 6),
                      Text('Négatif',
                          style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                              color: _sentiment == ReviewSentiment.negative
                                  ? ReviewSentiment.negative.color
                                  : AppTheme.textSecondary)),
                    ]),
                  ),
                ),
              ),
            ]),
            const SizedBox(height: 20),

            // Date
            const Text('Date',
                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
            const SizedBox(height: 8),
            GestureDetector(
              onTap: () async {
                final d = await showDatePicker(
                    context: context,
                    initialDate: _date,
                    firstDate: DateTime(2020),
                    lastDate: DateTime.now());
                if (d != null) setState(() => _date = d);
              },
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppTheme.border)),
                child: Row(children: [
                  const Icon(Icons.calendar_today_outlined,
                      color: AppTheme.textSecondary, size: 18),
                  const SizedBox(width: 10),
                  Text(formatDateForDisplay(_date),
                      style: const TextStyle(color: AppTheme.textPrimary)),
                ]),
              ),
            ),
            const SizedBox(height: 16),

            // Title
            const Text('Titre',
                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
            const SizedBox(height: 8),
            TextFormField(
              controller: _titleCtrl,
              decoration:
                  const InputDecoration(hintText: 'Titre du commentaire'),
              validator: (v) =>
                  (v == null || v.isEmpty) ? 'Le titre est obligatoire' : null,
            ),
            const SizedBox(height: 16),

            // Description
            const Text('Description',
                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
            const SizedBox(height: 8),
            TextFormField(
              controller: _descCtrl,
              maxLines: 5,
              decoration: const InputDecoration(
                  hintText: 'Décrivez le comportement ou la performance...'),
              validator: (v) => (v == null || v.isEmpty)
                  ? 'La description est obligatoire'
                  : null,
            ),
            const SizedBox(height: 28),

            ElevatedButton(
              onPressed: _loading ? null : _submit,
              style: ElevatedButton.styleFrom(
                  minimumSize: const Size.fromHeight(50),
                  backgroundColor: _sentiment.color),
              child: _loading
                  ? const SizedBox(
                      height: 22,
                      width: 22,
                      child: CircularProgressIndicator(
                          color: Colors.white, strokeWidth: 2))
                  : Text(
                      _sentiment == ReviewSentiment.positive
                          ? 'Ajouter commentaire positif'
                          : 'Ajouter commentaire négatif',
                      style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: Colors.white)),
            ),
          ]),
        ),
      ),
    );
  }
}
