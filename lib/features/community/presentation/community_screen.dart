import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/i18n/app_localizations.dart';
import '../../../core/router/app_router.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/empty_state.dart';
import '../data/daily_question.dart';
import '../data/report_model.dart';
import 'community_providers.dart';

/// Structured neighbourhood intelligence — deliberately not a social feed.
class CommunityScreen extends ConsumerStatefulWidget {
  const CommunityScreen({super.key});

  @override
  ConsumerState<CommunityScreen> createState() => _CommunityScreenState();
}

class _CommunityScreenState extends ConsumerState<CommunityScreen> {
  ReportCategory? _filter;

  @override
  Widget build(BuildContext context) {
    final reports = ref.watch(communityReportsProvider);
    final filtered = _filter == null
        ? reports
        : reports.where((r) => r.category == _filter).toList();

    return Scaffold(
      appBar: AppBar(title: Text(context.tr('Community'))),
      floatingActionButton: FloatingActionButton.extended(
        heroTag: 'report',
        onPressed: () => context.push(AppRoutes.communityNew),
        icon: const Icon(Icons.add_location_alt_outlined),
        label: Text(context.tr('Report')),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 4, 20, 96),
        children: [
          const _DailyQuestionCard(),
          const SizedBox(height: 12),
          SizedBox(
            height: 40,
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: [
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(context.tr('All')),
                    selected: _filter == null,
                    onSelected: (_) => setState(() => _filter = null),
                  ),
                ),
                for (final category in ReportCategory.values)
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: FilterChip(
                      avatar: Icon(category.icon, size: 16),
                      label: Text(context.tr(category.label)),
                      selected: _filter == category,
                      onSelected: (_) => setState(
                        () => _filter = _filter == category ? null : category,
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          if (filtered.isEmpty)
            const EmptyState(
              icon: Icons.location_off_outlined,
              title: 'Nothing reported here yet',
              message: 'Reports expire on their own — what you see is '
                  'always current, never archaeology.',
            )
          else
            for (final report in filtered) _ReportCard(report: report),
        ],
      ),
    );
  }
}

class _DailyQuestionCard extends ConsumerWidget {
  const _DailyQuestionCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final state = ref.watch(dailyQuestionProvider);
    return Card(
      color: theme.colorScheme.primaryContainer.withValues(alpha: 0.5),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.help_outline,
                    size: 18, color: theme.colorScheme.primary),
                const SizedBox(width: 8),
                Text(context.tr('Today\'s question'),
                    style: theme.textTheme.labelMedium),
              ],
            ),
            const SizedBox(height: 8),
            Text(state.question.text, style: theme.textTheme.titleMedium),
            const SizedBox(height: 12),
            if (state.isAnswered)
              Row(
                children: [
                  Icon(Icons.check_circle,
                      size: 18, color: theme.colorScheme.primary),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'You answered "${state.answer}". Answers like yours '
                      'build tomorrow\'s local heat picture.',
                      style: theme.textTheme.bodySmall,
                    ),
                  ),
                ],
              )
            else
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final option in state.question.options)
                    ActionChip(
                      label: Text(option),
                      onPressed: () => ref
                          .read(dailyQuestionProvider.notifier)
                          .answer(option),
                    ),
                ],
              ),
          ],
        ),
      ),
    );
  }
}

class _ReportCard extends ConsumerWidget {
  const _ReportCard({required this.report});

  final CommunityReport report;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final myVote = ref.watch(myVotesProvider)[report.id] ?? 0;

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: report.category.isHazard
                          ? theme.colorScheme.errorContainer
                          : theme.colorScheme.primaryContainer,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      report.category.icon,
                      size: 18,
                      color: report.category.isHazard
                          ? theme.colorScheme.onErrorContainer
                          : theme.colorScheme.onPrimaryContainer,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Flexible(
                              child: Text(
                                context.tr(report.category.label),
                                style: theme.textTheme.titleSmall,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            if (report.isVerified) ...[
                              const SizedBox(width: 6),
                              Icon(Icons.verified,
                                  size: 16, color: theme.colorScheme.primary),
                            ],
                          ],
                        ),
                        Text(
                          '${report.authorName} · '
                          '${Formatters.relative(report.createdAt)}',
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (report.isSample)
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: theme.colorScheme.surfaceContainerHighest,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text('Sample', style: theme.textTheme.labelSmall),
                    ),
                ],
              ),
              const SizedBox(height: 10),
              Text(report.description, style: theme.textTheme.bodyMedium),
              const SizedBox(height: 10),
              Row(
                children: [
                  _VoteButton(
                    icon: Icons.thumb_up_outlined,
                    activeIcon: Icons.thumb_up,
                    count: report.upvotes,
                    isActive: myVote == 1,
                    onTap: () => ref
                        .read(communityReportsProvider.notifier)
                        .vote(report.id, 1),
                  ),
                  const SizedBox(width: 12),
                  _VoteButton(
                    icon: Icons.thumb_down_outlined,
                    activeIcon: Icons.thumb_down,
                    count: report.downvotes,
                    isActive: myVote == -1,
                    onTap: () => ref
                        .read(communityReportsProvider.notifier)
                        .vote(report.id, -1),
                  ),
                  const Spacer(),
                  Text(
                    'expires in ${_expiresIn(report)}',
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  static String _expiresIn(CommunityReport report) {
    final remaining =
        report.createdAt.add(report.category.ttl).difference(DateTime.now());
    if (remaining.inHours < 1) return '${remaining.inMinutes} min';
    if (remaining.inHours < 48) return '${remaining.inHours} h';
    return '${remaining.inDays} d';
  }
}

class _VoteButton extends StatelessWidget {
  const _VoteButton({
    required this.icon,
    required this.activeIcon,
    required this.count,
    required this.isActive,
    required this.onTap,
  });

  final IconData icon;
  final IconData activeIcon;
  final int count;
  final bool isActive;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final color = isActive
        ? theme.colorScheme.primary
        : theme.colorScheme.onSurfaceVariant;
    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
        child: Row(
          children: [
            Icon(isActive ? activeIcon : icon, size: 18, color: color),
            const SizedBox(width: 4),
            Text(
              '$count',
              style: theme.textTheme.labelMedium?.copyWith(color: color),
            ),
          ],
        ),
      ),
    );
  }
}
