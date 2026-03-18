import 'package:flutter/material.dart';
import '../../constants/app_theme.dart';
import '../../utils/secure_storage.dart';

class TermsAcceptanceScreen extends StatefulWidget {
  final String userId;
  const TermsAcceptanceScreen({super.key, required this.userId});

  @override
  State<TermsAcceptanceScreen> createState() => _TermsAcceptanceScreenState();
}

class _TermsAcceptanceScreenState extends State<TermsAcceptanceScreen> {
  bool _hasScrolledToBottom = false;
  bool _accepted = false;
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  void _onScroll() {
    if (_scrollController.offset >=
        _scrollController.position.maxScrollExtent - 50) {
      if (!_hasScrolledToBottom) {
        setState(() => _hasScrolledToBottom = true);
      }
    }
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _acceptTerms() async {
    await SecureStorage.setTermsAccepted(widget.userId);
    if (!mounted) return;
    Navigator.pushReplacementNamed(context, '/student-home');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 20, 24, 16),
                child: Column(
                  children: [
                    Container(
                      width: 56,
                      height: 56,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                            color: Colors.white.withOpacity(0.3), width: 2),
                      ),
                      child: const Icon(Icons.gavel_rounded,
                          size: 28, color: Colors.white),
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Règlement Intérieur',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Veuillez lire et accepter le règlement pour continuer',
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.8),
                        fontSize: 13,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),

              // Rules card
              Expanded(
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: const BorderRadius.vertical(
                        top: Radius.circular(24)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.15),
                        blurRadius: 30,
                        offset: const Offset(0, -5),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      // Scroll indicator
                      if (!_hasScrolledToBottom)
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(
                              vertical: 10, horizontal: 20),
                          decoration: const BoxDecoration(
                            color: Color(0xFFFEF3C7),
                            borderRadius: BorderRadius.vertical(
                                top: Radius.circular(24)),
                          ),
                          child: const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.arrow_downward_rounded,
                                  size: 16, color: Color(0xFF92400E)),
                              SizedBox(width: 6),
                              Text(
                                'Faites défiler pour lire tout le règlement',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Color(0xFF92400E),
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ),

