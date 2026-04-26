import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../constants/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/notification_provider.dart';
import 'student_attendance_screen.dart';
import 'student_reviews_screen.dart';
import 'student_profile_screen.dart';
import '../notifications_screen.dart';

class StudentHomeScreen extends StatefulWidget {
  const StudentHomeScreen({super.key});
  @override
  State<StudentHomeScreen> createState() => _StudentHomeScreenState();
}

class _StudentHomeScreenState extends State<StudentHomeScreen> {
  int _currentIndex = 0;

  final _screens = const [
    StudentAttendanceScreen(),
    StudentReviewsScreen(),
    NotificationsScreen(),
    StudentProfileScreen(),
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<NotificationProvider>().fetchNotifications();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: _screens),
      bottomNavigationBar: Consumer<NotificationProvider>(
        builder: (_, notifProvider, __) => BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (i) => setState(() => _currentIndex = i),
          items: [
            const BottomNavigationBarItem(icon: Icon(Icons.assignment_outlined), activeIcon: Icon(Icons.assignment_rounded), label: 'Présences'),
            const BottomNavigationBarItem(icon: Icon(Icons.warning_amber_outlined), activeIcon: Icon(Icons.warning_amber_rounded), label: 'Avis'),
            BottomNavigationBarItem(
              icon: Stack(clipBehavior: Clip.none, children: [
                const Icon(Icons.notifications_outlined),
                if (notifProvider.unreadCount > 0)
                  Positioned(right: -4, top: -4, child: Container(
                    width: 16, height: 16,
                    decoration: const BoxDecoration(color: AppTheme.error, shape: BoxShape.circle),
                    child: Center(child: Text('${notifProvider.unreadCount}',
                        style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold))),
                  )),
              ]),
              activeIcon: const Icon(Icons.notifications_rounded),
              label: 'Notifications',
            ),
            const BottomNavigationBarItem(icon: Icon(Icons.person_outline), activeIcon: Icon(Icons.person_rounded), label: 'Profil'),
          ],
        ),
      ),
    );
  }
}
