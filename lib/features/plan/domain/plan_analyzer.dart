import 'package:flutter/material.dart';

import '../../../core/domain/profile/user_profile.dart';
import '../../../core/domain/risk/risk_engine.dart';
import '../../../core/domain/risk/risk_level.dart';
import '../../community/data/report_model.dart';
import '../../weather/data/weather_models.dart';
import '../data/plan_model.dart';

/// One item on the preparation checklist. Every item carries the reason it
/// was suggested — same transparency rule as the risk engine.
class ChecklistItem {
  const ChecklistItem({
    required this.label,
    required this.reason,
    required this.icon,
  });

  final String label;
  final String reason;
  final IconData icon;
}

/// A concretely better time window for the same plan, if one exists today.
class BetterWindow {
  const BetterWindow({
    required this.leaveAt,
    required this.level,
    required this.peakHeatIndexC,
  });

  final DateTime leaveAt;
  final RiskLevel level;
  final double peakHeatIndexC;
}

class PlanAssessment {
  const PlanAssessment({
    required this.assessment,
    required this.worstHour,
    required this.checklist,
    required this.betterWindow,
    required this.nearbyResources,
    this.forecastUnavailable = false,
  });

  final RiskAssessment assessment;

  /// The hour inside the plan window with the highest heat index.
  final HourlyPoint? worstHour;
  final List<ChecklistItem> checklist;
  final BetterWindow? betterWindow;
  final List<CommunityReport> nearbyResources;

  /// True when the plan is beyond the 7-day forecast horizon.
  final bool forecastUnavailable;
}

/// Turns (plan + forecast + profile + community) into an explainable verdict.
abstract final class PlanAnalyzer {
  static PlanAssessment analyze({
    required Plan plan,
    required WeatherBundle weather,
    UserProfile? profile,
    List<CommunityReport> resources = const [],
  }) {
    final window = _hoursIn(weather, plan.leaveAt, plan.returnAt);
    if (window.isEmpty) {
      // Beyond forecast horizon: assess nothing rather than invent numbers.
      return PlanAssessment(
        assessment: RiskEngine.assess(
          conditions: ConditionsInput(
            tempC: weather.current.tempC,
            relativeHumidity: weather.current.humidity,
          ),
        ),
        worstHour: null,
        checklist: const [],
        betterWindow: null,
        nearbyResources: const [],
        forecastUnavailable: true,
      );
    }

    // Judge the plan by its worst hour — heat safety is about peaks.
    final worst = window.reduce(
      (a, b) => a.feelsLikeC >= b.feelsLikeC ? a : b,
    );
    final planContext = PlanContext(
      isOutdoor: plan.isOutdoor,
      durationMinutes: plan.durationMinutes,
      exertion: plan.activity.exertion,
    );
    final assessment = RiskEngine.assess(
      conditions: ConditionsInput(
        tempC: worst.tempC,
        relativeHumidity: worst.humidity,
        uvIndex: worst.uvIndex,
        usAqi: weather.usAqi,
      ),
      profile: profile,
      plan: planContext,
    );

    return PlanAssessment(
      assessment: assessment,
      worstHour: worst,
      checklist: _buildChecklist(plan, assessment, worst, profile),
      betterWindow: _findBetterWindow(
        plan: plan,
        weather: weather,
        profile: profile,
        planContext: planContext,
        currentLevel: assessment.level,
      ),
      nearbyResources: _nearest(resources, plan),
    );
  }

  static List<HourlyPoint> _hoursIn(
    WeatherBundle weather,
    DateTime from,
    DateTime to,
  ) {
    // Include the hour containing `from` even when leaving mid-hour.
    final start = DateTime(from.year, from.month, from.day, from.hour);
    return weather.hourly
        .where((h) => !h.time.isBefore(start) && !h.time.isAfter(to))
        .toList();
  }

  /// Scans same-duration windows on the plan's day (05:00–22:00 start times)
  /// for a band strictly lower than the current one. Only suggests windows
  /// that haven't already passed.
  static BetterWindow? _findBetterWindow({
    required Plan plan,
    required WeatherBundle weather,
    required UserProfile? profile,
    required PlanContext planContext,
    required RiskLevel currentLevel,
  }) {
    if (currentLevel == RiskLevel.green) return null;

    final day = plan.leaveAt;
    final now = DateTime.now();
    BetterWindow? best;

    for (var hour = 5; hour <= 22; hour++) {
      final start = DateTime(day.year, day.month, day.day, hour);
      if (start.isBefore(now)) continue;
      final end = start.add(Duration(minutes: plan.durationMinutes));
      final window = _hoursIn(weather, start, end);
      if (window.isEmpty) continue;

      final worst = window.reduce(
        (a, b) => a.feelsLikeC >= b.feelsLikeC ? a : b,
      );
      final level = RiskEngine.assess(
        conditions: ConditionsInput(
          tempC: worst.tempC,
          relativeHumidity: worst.humidity,
          uvIndex: worst.uvIndex,
          usAqi: weather.usAqi,
        ),
        profile: profile,
        plan: planContext,
      ).level;

      if (level.index < currentLevel.index &&
          (best == null || level.index < best.level.index)) {
        best = BetterWindow(
          leaveAt: start,
          level: level,
          peakHeatIndexC: worst.feelsLikeC,
        );
        if (level == RiskLevel.green) break; // Can't do better than green.
      }
    }
    return best;
  }

