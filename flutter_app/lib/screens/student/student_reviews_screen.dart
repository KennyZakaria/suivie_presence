import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../constants/app_theme.dart';
import '../../models/review.dart';
import '../../providers/auth_provider.dart';
import '../../services/review_service.dart';
import '../../utils/helpers.dart';
import '../widgets/empty_state.dart';

class StudentReviewsScreen extends StatefulWidget {
  const StudentReviewsScreen({super.key});
  @override
  State<StudentReviewsScreen> createState() => _StudentReviewsScreenState();
}

class _StudentReviewsScreenState extends State<StudentReviewsScreen> {
  List<Review> _reviews = [];
  bool _loading = true;
  final Set<String> _expanded = {};
  final _service = ReviewService();

  @override
  void initState() {
    super.initState();
    _loadReviews();
  }

  Future<void> _loadReviews() async {
    setState(() => _loading = true);
    final userId = context.read<AuthProvider>().user!.id;
    try {
      _reviews = await _service.getStudentReviews(userId);
    } catch (_) {
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(title: const Text('My Reviews')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadReviews,
              child: _reviews.isEmpty
                  ? CustomScrollView(
                      slivers: [
                        SliverFillRemaining(
                          child: EmptyState(
                            icon: Icons.check_circle_outline,
                            message: 'No disciplinary reviews',
                          ),
                        ),
                      ],
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: _reviews.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (_, i) {
                        final r = _reviews[i];
                        final isExpanded = _expanded.contains(r.id);
                        return Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                                color: r.level?.bgColor ??
                                    r.sentiment?.bgColor ??
                                    const Color(0xFFE5E7EB),
                                width: 1.5),
                          ),
                          child: Column(children: [
                            InkWell(
                              borderRadius: BorderRadius.circular(14),
                              onTap: () => setState(() => isExpanded
                                  ? _expanded.remove(r.id)
                                  : _expanded.add(r.id)),
                              child: Padding(
                                padding: const EdgeInsets.all(14),
                                child: Row(children: [
                                  Container(
                                    width: 40,
                                    height: 40,
                                    decoration: BoxDecoration(
                                        color: r.level?.bgColor ??
                                            r.sentiment?.bgColor ??
                                            const Color(0xFFF3F4F6),
                                        borderRadius:
                                            BorderRadius.circular(10)),
                                    child: Icon(
                                      r.reviewType == ReviewType.comment
                                          ? (r.sentiment ==
                                                  ReviewSentiment.positive
                                              ? Icons.thumb_up_outlined
                                              : Icons.thumb_down_outlined)
                                          : (r.level == ReviewLevel.level1
                                              ? Icons.info_outline
                                              : r.level == ReviewLevel.level2
                                                  ? Icons.phone_outlined
                                                  : Icons.block_outlined),
                                      color: r.level?.color ??
                                          r.sentiment?.color ??
                                          const Color(0xFF6B7280),
                                      size: 20,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                      child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                        Row(children: [
                                          Container(
                                            padding: const EdgeInsets.symmetric(
                                                horizontal: 8, vertical: 2),
                                            decoration: BoxDecoration(
                                                color: r.level?.bgColor ??
                                                    r.sentiment?.bgColor ??
                                                    const Color(0xFFF3F4F6),
                                                borderRadius:
                                                    BorderRadius.circular(6)),
                                            child: Text(
                                                r.level?.label ??
                                                    r.sentiment?.label ??
                                                    '',
                                                style: TextStyle(
                                                    fontSize: 10,
                                                    fontWeight: FontWeight.bold,
                                                    color: r.level?.color ??
                                                        r.sentiment?.color ??
                                                        const Color(
                                                            0xFF6B7280))),
                                          ),
                                          const SizedBox(width: 8),
                                          if (r.isResolved)
                                            Container(
                                              padding:
                                                  const EdgeInsets.symmetric(
                                                      horizontal: 8,
                                                      vertical: 2),
                                              decoration: BoxDecoration(
                                                  color:
                                                      const Color(0xFFDCFCE7),
                                                  borderRadius:
                                                      BorderRadius.circular(6)),
                                              child: const Text('Resolved',
                                                  style: TextStyle(
                                                      fontSize: 10,
                                                      fontWeight:
                                                          FontWeight.bold,
                                                      color: AppTheme.success)),
                                            ),
                                        ]),
                                        const SizedBox(height: 4),
                                        Text(r.title,
                                            style: const TextStyle(
                                                fontWeight: FontWeight.w600,
                                                fontSize: 14)),
                                        Text(formatDate(r.date),
                                            style: const TextStyle(
                                                color: AppTheme.textSecondary,
                                                fontSize: 12)),
                                      ])),
                                  Icon(
                                      isExpanded
                                          ? Icons.expand_less
                                          : Icons.expand_more,
                                      color: AppTheme.textSecondary),
                                ]),
                              ),
                            ),
                            if (isExpanded)
                              Container(
                                padding:
                                    const EdgeInsets.fromLTRB(14, 0, 14, 14),
                                child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      const Divider(height: 1),
                                      const SizedBox(height: 10),
                                      Text(r.description,
                                          style: const TextStyle(
                                              color: AppTheme.textSecondary,
                                              fontSize: 13,
                                              height: 1.5)),
                                    ]),
                              ),
                          ]),
                        );
                      },
                    ),
            ),
    );
  }
}
