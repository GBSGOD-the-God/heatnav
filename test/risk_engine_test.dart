import 'package:flutter_test/flutter_test.dart';
import 'package:heatnav/core/domain/place.dart';
import 'package:heatnav/core/domain/profile/user_profile.dart';
import 'package:heatnav/core/domain/risk/heat_index.dart';
import 'package:heatnav/core/domain/risk/risk_engine.dart';
import 'package:heatnav/core/domain/risk/risk_level.dart';

UserProfile _profile({
  AgeGroup age = AgeGroup.adult,
  Set<HealthCondition> health = const {},
  CoolingType cooling = CoolingType.fan,
  PowerCutFrequency powerCuts = PowerCutFrequency.rare,
}) {
  return UserProfile(
    name: 'Test',
    ageGroup: age,
    occupation: Occupation.officeWorker,
    outdoorHours: OutdoorHours.oneToThree,
    transport: TransportMode.publicTransport,
    healthConditions: health,
    homeType: HomeType.apartment,
    cooling: cooling,
    powerCuts: powerCuts,
    home: const Place(label: 'Home', latitude: 21.1, longitude: 79.1),
  );
}

void main() {
  group('HeatIndex (NWS reference values)', () {
    test('matches the NWS chart within tolerance', () {
      // NWS chart: 96°F at 65% RH → HI ≈ 121°F (≈49.4°C).
      final hi = HeatIndex.celsius(35.6, 65);
      expect(hi, closeTo(49.4, 1.0));
    });

    test('cool conditions pass through nearly unchanged', () {
      final hi = HeatIndex.celsius(22, 50);
      expect(hi, closeTo(22, 2.0));
    });

    test('humidity drives the difference at equal temperature', () {
      final humid = HeatIndex.celsius(34, 80);
      final dry = HeatIndex.celsius(34, 20);
      expect(humid, greaterThan(dry + 5));
    });
  });

  group('RiskEngine base bands', () {
    test('mild day is green', () {
      final result = RiskEngine.assess(
        conditions: const ConditionsInput(tempC: 24, relativeHumidity: 40),
      );
      expect(result.level, RiskLevel.green);
    });

    test('NWS caution band maps to yellow', () {
      final result = RiskEngine.assess(
        conditions: const ConditionsInput(tempC: 30, relativeHumidity: 50),
      );
      expect(result.level, RiskLevel.yellow);
    });

    test('danger-band heat maps to red', () {
      final result = RiskEngine.assess(
        conditions: const ConditionsInput(tempC: 42, relativeHumidity: 50),
      );
      expect(result.level, RiskLevel.red);
    });
  });

  group('RiskEngine explainability contract', () {
    test('every assessment carries at least the heat-index factor', () {
      final result = RiskEngine.assess(
        conditions: const ConditionsInput(tempC: 30, relativeHumidity: 50),
      );
      expect(result.factors, isNotEmpty);
      expect(result.factors.first.source, contains('NWS'));
    });

    test('band raises are always accompanied by a raising factor', () {
      final base = RiskEngine.assess(
        conditions: const ConditionsInput(tempC: 33, relativeHumidity: 40),
      );
      final withUv = RiskEngine.assess(
        conditions: const ConditionsInput(
          tempC: 33,
          relativeHumidity: 40,
          uvIndex: 10,
        ),
      );
      expect(withUv.level.index, base.level.index + 1);
      expect(withUv.factors.any((f) => f.raisesBand), isTrue);
    });
  });

  group('RiskEngine personalization', () {
    const hotDay = ConditionsInput(tempC: 33, relativeHumidity: 45);

    test('senior profile raises the band by one step', () {
      final adult =
          RiskEngine.assess(conditions: hotDay, profile: _profile());
      final senior = RiskEngine.assess(
        conditions: hotDay,
        profile: _profile(age: AgeGroup.senior),
      );
      expect(senior.level.index, adult.level.index + 1);
      expect(senior.factors.any((f) => f.title == 'Age 65+'), isTrue);
    });

    test('personal factors do not fire on a green day', () {
      const mild = ConditionsInput(tempC: 22, relativeHumidity: 40);
      final senior = RiskEngine.assess(
        conditions: mild,
        profile: _profile(age: AgeGroup.senior),
      );
      expect(senior.level, RiskLevel.green);
    });

    test('multiple personal factors still raise only one step', () {
      final result = RiskEngine.assess(
        conditions: hotDay,
        profile: _profile(
          age: AgeGroup.senior,
          health: {HealthCondition.heartDisease, HealthCondition.diabetes},
          cooling: CoolingType.none,
          powerCuts: PowerCutFrequency.frequent,
        ),
      );
      final adult = RiskEngine.assess(conditions: hotDay, profile: _profile());
      expect(result.level.index, adult.level.index + 1);
    });

    test('band is capped at red', () {
      final result = RiskEngine.assess(
        conditions: const ConditionsInput(
          tempC: 44,
          relativeHumidity: 60,
          uvIndex: 11,
          usAqi: 180,
        ),
        profile: _profile(age: AgeGroup.senior),
        plan: const PlanContext(
          isOutdoor: true,
          durationMinutes: 180,
          exertion: ExertionLevel.heavy,
        ),
      );
      expect(result.level, RiskLevel.red);
    });
  });

  group('RiskEngine plan context', () {
    test('heavy exertion outdoors raises the band', () {
      const conditions = ConditionsInput(tempC: 31, relativeHumidity: 50);
      final idle = RiskEngine.assess(conditions: conditions);
      final cricket = RiskEngine.assess(
        conditions: conditions,
        plan: const PlanContext(
          isOutdoor: true,
          durationMinutes: 120,
          exertion: ExertionLevel.heavy,
        ),
      );
      expect(cricket.level.index, idle.level.index + 1);
    });

    test('indoor plans ignore UV', () {
      const conditions = ConditionsInput(
        tempC: 33,
        relativeHumidity: 40,
        uvIndex: 10,
      );
      final indoor = RiskEngine.assess(
        conditions: conditions,
        plan: const PlanContext(
          isOutdoor: false,
          durationMinutes: 120,
          exertion: ExertionLevel.light,
        ),
      );
      expect(
        indoor.factors.any((f) => f.title == 'Very high UV'),
        isFalse,
      );
    });
  });
}
