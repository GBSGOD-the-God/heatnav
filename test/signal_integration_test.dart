import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:heatnav/core/domain/place.dart';
import 'package:heatnav/core/domain/profile/user_profile.dart';
import 'package:heatnav/core/domain/risk/risk_level.dart';
import 'package:heatnav/core/storage/local_store.dart';
import 'package:heatnav/core/theme/app_theme.dart';
import 'package:heatnav/core/utils/clock.dart';
import 'package:heatnav/features/plan/data/plan_model.dart';
import 'package:heatnav/features/plan/domain/plan_analyzer.dart';
import 'package:heatnav/features/signal/presentation/signal_card.dart';
import 'package:heatnav/features/signal/presentation/signal_providers.dart';
import 'package:heatnav/features/signal/domain/signal_reading.dart';
import 'package:heatnav/features/weather/data/weather_models.dart';
import 'package:shared_preferences/shared_preferences.dart';

final _now = DateTime(2026, 5, 20, 14, 0);

/// A mild forecast: on its own it rates green.
WeatherBundle _mildForecast() {
  final day = DateTime(2026, 5, 20);
  final hours = [
    for (var h = 0; h < 24; h++)
      HourlyPoint(
        time: day.add(Duration(hours: h)),
        tempC: 22,
        feelsLikeC: 22,
        humidity: 40,
        uvIndex: 2,
        weatherCode: 1,
        precipitationChance: 0,
      ),
  ];
  return WeatherBundle(
    current: CurrentWeather(
      time: _now,
      tempC: 22,
      feelsLikeC: 22,
      humidity: 40,
      uvIndex: 2,
      weatherCode: 1,
      windKmh: 5,
    ),
    hourly: hours,
    usAqi: 40,
    fetchedAt: _now,
  );
}

final _sitePlan = Plan(
  id: 'p1',
  title: 'Site shift',
  activity: ActivityType.siteWork,
  destination: const Place(label: 'Site', latitude: 21.1, longitude: 79.1),
  leaveAt: _now.subtract(const Duration(hours: 1)),
  returnAt: _now.add(const Duration(hours: 3)),
  transport: TransportMode.walking,
  isOutdoor: true,
);

void main() {
  group('Plan My Day with a Signal', () {
    final measured = SignalReading(
      wbgt: 31.4,
      globe: 36.0,
      wet: 29.4,
      air: 36.0,
      band: 3,
      rssi: -60,
      at: _now.subtract(const Duration(minutes: 3)),
    );

    test('without a reading, the mild forecast rates green', () {
      final a = PlanAnalyzer.analyze(plan: _sitePlan, weather: _mildForecast());
      expect(a.assessment.level, RiskLevel.green);
      expect(a.measuredBy, isNull);
    });

    test('a measured reading replaces the forecast band', () {
      final a = PlanAnalyzer.analyze(
        plan: _sitePlan,
        weather: _mildForecast(),
        measured: measured,
      );
      expect(a.assessment.level, RiskLevel.red);
      expect(a.assessment.isMeasured, isTrue);
      expect(a.measuredBy, same(measured));
      expect(
        a.assessment.factors.map((f) => f.title),
        contains('City forecast not used'),
      );
      expect(
        a.checklist.first.label,
        'Signal work/rest: 20 min work / 40 rest',
      );
    });

    test('personal rules still raise a measured band', () {
      final yellow = SignalReading(
        wbgt: 26.6,
        globe: 34.0,
        wet: 23.0,
        air: 32.0,
        band: 1,
        rssi: -60,
        at: _now,
      );
      final a = PlanAnalyzer.analyze(
        plan: _sitePlan,
        weather: _mildForecast(),
        measured: yellow,
        profile: const UserProfile(
          name: '',
          ageGroup: AgeGroup.senior,
          occupation: Occupation.constructionWorker,
          outdoorHours: OutdoorHours.threeToSix,
          transport: TransportMode.walking,
          healthConditions: {},
          homeType: HomeType.tinRoof,
          cooling: CoolingType.fan,
          powerCuts: PowerCutFrequency.rare,
          home: Place(label: 'Home', latitude: 21.1, longitude: 79.1),
        ),
      );
      expect(a.assessment.level, RiskLevel.orange);
    });
  });

  group('Rehearsal simulation', () {
    testWidgets('simulated syncs are tagged and deleted when switched off', (
      tester,
    ) async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      final container = ProviderContainer(
        overrides: [
          sharedPreferencesProvider.overrideWithValue(prefs),
          // Pinned so the 30-second ticker isn't left running at teardown.
          currentTimeProvider.overrideWithValue(DateTime.now()),
        ],
      );
      addTearDown(container.dispose);

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp(
            theme: AppTheme.light(),
            home: const Scaffold(
              body: SingleChildScrollView(child: SignalCard()),
            ),
          ),
        ),
      );

      expect(
        container.read(signalReadingProvider).simulate,
        isFalse,
        reason: 'off by default',
      );
      expect(find.text('SIMULATED'), findsNothing);

      await container.read(signalReadingProvider.notifier).setSimulate(true);
      await tester.pump();
      expect(find.text('SIMULATED'), findsOneWidget);

      await tester.tap(find.text('Sync'));
      await tester.pump();
      expect(find.text('Looking for a Signal nearby…'), findsOneWidget);
      await tester.pump(const Duration(milliseconds: 1300));
      await tester.pump();

      final state = container.read(signalReadingProvider);
      expect(state.last!.simulated, isTrue);
      expect(find.text('25.3'), findsOneWidget);
      expect(find.text('SIMULATED'), findsOneWidget);

      await container.read(signalReadingProvider.notifier).setSimulate(false);
      await tester.pump();
      expect(container.read(signalReadingProvider).history, isEmpty);
      expect(container.read(signalReadingProvider).last, isNull);
      expect(find.text('25.3'), findsNothing);
      expect(find.text('SIMULATED'), findsNothing);
    });
  });
}
