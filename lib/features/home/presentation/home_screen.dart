import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/domain/risk/risk_level.dart';
import '../../../core/router/app_router.dart';
import '../../../core/theme/risk_palette.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/risk_badge.dart';
import '../../../core/widgets/section_header.dart';
import '../../../core/widgets/skeleton.dart';
import '../../../core/widgets/stat_tile.dart';
import '../../../core/widgets/why_this_rating.dart';
import '../../community/presentation/community_providers.dart';
import '../../plan/presentation/plan_providers.dart';
import '../../profile/presentation/profile_controller.dart';
import '../../weather/data/weather_models.dart';
import '../../weather/presentation/weather_providers.dart';
import '../domain/tips_engine.dart';

/// The daily glance: "how risky is today, and what should I change?"
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final profile = ref.watch(profileControllerProvider);
    final weatherAsync = ref.watch(weatherProvider);

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              profile?.name.isNotEmpty == true
                  ? 'Hi, ${profile!.name.split(' ').first}'
                  : 'Today',
              style: theme.textTheme.titleLarge,
            ),
            Text(
              '${profile?.home.city ?? ''} · ${Formatters.dateLong(DateTime.now())}',
              style: theme.textTheme.labelSmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'Heat history',
            icon: const Icon(Icons.timeline),
            onPressed: () => context.push(AppRoutes.history),
          ),
          IconButton(
            tooltip: 'How do you feel?',
            icon: const Icon(Icons.favorite_outline),
            onPressed: () => context.push(AppRoutes.recovery),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        heroTag: 'emergency',
        backgroundColor: theme.colorScheme.errorContainer,
        foregroundColor: theme.colorScheme.onErrorContainer,
        tooltip: 'Emergency help',
        onPressed: () => context.push(AppRoutes.emergency),
        child: const Icon(Icons.emergency_outlined),
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(weatherProvider.notifier).refresh(),
        child: weatherAsync.when(
          loading: () => ListView(
            padding: const EdgeInsets.all(20),
            children: const [
              Skeleton.card(height: 260),
              SizedBox(height: 16),
              Skeleton.card(height: 100),
              SizedBox(height: 16),
              Skeleton.card(height: 160),
            ],
          ),
          error: (error, _) => ListView(
            padding: const EdgeInsets.all(20),
            children: [
              const SizedBox(height: 80),
              Icon(Icons.cloud_off,
                  size: 48, color: theme.colorScheme.onSurfaceVariant),
              const SizedBox(height: 16),
              Text(
                'Couldn\'t reach the forecast service',
                textAlign: TextAlign.center,
                style: theme.textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              Text(
                'Check your connection and pull down to retry. Once weather '
                'has loaded once, HeatNav keeps working offline.',
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
          data: (weather) => _HomeBody(weather: weather),
        ),
      ),
    );
  }
}

class _HomeBody extends ConsumerWidget {
  const _HomeBody({required this.weather});

  final WeatherBundle weather;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final assessment = ref.watch(currentAssessmentProvider);
    final profile = ref.watch(profileControllerProvider);
    final hazards = ref.watch(activeHazardsProvider);
    final upcoming = ref.watch(upcomingPlansProvider);

    final tips = assessment == null
        ? const <DailyTip>[]
        : TipsEngine.forToday(
            level: assessment.level,
            weather: weather,
            profile: profile,
          );

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 96),
      children: [
        if (weather.isFromCache)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: theme.colorScheme.surfaceContainerHigh,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(
                children: [
                  const Icon(Icons.cloud_off, size: 18),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Offline — showing forecast from '
                      '${Formatters.relative(weather.fetchedAt).toLowerCase()}.',
                      style: theme.textTheme.labelMedium,
                    ),
                  ),
                ],
              ),
            ),
          ),
        if (assessment != null)
          _RiskHeroCard(weather: weather)
              .animate()
              .fadeIn(duration: 400.ms)
              .slideY(begin: 0.04, curve: Curves.easeOutCubic),
        const SizedBox(height: 14),
        _MetricsGrid(weather: weather)
            .animate()
            .fadeIn(delay: 100.ms, duration: 400.ms),
        const SectionHeader('Next 24 hours'),
        _HourlyChart(weather: weather),
        _HighRiskStrip(),
        SectionHeader(
          'Today\'s plans',
          actionLabel: 'All plans',
          onAction: () => context.go(AppRoutes.plans),
        ),
        if (upcoming.isEmpty)
          Card(
            child: ListTile(
              leading: const Icon(Icons.add_circle_outline),
              title: const Text('Nothing planned yet'),
              subtitle:
                  const Text('Add a plan and get a verdict before you go.'),
              onTap: () => context.push(AppRoutes.planNew),
            ),
          )
        else
          for (final plan in upcoming.take(3))
            _PlanPreviewTile(planId: plan.id),
        if (hazards.isNotEmpty) ...[
          SectionHeader(
            'Community alerts',
            actionLabel: 'Open',
            onAction: () => context.go(AppRoutes.community),
          ),
          for (final hazard in hazards.take(3))
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                tileColor: theme.colorScheme.surfaceContainer,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(18),
                ),
                leading:
                    Icon(hazard.category.icon, color: theme.colorScheme.error),
                title: Text(hazard.category.label),
                subtitle: Text(
                  hazard.description,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                trailing: Text(
                  Formatters.relative(hazard.createdAt),
                  style: theme.textTheme.labelSmall,
                ),
                onTap: () => context.go(AppRoutes.community),
              ),
            ),
        ],
        if (tips.isNotEmpty) ...[
          const SectionHeader('For you today'),
          Card(
            child: Column(
              children: [
                for (final tip in tips)
                  ListTile(
                    leading: Icon(tip.icon, color: theme.colorScheme.primary),
                    title: Text(tip.text, style: theme.textTheme.bodyMedium),
                  ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}

class _RiskHeroCard extends ConsumerWidget {
  const _RiskHeroCard({required this.weather});

  final WeatherBundle weather;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final palette = context.riskPalette;
    final assessment = ref.watch(currentAssessmentProvider)!;
    final level = assessment.level;
    final current = weather.current;

    return Container(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 8),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            palette.containerOf(level),
            theme.colorScheme.surfaceContainer,
          ],
        ),
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: palette.of(level).withValues(alpha: 0.35)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              RiskBadge(level),
              const Spacer(),
              Text(
                WeatherCodes.describe(current.weatherCode),
                style: theme.textTheme.labelMedium?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                Formatters.temp(current.tempC),
                style: theme.textTheme.displayLarge,
              ),
              const SizedBox(width: 12),
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Text(
                  'feels like\n${Formatters.tempFull(current.feelsLikeC)}',
                  style: theme.textTheme.titleSmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ),
            ],
          ),
          Text(level.headline, style: theme.textTheme.titleMedium),
          WhyThisRating(factors: assessment.factors),
        ],
      ),
    );
  }
}

