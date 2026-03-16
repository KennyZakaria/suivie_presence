import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../constants/app_theme.dart';
import '../providers/notification_provider.dart';
import '../utils/helpers.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});
  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
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
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          Consumer<NotificationProvider>(
            builder: (_, p, __) => p.unreadCount > 0
                ? TextButton(
                    onPressed: p.markAllRead,
                    child: const Text('Mark all read',
                        style:
                            TextStyle(color: AppTheme.primary, fontSize: 13)),
                  )
                : const SizedBox(),
          ),
        ],
      ),
      body: Consumer<NotificationProvider>(
        builder: (_, provider, __) {
          if (provider.isLoading)
            return const Center(child: CircularProgressIndicator());
          return RefreshIndicator(
            onRefresh: provider.fetchNotifications,
            child: provider.notifications.isEmpty
                ? CustomScrollView(
                    slivers: [
                      SliverFillRemaining(
                        child: Center(
                          child:
                              Column(mainAxisSize: MainAxisSize.min, children: [
                            Icon(Icons.notifications_none_rounded,
                                size: 64, color: Colors.grey.shade300),
                            const SizedBox(height: 12),
                            const Text('No notifications yet',
                                style:
                                    TextStyle(color: AppTheme.textSecondary)),
                          ]),
                        ),
                      ),
                    ],
                  )
                : ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: provider.notifications.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (_, i) {
                      final n = provider.notifications[i];
                      return Material(
                        color: n.isRead ? Colors.white : AppTheme.primaryLight,
                        borderRadius: BorderRadius.circular(12),
                        child: InkWell(
                          borderRadius: BorderRadius.circular(12),
                          onTap: () =>
                              !n.isRead ? provider.markRead(n.id) : null,
                          child: Padding(
                            padding: const EdgeInsets.all(14),
                            child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    width: 40,
                                    height: 40,
                                    decoration: BoxDecoration(
                                      color: n.isRead
                                          ? Colors.grey.shade100
                                          : AppTheme.primary.withOpacity(0.1),
                                      shape: BoxShape.circle,
                                    ),
                                    child: Icon(Icons.notifications_outlined,
                                        color: n.isRead
                                            ? AppTheme.textSecondary
                                            : AppTheme.primary,
                                        size: 20),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                      child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                        Text(n.title,
                                            style: TextStyle(
                                                fontWeight: n.isRead
                                                    ? FontWeight.w500
                                                    : FontWeight.bold,
                                                fontSize: 14)),
                                        const SizedBox(height: 2),
                                        Text(n.body,
                                            style: const TextStyle(
                                                color: AppTheme.textSecondary,
                                                fontSize: 13)),
                                        if (n.createdAt != null) ...[
                                          const SizedBox(height: 4),
                                          Text(formatDateTime(n.createdAt!),
                                              style: const TextStyle(
                                                  color: AppTheme.textSecondary,
                                                  fontSize: 11)),
                                        ],
                                      ])),
                                  if (!n.isRead)
                                    Container(
                                        width: 8,
                                        height: 8,
                                        decoration: const BoxDecoration(
                                            color: AppTheme.primary,
                                            shape: BoxShape.circle)),
                                ]),
                          ),
                        ),
                      );
                    },
                  ),
          );
        },
      ),
    );
  }
}