                      // Rules content
                      Expanded(
                        child: SingleChildScrollView(
                          controller: _scrollController,
                          padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildSection(
                                'Article 1 – Objet',
                                'Le présent règlement intérieur définit les règles de fonctionnement '
                                    'et de discipline applicables à tous les étudiants inscrits au sein de '
                                    'l\'établissement. Il a pour but de garantir un environnement d\'apprentissage '
                                    'sain, respectueux et propice à la réussite scolaire.',
                              ),
                              _buildSection(
                                'Article 2 – Assiduité et Ponctualité',
                                '• La présence à tous les cours est obligatoire.\n'
                                    '• Tout retard doit être justifié auprès de l\'administration dans un délai de 48 heures.\n'
                                    '• Trois retards non justifiés équivalent à une absence non justifiée.\n'
                                    '• Toute absence non justifiée sera signalée aux parents/tuteurs et pourra entraîner des sanctions disciplinaires.\n'
                                    '• Le suivi des présences est effectué de manière électronique via l\'application SchoolTrack.',
                              ),
                              _buildSection(
                                'Article 3 – Justification des Absences',
                                '• Les absences doivent être justifiées par un document officiel (certificat médical, convocation administrative, etc.).\n'
                                    '• Les justificatifs doivent être soumis via l\'application dans un délai maximum de 48 heures.\n'
                                    '• L\'administration se réserve le droit de refuser tout justificatif jugé non recevable.',
                              ),
                              _buildSection(
                                'Article 4 – Comportement et Discipline',
                                '• Le respect mutuel entre étudiants, enseignants et personnel administratif est exigé en toute circonstance.\n'
                                    '• Tout comportement perturbateur, violent ou irrespectueux sera sanctionné.\n'
                                    '• L\'utilisation du téléphone portable est interdite pendant les cours, sauf autorisation de l\'enseignant.\n'
                                    '• Les locaux et le matériel de l\'établissement doivent être traités avec soin.',
                              ),
                              _buildSection(
                                'Article 5 – Échelle des Sanctions',
                                '• Niveau 1 – Avertissement : Rappel à l\'ordre verbal ou écrit pour une première infraction mineure.\n'
                                    '• Niveau 2 – Blâme : Sanction écrite notifiée à l\'étudiant et à ses parents/tuteurs en cas de récidive ou d\'infraction plus grave.\n'
                                    '• Niveau 3 – Exclusion temporaire ou définitive : En cas de faute grave ou de comportement répété, l\'étudiant peut être exclu temporairement ou définitivement après passage devant le conseil de discipline.',
                              ),
                              _buildSection(
                                'Article 6 – Utilisation de l\'Application SchoolTrack',
                                '• Chaque étudiant dispose d\'un compte personnel et confidentiel.\n'
                                    '• Il est strictement interdit de partager ses identifiants de connexion avec un tiers.\n'
                                    '• L\'application doit être utilisée de manière responsable et uniquement à des fins scolaires.\n'
                                    '• Toute tentative de fraude ou de manipulation des données sera considérée comme une faute grave.',
                              ),
                              _buildSection(
                                'Article 7 – Tenue Vestimentaire',
                                '• Une tenue correcte et décente est exigée au sein de l\'établissement.\n'
                                    '• Le port de la blouse ou de l\'uniforme scolaire est obligatoire si l\'établissement le requiert.',
                              ),
                              _buildSection(
                                'Article 8 – Engagement de l\'Étudiant',
                                'En acceptant ce règlement, l\'étudiant s\'engage à :\n'
                                    '• Respecter l\'ensemble des articles du présent règlement.\n'
                                    '• Participer activement à la vie scolaire.\n'
                                    '• Signaler tout comportement inapproprié ou toute situation de danger.\n'
                                    '• Maintenir une attitude responsable et respectueuse en toutes circonstances.',
                              ),

                              const SizedBox(height: 8),
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: AppTheme.primaryLight,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                      color: AppTheme.primary.withOpacity(0.2)),
                                ),
                                child: const Column(
                                  children: [
                                    Icon(Icons.info_outline_rounded,
                                        color: AppTheme.primary, size: 24),
                                    SizedBox(height: 8),
                                    Text(
                                      'Le non-respect du règlement intérieur expose '
                                      'l\'étudiant à des sanctions pouvant aller '
                                      'jusqu\'à l\'exclusion définitive.',
                                      textAlign: TextAlign.center,
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: AppTheme.primary,
                                        fontWeight: FontWeight.w500,
                                        height: 1.5,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 16),
                            ],
                          ),
                        ),
                      ),

                      // Bottom action area
                      Container(
                        padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.05),
                              blurRadius: 10,
                              offset: const Offset(0, -5),
                            ),
                          ],
                        ),
                        child: Column(
                          children: [
                            // Checkbox
                            GestureDetector(
                              onTap: _hasScrolledToBottom
                                  ? () =>
                                      setState(() => _accepted = !_accepted)
                                  : null,
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                    vertical: 12, horizontal: 16),
                                decoration: BoxDecoration(
                                  color: _accepted
                                      ? AppTheme.success.withOpacity(0.1)
                                      : Colors.grey.shade50,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: _accepted
                                        ? AppTheme.success
                                        : AppTheme.border,
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    Container(
                                      width: 24,
                                      height: 24,
                                      decoration: BoxDecoration(
                                        color: _accepted
                                            ? AppTheme.success
                                            : Colors.white,
                                        borderRadius:
                                            BorderRadius.circular(6),
                                        border: Border.all(
                                          color: _accepted
                                              ? AppTheme.success
                                              : AppTheme.border,
                                          width: 2,
                                        ),
                                      ),
                                      child: _accepted
                                          ? const Icon(Icons.check_rounded,
                                              size: 16, color: Colors.white)
                                          : null,
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Text(
                                        'J\'ai lu et j\'accepte le règlement intérieur de l\'établissement',
                                        style: TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w500,
                                          color: _hasScrolledToBottom
                                              ? AppTheme.textPrimary
                                              : AppTheme.textSecondary,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(height: 12),
                            // Accept button
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed:
                                    _accepted ? _acceptTerms : null,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppTheme.primary,
                                  foregroundColor: Colors.white,
                                  disabledBackgroundColor:
                                      Colors.grey.shade300,
                                  disabledForegroundColor:
                                      Colors.grey.shade500,
                                  padding:
                                      const EdgeInsets.symmetric(vertical: 14),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                ),
                                child: const Text(
                                  'Accepter et Continuer',
                                  style: TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSection(String title, String content) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: AppTheme.primary.withOpacity(0.08),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              title,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: AppTheme.primary,
              ),
            ),
          ),
          const SizedBox(height: 10),
          Text(
            content,
            style: const TextStyle(
              fontSize: 13,
              color: AppTheme.textSecondary,
              height: 1.7,
            ),
          ),
        ],
      ),
    );
  }
}
