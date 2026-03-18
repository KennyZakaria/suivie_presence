import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'constants/app_theme.dart';
import 'providers/auth_provider.dart';
import 'providers/notification_provider.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/change_password_screen.dart';
import 'screens/auth/terms_acceptance_screen.dart';
import 'screens/teacher/teacher_home_screen.dart';
import 'screens/student/student_home_screen.dart';
import 'utils/secure_storage.dart';

final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Firebase initialization goes here after running: flutterfire configure
  // await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  runApp(const SchoolAttendanceApp());
}

class SchoolAttendanceApp extends StatelessWidget {
  const SchoolAttendanceApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => NotificationProvider()),
      ],
      child: MaterialApp(
        navigatorKey: navigatorKey,
        title: 'SchoolTrack',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.theme,
        home: const _SplashRouter(),
        routes: {
          '/login':           (_) => const LoginScreen(),
          '/change-password': (_) => const ChangePasswordScreen(),
          '/teacher-home':    (_) => const TeacherHomeScreen(),
          '/student-home':    (_) => const StudentHomeScreen(),
        },
      ),
    );
  }
}

class _SplashRouter extends StatefulWidget {
  const _SplashRouter();

  @override
  State<_SplashRouter> createState() => _SplashRouterState();
}

class _SplashRouterState extends State<_SplashRouter> {
  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    final auth = context.read<AuthProvider>();
    await auth.checkAuthStatus();
    if (!mounted) return;

    if (!auth.isAuthenticated) {
      Navigator.pushReplacementNamed(context, '/login');
    } else if (auth.mustChangePassword) {
      Navigator.pushReplacementNamed(context, '/change-password');
    } else if (auth.user!.isTeacher) {
      Navigator.pushReplacementNamed(context, '/teacher-home');
    } else {
      // Student: check if terms are accepted
      final accepted = await SecureStorage.hasAcceptedTerms(auth.user!.id);
      if (!mounted) return;
      if (!accepted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => TermsAcceptanceScreen(userId: auth.user!.id),
          ),
        );
      } else {
        Navigator.pushReplacementNamed(context, '/student-home');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF4F46E5),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 88, height: 88,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: Colors.white.withOpacity(0.3), width: 2),
              ),
              child: const Icon(Icons.school_rounded, size: 48, color: Colors.white),
            ),
            const SizedBox(height: 20),
            const Text('SchoolTrack', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white)),
            const SizedBox(height: 40),
            const CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
          ],
        ),
      ),
    );
  }
}