class _MetricsGrid extends StatelessWidget {
  const _MetricsGrid({required this.weather});

  final WeatherBundle weather;

  @override
  Widget build(BuildContext context) {
    final current = weather.current;
    final aqi = weather.usAqi;
    return Row(
      children: [
        Expanded(
          child: StatTile(
            icon: Icons.water_drop_outlined,
            label: 'Humidity',
            value: '${current.humidity.round()}%',
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: StatTile(
            icon: Icons.wb_sunny_outlined,
            label: 'UV index',
            value: current.uvIndex.toStringAsFixed(0),
            caption: _uvBand(current.uvIndex),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: StatTile(
            icon: Icons.air,
            label: 'Air (AQI)',
            value: aqi?.toString() ?? '—',
            caption: aqi == null ? 'unavailable' : _aqiBand(aqi),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: StatTile(
            icon: Icons.speed,
            label: 'Wind',
            value: '${current.windKmh.round()}',
            caption: 'km/h',
          ),
        ),
      ],
    );
  }

  /// WHO UV index bands.
  static String _uvBand(double uv) {
    if (uv < 3) return 'low';
    if (uv < 6) return 'moderate';
    if (uv < 8) return 'high';
    if (uv < 11) return 'very high';
    return 'extreme';
  }

  /// US EPA AQI bands.
  static String _aqiBand(int aqi) {
    if (aqi <= 50) return 'good';
    if (aqi <= 100) return 'moderate';
    if (aqi <= 150) return 'sensitive';
    if (aqi <= 200) return 'unhealthy';
    return 'hazardous';
  }
}

class _HourlyChart extends StatelessWidget {
  const _HourlyChart({required this.weather});

  final WeatherBundle weather;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final now = DateTime.now();
    final start = DateTime(now.year, now.month, now.day, now.hour);
    final points = weather.hourly
        .where((h) => !h.time.isBefore(start))
        .take(24)
        .toList();
    if (points.length < 2) return const SizedBox.shrink();

    final spots = [
      for (var i = 0; i < points.length; i++)
        FlSpot(i.toDouble(), points[i].feelsLikeC),
    ];
    final minY =
        points.map((p) => p.feelsLikeC).reduce((a, b) => a < b ? a : b);
    final maxY =
        points.map((p) => p.feelsLikeC).reduce((a, b) => a > b ? a : b);

    return Card(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(12, 20, 20, 8),
        child: SizedBox(
          height: 160,
          child: LineChart(
            LineChartData(
              minY: (minY - 2).floorToDouble(),
              maxY: (maxY + 2).ceilToDouble(),
              gridData: FlGridData(
                show: true,
                drawVerticalLine: false,
                getDrawingHorizontalLine: (value) => FlLine(
                  color: theme.colorScheme.outlineVariant.withValues(alpha: 0.3),
                  strokeWidth: 1,
                ),
              ),
              titlesData: FlTitlesData(
                topTitles:
                    const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                rightTitles:
                    const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                leftTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    reservedSize: 34,
                    getTitlesWidget: (value, meta) => Text(
                      '${value.round()}°',
                      style: theme.textTheme.labelSmall,
                    ),
                  ),
                ),
                bottomTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    interval: 6,
                    getTitlesWidget: (value, meta) {
                      final i = value.round();
                      if (i < 0 || i >= points.length) {
                        return const SizedBox.shrink();
                      }
                      return Padding(
                        padding: const EdgeInsets.only(top: 6),
                        child: Text(
                          Formatters.hour(points[i].time),
                          style: theme.textTheme.labelSmall,
                        ),
                      );
                    },
                  ),
                ),
              ),
              borderData: FlBorderData(show: false),
              lineTouchData: LineTouchData(
                touchTooltipData: LineTouchTooltipData(
                  getTooltipItems: (touched) => [
                    for (final spot in touched)
                      LineTooltipItem(
                        '${Formatters.hour(points[spot.x.round()].time)}\n'
                        'feels like ${Formatters.tempFull(spot.y)}',
                        theme.textTheme.labelMedium!,
                      ),
                  ],
                ),
              ),
              lineBarsData: [
                LineChartBarData(
                  spots: spots,
                  isCurved: true,
                  barWidth: 3,
                  color: theme.colorScheme.primary,
                  dotData: const FlDotData(show: false),
                  belowBarData: BarAreaData(
                    show: true,
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        theme.colorScheme.primary.withValues(alpha: 0.25),
                        theme.colorScheme.primary.withValues(alpha: 0.0),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _HighRiskStrip extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final palette = context.riskPalette;
    final hours = ref.watch(highRiskHoursProvider);
    final risky = hours
        .where((h) => h.assessment.level.index >= RiskLevel.orange.index)
        .toList();
    if (risky.isEmpty) {
      return Padding(
        padding: const EdgeInsets.only(top: 12),
        child: Row(
          children: [
            Icon(Icons.check_circle_outline,
                size: 18, color: palette.green),
            const SizedBox(width: 8),
            Text(
              'No high-risk hours left today',
              style: theme.textTheme.labelMedium,
            ),
          ],
        ),
      );
    }
    return Padding(
      padding: const EdgeInsets.only(top: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('High-risk hours ahead', style: theme.textTheme.labelMedium),
          const SizedBox(height: 8),
          SizedBox(
            height: 40,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: risky.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, i) {
                final entry = risky[i];
                final color = palette.of(entry.assessment.level);
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  decoration: BoxDecoration(
                    color: palette.containerOf(entry.assessment.level),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Center(
                    child: Text(
                      '${Formatters.hour(entry.hour.time)} · '
                      '${Formatters.temp(entry.hour.feelsLikeC)}',
                      style: theme.textTheme.labelMedium?.copyWith(
                        color: color,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _PlanPreviewTile extends ConsumerWidget {
  const _PlanPreviewTile({required this.planId});

  final String planId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final plan = ref.watch(planByIdProvider(planId));
    final analysis = ref.watch(planAssessmentProvider(planId));
    if (plan == null) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        tileColor: theme.colorScheme.surfaceContainer,
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        leading: Icon(plan.activity.icon),
        title: Text(plan.title),
        subtitle: Text(
          '${Formatters.dayShort(plan.leaveAt)} · ${Formatters.time(plan.leaveAt)}',
        ),
        trailing: analysis != null && !analysis.forecastUnavailable
            ? RiskBadge(analysis.assessment.level, compact: true)
            : null,
        onTap: () => context.push(AppRoutes.planDetail(planId)),
      ),
    );
  }
}
