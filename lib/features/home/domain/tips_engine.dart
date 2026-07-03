import 'package:flutter/material.dart';

import '../../../core/domain/profile/user_profile.dart';
import '../../../core/domain/risk/risk_level.dart';
import '../../weather/data/weather_models.dart';

class DailyTip {
  const DailyTip({required this.icon, required this.text});

  final IconData icon;
  final String text;
}

/// Rule-based daily tips: today's conditions × this user's profile.
/// Max three, so they stay read-able rather than wallpaper.
abstract final class TipsEngine {
  static List<DailyTip> forToday({
    required RiskLevel level,
    required WeatherBundle weather,
    UserProfile? profile,
  }) {
    final tips = <DailyTip>[];
    final uv = weather.current.uvIndex;
    final aqi = weather.usAqi;

    if (level >= RiskLevel.orange) {
      tips.add(const DailyTip(
        icon: Icons.schedule,
        text: 'Shift errands to before 11 AM or after 5 PM — the midday '
            'window does the damage today.',
      ));
    } else if (level == RiskLevel.yellow) {
      tips.add(const DailyTip(
        icon: Icons.water_drop_outlined,
        text: 'Warm enough to matter: keep a bottle with you and drink '
            'before you feel thirsty.',
      ));
    } else {
      tips.add(const DailyTip(
        icon: Icons.directions_walk,
        text: 'A good day to be outdoors — if you have outdoor tasks '
            'pending, today is the day.',
      ));
    }

    if (uv >= 8) {
      tips.add(const DailyTip(
        icon: Icons.wb_sunny_outlined,
        text: 'UV is in the "very high" band — cap or umbrella even for '
            'short walks, and sunscreen if you\'ll be out over 15 minutes.',
      ));
    }
    if (aqi != null && aqi >= 151) {
      tips.add(const DailyTip(
        icon: Icons.masks_outlined,
        text: 'Air quality is unhealthy today. Skip strenuous outdoor '
            'exercise; heat and pollution strain the same systems.',
      ));
    }

    if (profile != null && tips.length < 3) {
      if (profile.occupation.isOutdoor) {
        tips.add(const DailyTip(
          icon: Icons.park_outlined,
          text: 'Working outdoors: schedule your breaks in shade *before* '
              'you feel drained — recovery is faster that way.',
        ));
      } else if (profile.cooling == CoolingType.none &&
          level >= RiskLevel.yellow) {
        tips.add(const DailyTip(
          icon: Icons.nightlight_outlined,
          text: 'No cooling at home: wet-cloth wipe-downs and cross '
              'ventilation after sunset make sleep genuinely cooler.',
        ));
      } else if (profile.healthConditions.isNotEmpty &&
          level >= RiskLevel.yellow) {
        tips.add(const DailyTip(
          icon: Icons.medication_outlined,
          text: 'Keep today\'s medication on schedule — heat stress and '
              'missed doses compound each other.',
        ));
      }
    }
    return tips.take(3).toList();
  }
}
