import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/risk_palette.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/risk_badge.dart';
import '../../../core/widgets/section_header.dart';
import '../../../core/widgets/skeleton.dart';
import '../../../core/widgets/why_this_rating.dart';
import 'plan_providers.dart';

/// The heart of the demo: a plan's verdict, why, a better window, and the
/// preparation checklist.
class PlanDetailScreen extends ConsumerWidget {
  const PlanDetailScreen({super.key, required this.planId});

  final String planId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final plan = ref.watch(planByIdProvider(planId));
    final analysis = ref.watch(planAssessmentProvider(planId));

    if (plan == null) {
      return Scaffold(
        appBar: AppBar(),
        body: const Center(child: Text('This plan no longer exists.')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(plan.title),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_outline),
            onPressed: () async {
              final confirmed = await showDialog<bool>(
                context: context,
                builder: (context) => AlertDialog(
                  title: const Text('Delete this plan?'),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context, false),
                      child: const Text('Cancel'),
                    ),
                    FilledButton(
                      onPressed: () => Navigator.pop(context, true),
                      child: const Text('Delete'),
                    ),
                  ],
                ),
              );
              if (confirmed == true && context.mounted) {
                await ref.read(plansProvider.notifier).remove(planId);
                if (context.mounted) context.pop();
              }
            },
          ),
        ],
      ),
      body: analysis == null
          ? ListView(
              padding: const EdgeInsets.all(20),
              children: const [
                Skeleton.card(height: 180),
                SizedBox(height: 16),
                Skeleton.card(height: 120),
                SizedBox(height: 16),
                Skeleton.card(height: 240),
              ],
            )
          : ListView(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
              children: [
                _PlanSummaryRow(planId: planId),
                const SizedBox(height: 16),
                if (analysis.forecastUnavailable)
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Row(
                        children: [
                          Icon(Icons.hourglass_empty,
                              color: theme.colorScheme.onSurfaceVariant),
                          const SizedBox(width: 12),
                          const Expanded(
                            child: Text(
                              'This plan is beyond the 7-day forecast. '
                              'HeatNav will assess it as soon as a real '
                              'forecast exists — no guesses.',
                            ),
                          ),
                        ],
                      ),
                    ),
                  )
                else ...[
                  _VerdictCard(planId: planId)
                      .animate()
                      .fadeIn(duration: 400.ms)
                      .slideY(begin: 0.05),
                  if (analysis.betterWindow != null) ...[
                    const SizedBox(height: 12),
                    _BetterWindowCard(planId: planId)
                        .animate()
                        .fadeIn(delay: 150.ms, duration: 400.ms),
                  ],
                  const SectionHeader('Preparation checklist'),
                  _Checklist(planId: planId),
                  if (analysis.nearbyResources.isNotEmpty) ...[
                    const SectionHeader('Near your destination'),
                    for (final r in analysis.nearbyResources)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          tileColor: theme.colorScheme.surfaceContainer,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(18),
                          ),
                          leading: Icon(r.category.icon,
                              color: theme.colorScheme.primary),
                          title: Text(r.category.label),
                          subtitle: Text(
                            r.description,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          trailing: r.isSample
                              ? const _SampleBadge()
                              : Text(Formatters.relative(r.createdAt)),
                        ),
                      ),
                  ],
                ],
              ],
            ),
    );
  }
}

class _PlanSummaryRow extends ConsumerWidget {
  const _PlanSummaryRow({required this.planId});

  final String planId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final plan = ref.watch(planByIdProvider(planId))!;
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        Chip(
          avatar: Icon(plan.activity.icon, size: 18),
          label: Text(Formatters.dateLong(plan.leaveAt)),
        ),
        Chip(
          avatar: const Icon(Icons.schedule, size: 18),
          label: Text(
            '${Formatters.time(plan.leaveAt)} → ${Formatters.time(plan.returnAt)}',
          ),
        ),
        Chip(
          avatar: Icon(
            plan.isOutdoor ? Icons.wb_sunny_outlined : Icons.home_outlined,
            size: 18,
          ),
          label: Text(plan.isOutdoor ? 'Outdoors' : 'Indoors'),
        ),
        if (plan.notes.isNotEmpty)
          Chip(
            avatar: const Icon(Icons.notes, size: 18),
            label: Text(plan.notes, style: theme.textTheme.labelMedium),
          ),
      ],
    );
  }
}

class _VerdictCard extends ConsumerWidget {
  const _VerdictCard({required this.planId});

  final String planId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final palette = context.riskPalette;
    final analysis = ref.watch(planAssessmentProvider(planId))!;
    final level = analysis.assessment.level;
    final worst = analysis.worstHour;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: palette.containerOf(level),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: palette.of(level).withValues(alpha: 0.4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              RiskBadge(level),
              const Spacer(),
              if (worst != null)
                Text(
                  'Peak feels like ${Formatters.tempFull(worst.feelsLikeC)}',
                  style: theme.textTheme.labelMedium,
                ),
            ],
          ),
          const SizedBox(height: 12),
          Text(level.headline, style: theme.textTheme.headlineMedium),
          if (worst != null) ...[
            const SizedBox(height: 6),
            Text(
              'Hardest hour of your window: around ${Formatters.hour(worst.time)}.',
              style: theme.textTheme.bodyMedium,
            ),
          ],
          const SizedBox(height: 4),
          WhyThisRating(factors: analysis.assessment.factors),
        ],
      ),
    );
  }
}

class _BetterWindowCard extends ConsumerWidget {
  const _BetterWindowCard({required this.planId});

  final String planId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final palette = context.riskPalette;
    final better = ref.watch(planAssessmentProvider(planId))!.betterWindow!;
    return Card(
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
        leading: Icon(Icons.tips_and_updates_outlined,
            color: theme.colorScheme.primary),
        title: Text(
          'Leaving at ${Formatters.time(better.leaveAt)} would be safer',
          style: theme.textTheme.titleSmall,
        ),
        subtitle: Text(
          'Same plan, ${better.level.label.toLowerCase()} conditions — peak '
          'feels-like drops to ${Formatters.tempFull(better.peakHeatIndexC)}.',
        ),
        trailing: RiskBadge(better.level, compact: true),
        iconColor: palette.of(better.level),
      ),
    );
  }
}

class _Checklist extends ConsumerWidget {
  const _Checklist({required this.planId});

  final String planId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final plan = ref.watch(planByIdProvider(planId))!;
    final items = ref.watch(planAssessmentProvider(planId))!.checklist;
    return Card(
      child: Column(
        children: [
          for (final item in items)
            CheckboxListTile(
              value: plan.checkedItems.contains(item.label),
              onChanged: (_) => ref
                  .read(plansProvider.notifier)
                  .toggleChecklistItem(planId, item.label),
              secondary: Icon(item.icon),
              title: Text(
                item.label,
                style: theme.textTheme.titleSmall?.copyWith(
                  decoration: plan.checkedItems.contains(item.label)
                      ? TextDecoration.lineThrough
                      : null,
                ),
              ),
              subtitle: Text(item.reason, style: theme.textTheme.bodySmall),
              controlAffinity: ListTileControlAffinity.trailing,
            ),
        ],
      ),
    );
  }
}

class _SampleBadge extends StatelessWidget {
  const _SampleBadge();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text('Sample', style: theme.textTheme.labelSmall),
    );
  }
}
