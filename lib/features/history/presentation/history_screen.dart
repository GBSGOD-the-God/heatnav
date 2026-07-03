import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/i18n/app_localizations.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/section_header.dart';
import '../../community/presentation/community_providers.dart';
import '../../plan/presentation/plan_providers.dart';
import '../../recovery/data/checkin_model.dart';

/// Personal heat timeline: past plans, recovery check-ins, own reports,
/// plus lightweight achievements computed from real activity.
class HistoryScreen extends ConsumerWidget {
  const HistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final pastPlans =
        ref.watch(plansProvider).where((p) => p.isPast).toList();
    final checkins = ref.watch(checkinsProvider);
    final myReports = ref
        .watch(communityReportsProvider)
        .where((r) => r.isMine)
        .toList();

    final entries = <(_HistoryEntry, DateTime)>[
      for (final p in pastPlans)
        (
          _HistoryEntry(
            icon: p.activity.icon,
            title: p.title,
            subtitle: 'Planned trip · back by ${Formatters.time(p.returnAt)}',
          ),
          p.leaveAt
        ),
      for (final c in checkins)
        (
          _HistoryEntry(
            icon: c.feeling.icon,
            title: 'Check-in: ${c.feeling.label}',
            subtitle: 'Recovery check-in',
          ),
          c.time
        ),
      for (final r in myReports)
        (
          _HistoryEntry(
            icon: r.category.icon,
            title: 'Reported: ${r.category.label}',
            subtitle: r.description,
          ),
          r.createdAt
        ),
    ]..sort((a, b) => b.$2.compareTo(a.$2));

    final achievements = _achievements(
      planCount: pastPlans.length + ref.watch(upcomingPlansProvider).length,
      checkinCount: checkins.length,
      reportCount: myReports.length,
    );

    return Scaffold(
      appBar: AppBar(title: Text(context.tr('Heat history'))),
      body: entries.isEmpty && achievements.isEmpty
          ? const EmptyState(
              icon: Icons.timeline,
              title: 'Your story starts today',
              message: 'Plans, check-ins and reports will build your '
                  'personal heat timeline here.',
            )
          : ListView(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
              children: [
                if (achievements.isNotEmpty) ...[
                  const SectionHeader('Achievements'),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      for (final a in achievements)
                        Chip(
                          avatar: Icon(a.$1,
                              size: 18, color: theme.colorScheme.primary),
                          label: Text(a.$2),
                        ),
                    ],
                  ),
                ],
                const SectionHeader('Timeline'),
                for (final (entry, time) in entries)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: ListTile(
                      tileColor: theme.colorScheme.surfaceContainer,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(18),
                      ),
                      leading: Icon(entry.icon),
                      title: Text(entry.title),
                      subtitle: Text(
                        entry.subtitle,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      trailing: Text(
                        Formatters.dayShort(time),
                        style: theme.textTheme.labelSmall,
                      ),
                    ),
                  ),
              ],
            ),
    );
  }

  /// Honest gamification: earned from actual recorded activity only.
  static List<(IconData, String)> _achievements({
    required int planCount,
    required int checkinCount,
    required int reportCount,
  }) {
    return [
      if (planCount >= 1) (Icons.flag, 'First plan'),
      if (planCount >= 5) (Icons.event_available, 'Planner ×5'),
      if (checkinCount >= 1) (Icons.favorite, 'First check-in'),
      if (checkinCount >= 7) (Icons.local_fire_department, 'Week of check-ins'),
      if (reportCount >= 1) (Icons.campaign, 'Community contributor'),
      if (reportCount >= 5) (Icons.verified, 'Neighbourhood guardian'),
    ];
  }
}

class _HistoryEntry {
  const _HistoryEntry({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;
}
