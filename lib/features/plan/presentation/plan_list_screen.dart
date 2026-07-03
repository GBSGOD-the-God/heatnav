import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/router/app_router.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/risk_badge.dart';
import '../../../core/widgets/section_header.dart';
import '../data/plan_model.dart';
import 'plan_providers.dart';

class PlanListScreen extends ConsumerWidget {
  const PlanListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final plans = ref.watch(plansProvider);
    final upcoming = plans.where((p) => !p.isPast).toList();
    final past = plans.where((p) => p.isPast).toList().reversed.toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Plans'),
        actions: [
          IconButton(
            tooltip: 'Heat routes',
            icon: const Icon(Icons.alt_route),
            onPressed: () => context.push(AppRoutes.heatRoutes),
          ),
          IconButton(
            tooltip: 'Heat calendar',
            icon: const Icon(Icons.calendar_month_outlined),
            onPressed: () => context.push(AppRoutes.calendar),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push(AppRoutes.planNew),
        icon: const Icon(Icons.add),
        label: const Text('Plan my day'),
      ),
      body: plans.isEmpty
          ? EmptyState(
              icon: Icons.event_note_outlined,
              title: 'No plans yet',
              message:
                  'Tell HeatNav what you\'re doing — cricket, work, market — '
                  'and get a safety verdict before you step out.',
              actionLabel: 'Create your first plan',
              onAction: () => context.push(AppRoutes.planNew),
            )
          : ListView(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 96),
              children: [
                if (upcoming.isNotEmpty) ...[
                  const SectionHeader('Upcoming'),
                  for (final plan in upcoming) _PlanCard(plan: plan),
                ],
                if (past.isNotEmpty) ...[
                  const SectionHeader('Past'),
                  for (final plan in past.take(10)) _PlanCard(plan: plan),
                ],
              ],
            ),
    );
  }
}

class _PlanCard extends ConsumerWidget {
  const _PlanCard({required this.plan});

  final Plan plan;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final analysis = ref.watch(planAssessmentProvider(plan.id));
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Card(
        child: InkWell(
          borderRadius: BorderRadius.circular(24),
          onTap: () => context.push(AppRoutes.planDetail(plan.id)),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.surfaceContainerHigh,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Icon(plan.activity.icon),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(plan.title, style: theme.textTheme.titleSmall),
                      const SizedBox(height: 2),
                      Text(
                        '${Formatters.dayShort(plan.leaveAt)} · '
                        '${Formatters.time(plan.leaveAt)} → ${Formatters.time(plan.returnAt)}',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
                if (analysis != null && !analysis.forecastUnavailable)
                  RiskBadge(analysis.assessment.level, compact: true),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
