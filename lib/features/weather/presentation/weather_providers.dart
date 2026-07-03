import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/domain/risk/risk_engine.dart';
import '../../profile/presentation/profile_controller.dart';
import '../data/weather_models.dart';
import '../data/weather_repository.dart';

/// Weather for the user's home location. Auto-refetches when the home
/// location changes; `refresh` is wired to pull-to-refresh on Home.
final weatherProvider = AsyncNotifierProvider<WeatherController, WeatherBundle>(
  WeatherController.new,
);

class WeatherController extends AsyncNotifier<WeatherBundle> {
  @override
  Future<WeatherBundle> build() {
    final home = ref.watch(
      profileControllerProvider.select((p) => p?.home),
    );
    if (home == null) {
      throw StateError('Weather requested before onboarding completed');
    }
    return ref.read(weatherRepositoryProvider).load(
          home.latitude,
          home.longitude,
        );
  }

  Future<void> refresh() async {
    // Keep showing current data while refreshing; only replace on success.
    final result = await AsyncValue.guard(() => build());
    if (!result.hasError) state = result;
  }
}

/// Risk assessment of *right now* for *this user* — the Home hero card.
final currentAssessmentProvider = Provider<RiskAssessment?>((ref) {
  final weather = ref.watch(weatherProvider).valueOrNull;
  if (weather == null) return null;
  final profile = ref.watch(profileControllerProvider);
  return RiskEngine.assess(
    conditions: ConditionsInput(
      tempC: weather.current.tempC,
      relativeHumidity: weather.current.humidity,
      uvIndex: weather.current.uvIndex,
      usAqi: weather.usAqi,
    ),
    profile: profile,
  );
});

/// Today's hours (from now onward) whose ambient conditions reach
/// orange-or-worse — rendered as the "high-risk hours" strip.
final highRiskHoursProvider = Provider<List<HourlyRisk>>((ref) {
  final weather = ref.watch(weatherProvider).valueOrNull;
  if (weather == null) return const [];
  final profile = ref.watch(profileControllerProvider);
  final now = DateTime.now();
  return [
    for (final h in weather.hoursOf(now))
      if (!h.time.isBefore(DateTime(now.year, now.month, now.day, now.hour)))
        HourlyRisk(
          hour: h,
          assessment: RiskEngine.assess(
            conditions: ConditionsInput(
              tempC: h.tempC,
              relativeHumidity: h.humidity,
              uvIndex: h.uvIndex,
              usAqi: weather.usAqi,
            ),
            profile: profile,
          ),
        ),
  ];
});

class HourlyRisk {
  const HourlyRisk({required this.hour, required this.assessment});

  final HourlyPoint hour;
  final RiskAssessment assessment;
}