  static List<ChecklistItem> _buildChecklist(
    Plan plan,
    RiskAssessment assessment,
    HourlyPoint worst,
    UserProfile? profile,
  ) {
    final items = <ChecklistItem>[];
    final level = assessment.level;

    if (level >= RiskLevel.yellow) {
      // Deliberately qualitative, not a precise litre count: how much a person
      // actually needs varies with body, pace and sweat. We give an honest
      // "carry more than enough + drink on a schedule" rather than fake
      // precision. The schedule itself is the citable CDC guidance.
      final longOrHard = plan.durationMinutes >= 90 ||
          plan.activity.exertion == ExertionLevel.heavy;
      items.add(ChecklistItem(
        label: longOrHard
            ? 'Carry plenty of water — more than you think you\'ll need'
            : 'Carry water and sip regularly',
        reason: 'CDC guidance: about a cup every 15–20 minutes in the heat. '
            'Thirst lags dehydration — drink on schedule, not on thirst.',
        icon: Icons.water_drop,
      ));
    }
    if (plan.isOutdoor && worst.uvIndex >= 3) {
      items.add(ChecklistItem(
        label: 'Sun protection: cap/umbrella + sunscreen',
        reason:
            'UV index reaches ${worst.uvIndex.toStringAsFixed(0)} during your '
            'window — the WHO recommends protection from UV 3 upward.',
        icon: Icons.wb_sunny_outlined,
      ));
    }
    if (level >= RiskLevel.yellow) {
      items.add(const ChecklistItem(
        label: 'Light, loose, light-coloured clothing',
        reason: 'Dark and tight clothing traps heat; cotton breathes.',
        icon: Icons.checkroom,
      ));
    }
    if (level >= RiskLevel.orange && plan.isOutdoor) {
      items.add(const ChecklistItem(
        label: 'Plan a shaded break every 30 minutes',
        reason: 'Regular cooling breaks are the single most effective '
            'occupational heat control (NIOSH).',
        icon: Icons.park_outlined,
      ));
      items.add(const ChecklistItem(
        label: 'Carry ORS / electrolyte sachet',
        reason: 'Long sweating spells lose salt as well as water; plain '
            'water alone may not be enough beyond a couple of hours.',
        icon: Icons.medication_liquid,
      ));
    }
    if (level == RiskLevel.red) {
      items.add(const ChecklistItem(
        label: 'Reconsider or shorten this plan',
        reason: 'Conditions reach the danger band. If it cannot move, cut '
            'the outdoor portion and tell someone where you are.',
        icon: Icons.warning_amber,
      ));
      items.add(const ChecklistItem(
        label: 'Go with someone / share live location',
        reason: 'Heat stroke can impair judgement before you notice — a '
            'buddy spots the signs first.',
        icon: Icons.group_outlined,
      ));
    }
    if (profile != null && profile.healthConditions.isNotEmpty) {
      items.add(ChecklistItem(
        label: 'Take your medication and keep it with you',
        reason:
            '${profile.healthConditions.map((c) => c.label).join(', ')} — '
            'heat interacts with several conditions and medications.',
        icon: Icons.medical_information_outlined,
      ));
    }
    if (plan.transport == TransportMode.walking ||
        plan.transport == TransportMode.bicycle) {
      items.add(const ChecklistItem(
        label: 'Pick the shaded side of the street',
        reason: 'Surface and radiant heat on unshaded pavement can add '
            'several degrees to what you actually experience.',
        icon: Icons.directions_walk,
      ));
    }
    items.add(const ChecklistItem(
      label: 'Phone charged before leaving',
      reason: 'Emergency calls and this app\'s alerts both need battery.',
      icon: Icons.battery_charging_full,
    ));
    return items;
  }

  /// Up to three community resources closest to the destination.
  static List<CommunityReport> _nearest(
    List<CommunityReport> resources,
    Plan plan,
  ) {
    final sorted = [...resources]..sort((a, b) {
        double d2(CommunityReport r) {
          final dLat = r.latitude - plan.destination.latitude;
          final dLng = r.longitude - plan.destination.longitude;
          return dLat * dLat + dLng * dLng;
        }

        return d2(a).compareTo(d2(b));
      });
    return sorted.take(3).toList();
  }
}
