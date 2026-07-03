import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/domain/risk/risk_engine.dart';
import '../../../core/domain/risk/risk_level.dart';
import '../../../core/theme/risk_palette.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/risk_badge.dart';
import '../../../core/widgets/skeleton.dart';
import '../../profile/presentation/profile_controller.dart';
import '../../weather/data/weather_models.dart';
import '../../weather/presentation/weather_providers.dart';

/// 7-day heat outlook: per-day band, avoid-window and best outdoor window —
/// planning before the day starts.
class CalendarScreen extends ConsumerWidget {
  const CalendarScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final weatherAsync = ref.watch(weatherProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Heat calendar')),
      body: weatherAsync.when(
        loading: () => ListView(
          padding: const EdgeInsets.all(20),
          children: const [
            Skeleton.card(height: 110),
            SizedBox(height: 12),
            Skeleton.card(height: 110),
            SizedBox(height: 12),
            Skeleton.card(height: 110),
          ],
        ),
        error: (e, _) =>
            const Center(child: Text('Forecast unavailable right now.')),
        data: (weather) => _CalendarBody(weather: weather),
      ),
    );
  }
}

class _DaySummary {
  const _DaySummary({
    required this.day,
    required this.level,
    required this.maxFeelsLike,
    required this.avoidWindow,
    required this.bestWindow,
    required this.maxUv,
  });

  final DateTime day;
  final RiskLevel level;
  final double maxFeelsLike;

  /// Consecutive orange+ hours, or null when the day has none.
  final (DateTime, DateTime)? avoidWindow;

  /// Best green/yellow daytime hour for outdoor activity.
  final DateTime? bestWindow;
  final double maxUv;
}

class _CalendarBody extends ConsumerWidget {
  const _CalendarBody({required this.weather});

  final WeatherBundle weather;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(profileControllerProvider);
    final today = DateTime.now();
    final summaries = <_DaySummary>[];

    for (var i = 0; i < 7; i++) {
      final day = DateTime(today.year, today.month, today.day + i);
      final hours = weather.hoursOf(day);
      if (hours.isEmpty) continue;

      RiskLevel levelOf(HourlyPoint h) => RiskEngine.assess(
            conditions: ConditionsInput(
              tempC: h.tempC,
              relativeHumidity: h.humidity,
              uvIndex: h.uvIndex,
            ),
            profile: profile,
          ).level;

      final levels = {for (final h in hours) h: levelOf(h)};
      final worst = levels.values.reduce((a, b) => a.index >= b.index ? a : b);

      // Avoid window: first→last orange+ hour.
      final riskyHours = hours
          .where((h) => levels[h]!.index >= RiskLevel.orange.index)
          .toList();
      (DateTime, DateTime)? avoid;
      if (riskyHours.isNotEmpty) {
        avoid = (
          riskyHours.first.time,
          riskyHours.last.time.add(const Duration(hours: 1)),
        );
      }

      // Best outdoor window: coolest daytime (6–20 h) green/yellow hour.
      final candidates = hours
          .where((h) =>
              h.time.hour >= 6 &&
              h.time.hour <= 20 &&
              levels[h]!.index <= RiskLevel.yellow.index)
          .toList();
      DateTime? best;
      if (candidates.isNotEmpty) {
        candidates.sort((a, b) => a.feelsLikeC.compareTo(b.feelsLikeC));
        best = candidates.first.time;
      }

      summaries.add(_DaySummary(
        day: day,
        level: worst,
        maxFeelsLike:
            hours.map((h) => h.feelsLikeC).reduce((a, b) => a > b ? a : b),
        avoidWindow: avoid,
        bestWindow: best,
        maxUv: hours.map((h) => h.uvIndex).reduce((a, b) => a > b ? a : b),
      ));
    }

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
      children: [
        for (final summary in summaries) _DayCard(summary: summary),
      ],
    );
  }
}

class _DayCard extends StatelessWidget {
  const _DayCard({required this.summary});

  final _DaySummary summary;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final palette = context.riskPalette;
    final isToday = summary.day.day == DateTime.now().day &&
        summary.day.month == DateTime.now().month;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: theme.colorScheme.surfaceContainer,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: palette.of(summary.level).withValues(alpha: 0.35),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  isToday ? 'Today' : Formatters.weekday(summary.day),
                  style: theme.textTheme.titleMedium,
                ),
                const SizedBox(width: 8),
                Text(
                  Formatters.dayShort(summary.day),
                  style: theme.textTheme.labelMedium?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                const Spacer(),
                RiskBadge(summary.level, compact: true),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Icon(Icons.thermostat,
                    size: 16, color: theme.colorScheme.onSurfaceVariant),
                const SizedBox(width: 6),
                Text(
                  'peaks at feels-like ${Formatters.tempFull(summary.maxFeelsLike)}'
                  '${summary.maxUv >= 8 ? ' · very high UV' : ''}',
                  style: theme.textTheme.bodySmall,
                ),
              ],
            ),
            const SizedBox(height: 6),
            if (summary.avoidWindow != null)
              Row(
                children: [
                  Icon(Icons.block, size: 16, color: palette.orange),
                  const SizedBox(width: 6),
                  Text(
                    'Avoid ${Formatters.hour(summary.avoidWindow!.$1)}–'
                    '${Formatters.hour(summary.avoidWindow!.$2)}',
                    style: theme.textTheme.bodySmall
                        ?.copyWith(fontWeight: FontWeight.w600),
                  ),
                ],
              )
            else
              Row(
                children: [
                  Icon(Icons.check_circle_outline,
                      size: 16, color: palette.green),
                  const SizedBox(width: 6),
                  Text('Good for outdoor activity all day',
                      style: theme.textTheme.bodySmall),
                ],
              ),
            if (summary.bestWindow != null) ...[
              const SizedBox(height: 6),
              Row(
                children: [
                  Icon(Icons.directions_run,
                      size: 16, color: theme.colorScheme.primary),
                  const SizedBox(width: 6),
                  Text(
                    'Best outdoor hour: around '
                    '${Formatters.hour(summary.bestWindow!)}',
                    style: theme.textTheme.bodySmall,
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
