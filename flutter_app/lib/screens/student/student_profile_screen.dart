import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../constants/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/auth_service.dart';

class StudentProfileScreen extends StatefulWidget {
  const StudentProfileScreen({super.key});
  @override
  State<StudentProfileScreen> createState() => _StudentProfileScreenState();
}

class _StudentProfileScreenState extends State<StudentProfileScreen> {
  bool _changingPassword = false;
  final _formKey = GlobalKey<FormState>();
  final _oldCtrl = TextEditingController();
  final _newCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  final _authService = AuthService();

  @override
  void dispose() {
    _oldCtrl.dispose();
    _newCtrl.dispose();
    _confirmCtrl.dispose();
    super.dispose();
  }

  Future<void> _changePassword() async {
    if (!_formKey.currentState!.validate()) return;
    try {
      await _authService.changePassword(_oldCtrl.text, _newCtrl.text);
      if (!mounted) return;
      setState(() => _changingPassword = false);
      _oldCtrl.clear();
      _newCtrl.clear();
      _confirmCtrl.clear();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Mot de passe modifié avec succès'),
            backgroundColor: AppTheme.success,
            behavior: SnackBarBehavior.floating),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text(e.toString()),
            backgroundColor: AppTheme.error,
            behavior: SnackBarBehavior.floating),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(title: const Text('Mon profil')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(children: [
          // Header
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                  colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)]),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(children: [
              CircleAvatar(
                radius: 40,
                backgroundColor: Colors.white.withOpacity(0.2),
                child: Text(user?.initials ?? '?',
                    style: const TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color: Colors.white)),
              ),
              const SizedBox(height: 12),
              Text(user?.fullName ?? '',
                  style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.white)),
              const SizedBox(height: 4),
              Text(user?.email ?? '',
                  style: TextStyle(
                      color: Colors.white.withOpacity(0.8), fontSize: 13)),
              const SizedBox(height: 8),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(20)),
                child: const Text('Étudiant',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.w600)),
              ),
            ]),
          ),
          const SizedBox(height: 16),

          // Info
          Container(
            decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.border)),
            child: Column(children: [
              _InfoRow(
                  icon: Icons.email_outlined,
                  label: 'Email',
                  value: user?.email ?? '—'),
              const Divider(height: 1, indent: 48),
              _InfoRow(
                  icon: Icons.phone_outlined,
                  label: 'Téléphone',
                  value: user?.phone ?? '—'),
              const Divider(height: 1, indent: 48),
              _InfoRow(
                  icon: Icons.class_outlined,
                  label: 'Classes',
                  value: '${user?.classIds.length ?? 0} inscrite(s)'),
            ]),
          ),
          const SizedBox(height: 16),

          // Change Password
          Material(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            child: Column(children: [
              InkWell(
                borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(16), bottom: Radius.circular(16)),
                onTap: () =>
                    setState(() => _changingPassword = !_changingPassword),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(children: [
                    const Icon(Icons.lock_outline, color: AppTheme.primary),
                    const SizedBox(width: 12),
                    const Expanded(
                        child: Text('Changer le mot de passe',
                            style: TextStyle(
                                fontWeight: FontWeight.w600, fontSize: 15))),
                    Icon(
                        _changingPassword
                            ? Icons.expand_less
                            : Icons.expand_more,
                        color: AppTheme.textSecondary),
                  ]),
                ),
              ),
              if (_changingPassword)
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                  child: Form(
                    key: _formKey,
                    child: Column(children: [
                      const Divider(height: 1),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _oldCtrl,
                        obscureText: true,
                        decoration: const InputDecoration(
                            labelText: 'Mot de passe actuel', isDense: true),
                        validator: (v) =>
                            (v == null || v.isEmpty) ? 'Requis' : null,
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _newCtrl,
                        obscureText: true,
                        decoration: const InputDecoration(
                            labelText: 'Nouveau mot de passe', isDense: true),
                        validator: (v) {
                          if (v == null || v.isEmpty) return 'Requis';
                          if (v.length < 8) return 'Min 8 caractères';
                          return null;
                        },
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _confirmCtrl,
                        obscureText: true,
                        decoration: const InputDecoration(
                            labelText: 'Confirmer le mot de passe',
                            isDense: true),
                        validator: (v) => v != _newCtrl.text
                            ? 'Les mots de passe ne correspondent pas'
                            : null,
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: _changePassword,
                            style: ElevatedButton.styleFrom(
                                minimumSize: const Size.fromHeight(44)),
                            child: const Text('Update Password'),
                          )),
                    ]),
                  ),
                ),
            ]),
          ),
          const SizedBox(height: 16),

          // Logout
          Material(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            child: InkWell(
              borderRadius: BorderRadius.circular(16),
              onTap: () async {
                final confirm = await showDialog<bool>(
                  context: context,
                  builder: (_) => AlertDialog(
                    title: const Text('Déconnexion'),
                    content: const Text(
                        'Êtes-vous sûr de vouloir vous déconnecter ?'),
                    actions: [
                      TextButton(
                          onPressed: () => Navigator.pop(context, false),
                          child: const Text('Annuler')),
                      TextButton(
                          onPressed: () => Navigator.pop(context, true),
                          child: const Text('Se déconnecter',
                              style: TextStyle(color: AppTheme.error))),
                    ],
                  ),
                );
                if (confirm == true && context.mounted) {
                  await context.read<AuthProvider>().logout();
                  Navigator.pushNamedAndRemoveUntil(
                      context, '/login', (_) => false);
                }
              },
              child: const Padding(
                padding: EdgeInsets.all(16),
                child: Row(children: [
                  Icon(Icons.logout_rounded, color: AppTheme.error),
                  SizedBox(width: 12),
                  Text('Se déconnecter',
                      style: TextStyle(
                          color: AppTheme.error,
                          fontWeight: FontWeight.w600,
                          fontSize: 15)),
                ]),
              ),
            ),
          ),
        ]),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  const _InfoRow(
      {required this.icon, required this.label, required this.value});

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(children: [
          Icon(icon, color: AppTheme.textSecondary, size: 20),
          const SizedBox(width: 12),
          Text('$label  ',
              style:
                  const TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
          Expanded(
              child: Text(value,
                  textAlign: TextAlign.right,
                  style: const TextStyle(
                      fontWeight: FontWeight.w500, fontSize: 14))),
        ]),
      );
}
