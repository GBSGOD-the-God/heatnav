import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:heatnav/core/domain/place.dart';
import 'package:heatnav/core/domain/profile/user_profile.dart';
import 'package:heatnav/core/domain/risk/risk_level.dart';
import 'package:heatnav/core/i18n/app_localizations.dart';
import 'package:heatnav/core/storage/local_store.dart';
import 'package:heatnav/core/utils/clock.dart';
import 'package:heatnav/features/signal/data/signal_repository.dart';
import 'package:heatnav/features/signal/data/signal_scanner.dart';
import 'package:heatnav/features/signal/domain/signal_band.dart';
import 'package:heatnav/features/signal/domain/signal_freshness.dart';
import 'package:heatnav/features/signal/domain/signal_log.dart';
import 'package:heatnav/features/signal/domain/signal_parser.dart';
import 'package:heatnav/features/signal/domain/signal_rating.dart';
import 'package:heatnav/features/signal/domain/signal_reading.dart';
import 'package:heatnav/features/weather/presentation/weather_providers.dart';
import 'package:shared_preferences/shared_preferences.dart';

final _t0 = DateTime(2026, 5, 20, 14, 32);

SignalReading _reading({
  int band = 3,
  double wbgt = 31.4,
  DateTime? at,
  bool simulated = false,
}) =>
    SignalReading(
      wbgt: wbgt,
      globe: 36.0,
      wet: 29.4,
      air: 36.0,
      band: band,
      rssi: -60,
      at: at ?? _t0,
      simulated: simulated,
    );

UserProfile _profile({
  AgeGroup age = AgeGroup.adult,
  Set<HealthCondition> health = const {},
}) =>
    UserProfile(
      name: 'Test',
      ageGroup: age,
      occupation: Occupation.officeWorker,
      outdoorHours: OutdoorHours.oneToThree,
      transport: TransportMode.walking,
      healthConditions: health,
      homeType: HomeType.apartment,
      cooling: CoolingType.fan,
      powerCuts: PowerCutFrequency.rare,
      home: const Place(label: 'Home', latitude: 21.1, longitude: 79.1),
    );

class _FakeScanner implements SignalScanner {
  _FakeScanner({this.adverts = const [], this.error});

  final List<SignalAdvert> adverts;
  final SignalError? error;

  @override
  Future<List<SignalAdvert>> scan(Duration duration) async {
    if (error != null) throw SignalScanException(error!);
    return adverts;
  }
}

Future<LocalStore> _store([Map<String, Object> values = const {}]) async {
  SharedPreferences.setMockInitialValues(values);
  return LocalStore(await SharedPreferences.getInstance());
}

void main() {
  group('SignalParser', () {
    test('parses the documented example', () {
      final r = SignalParser.parse(
        'HNS-314-360-294-360-3',
        rssi: -61,
        at: _t0,
      )!;
      expect(r.wbgt, 31.4);
      expect(r.globe, 36.0);
      expect(r.wet, 29.4);
      expect(r.air, 36.0);
      expect(r.band, 3);
      expect(r.signalBand, SignalBand.red);
      expect(r.rssi, -61);
      expect(r.at, _t0);
      expect(r.simulated, isFalse);
    });

    test('accepts every band 0..4 and short values', () {
      for (var band = 0; band <= 4; band++) {
        expect(
          SignalParser.parse('HNS-5-0-99-999-$band', rssi: 0, at: _t0)?.band,
          band,
        );
      }
      expect(
        SignalParser.parse('HNS-5-0-99-999-0', rssi: 0, at: _t0)!.air,
        99.9,
      );
    });

    test('tolerates surrounding whitespace', () {
      expect(
        SignalParser.parse('  HNS-314-360-294-360-3 ', rssi: 0, at: _t0),
        isNotNull,
      );
    });

    test('rejects truncated names', () {
      for (final name in [
        'HNS-',
        'HNS',
        'HNS-314',
        'HNS-314-360-294',
        'HNS-314-360-294-360',
        'HNS-314-360-294-360-',
      ]) {
        expect(
          SignalParser.parse(name, rssi: 0, at: _t0),
          isNull,
          reason: name,
        );
      }
    });

    test('rejects garbage names', () {
      for (final name in [
        '',
        'ESP32',
        'hns-314-360-294-360-3', // wrong case
        'XHNS-314-360-294-360-3', // wrong prefix
        'HNS-314-360-294-360-3-7', // extra field
        'HNS-abc-360-294-360-3', // not a number
        'HNS-31.4-360-294-360-3', // decimals not allowed
        'HNS-3140-360-294-360-3', // out of range (>99.9 °C)
        'HNS--14-360-294-360-3', // negative / empty field
        'HNS-314-360-294-360-5', // band out of range
        'HNS-314-360-294-360-x', // band not a number
        'HNS-314 360 294 360 3', // wrong separator
        'HNS-314-360-294-360-3\u0000', // trailing junk byte
      ]) {
        expect(
          SignalParser.parse(name, rssi: 0, at: _t0),
          isNull,
          reason: name,
        );
      }
    });
  });

  group('SignalSelector', () {
    SignalAdvert ad(String id, String name, int rssi) =>
        SignalAdvert(deviceId: id, name: name, rssi: rssi);

    test('picks the strongest Signal and ignores other devices', () {
      final s = SignalSelector.select([
        ad('far', 'HNS-250-300-220-300-0', -85),
        ad('phone', 'Galaxy Buds', -30),
        ad('near', 'HNS-314-360-294-360-3', -55),
      ], _t0);
      expect(s.outcome, SelectionOutcome.found);
      expect(s.reading!.band, 3);
      expect(s.reading!.rssi, -55);
    });

    test('uses the latest data from the chosen device', () {
      final s = SignalSelector.select([
        ad('pole', 'HNS-300-360-280-350-2', -50),
        ad('pole', 'HNS-314-360-294-360-3', -58),
      ], _t0);
      expect(s.reading!.wbgt, 31.4);
      expect(s.reading!.rssi, -50, reason: 'strongest RSSI heard');
    });

    test('nothing that looks like a Signal → notFound', () {
      expect(
        SignalSelector.select([ad('x', 'Galaxy Buds', -30)], _t0).outcome,
        SelectionOutcome.notFound,
      );
      expect(SignalSelector.select([], _t0).outcome, SelectionOutcome.notFound);
    });

    test('nearest Signal malformed → badPayload, not a farther pole', () {
      final s = SignalSelector.select([
        ad('near', 'HNS-314-360-294', -50),
        ad('far', 'HNS-250-300-220-300-0', -90),
      ], _t0);
      expect(s.outcome, SelectionOutcome.badPayload);
    });
  });

  group('SignalFreshnessRules', () {
    SignalFreshness at(Duration age) =>
        SignalFreshnessRules.of(_reading(), _t0.add(age));

    test('fresh under 30 minutes', () {
      expect(at(Duration.zero), SignalFreshness.fresh);
      expect(
        at(const Duration(minutes: 29, seconds: 59)),
        SignalFreshness.fresh,
      );
    });

    test('stale from 30 up to 60 minutes', () {
      expect(at(const Duration(minutes: 30)), SignalFreshness.stale);
      expect(
        at(const Duration(minutes: 59, seconds: 59)),
        SignalFreshness.stale,
      );
    });

    test('expired from 60 minutes', () {
      expect(at(const Duration(minutes: 60)), SignalFreshness.expired);
      expect(at(const Duration(hours: 5)), SignalFreshness.expired);
    });

    test('a reading from the future is not trusted', () {
      expect(at(const Duration(minutes: -1)), SignalFreshness.fresh);
      expect(at(const Duration(minutes: -10)), SignalFreshness.expired);
    });

    test('only fresh readings may drive ratings', () {
      bool usable(int minutes) => SignalFreshnessRules.usableForRating(
            _reading(),
            _t0.add(Duration(minutes: minutes)),
          );
      expect(usable(29), isTrue);
      expect(usable(30), isFalse);
      expect(usable(61), isFalse);
    });

    test('a reading applies only to plans underway or about to start', () {
      bool applies(int leaveIn, int returnIn) =>
          SignalFreshnessRules.appliesToPlan(
            leaveAt: _t0.add(Duration(minutes: leaveIn)),
            returnAt: _t0.add(Duration(minutes: returnIn)),
            now: _t0,
          );
      expect(applies(-60, 60), isTrue, reason: 'underway');
      expect(applies(20, 120), isTrue, reason: 'starts within 30 min');
      expect(applies(45, 120), isFalse, reason: 'starts later');
      expect(applies(-180, -60), isFalse, reason: 'already over');
      expect(applies(60 * 24, 60 * 26), isFalse, reason: 'tomorrow');
    });
  });

  group('SignalRating', () {
    test('uses the measured band and says the forecast was not used', () {
      final a = SignalRating.assess(_reading(band: 2, wbgt: 29.6), null);
      expect(a.level, RiskLevel.orange);
      expect(a.isMeasured, isTrue);
      expect(a.heatIndexC, isNull);
      final titles = a.factors.map((f) => f.title).toList();
      expect(titles, [
        'Measured on site',
        'WBGT = 0.7 × wet bulb + 0.2 × globe + 0.1 × air',
        'Work/rest limits',
        'City forecast not used',
      ]);
      expect(a.factors[0].detail, contains('HeatNav Signal, 14:32'));
      expect(a.factors[0].detail, contains('WBGT 29.6 °C'));
      expect(a.factors[1].source, 'ISO 7243');
      expect(a.factors[2].source, 'US Army TB MED 507, heavy work');
    });

    test('personal vulnerability raises one step, as with the forecast', () {
      final yellow = _reading(band: 1, wbgt: 26.6);
      expect(SignalRating.assess(yellow, _profile()).level, RiskLevel.yellow);
      expect(
        SignalRating.assess(yellow, _profile(age: AgeGroup.senior)).level,
        RiskLevel.orange,
      );
      expect(
        SignalRating.assess(
          yellow,
          _profile(health: {HealthCondition.pregnancy}),
        ).level,
        RiskLevel.orange,
      );
    });

    test('green stays green, matching the forecast rule', () {
      final green = _reading(band: 0, wbgt: 24.0);
      expect(
        SignalRating.assess(green, _profile(age: AgeGroup.senior)).level,
        RiskLevel.green,
      );
    });

    test('never lowers: flashing red and raised red stay red', () {
      expect(
        SignalRating.assess(_reading(band: 4, wbgt: 33.0), null).level,
        RiskLevel.red,
      );
      expect(
        SignalRating.assess(
          _reading(band: 3),
          _profile(age: AgeGroup.senior),
        ).level,
        RiskLevel.red,
      );
    });

    test('simulated readings say so in the rating', () {
      final a = SignalRating.assess(_reading(simulated: true), null);
      expect(a.factors.first.detail, contains('SIMULATED'));
    });
  });

  group('Today rating with a Signal (acceptance)', () {
    Future<ProviderContainer> container(Duration age) async {
      final reading = _reading(at: _t0);
      SharedPreferences.setMockInitialValues({
        SignalRepository.lastKey: jsonEncode(reading.toJson()),
        SignalRepository.historyKey: jsonEncode([reading.toJson()]),
      });
      final prefs = await SharedPreferences.getInstance();
      final c = ProviderContainer(
        overrides: [
          sharedPreferencesProvider.overrideWithValue(prefs),
          currentTimeProvider.overrideWithValue(_t0.add(age)),
        ],
      );
      addTearDown(c.dispose);
      return c;
    }

    test(
      'fresh reading rates Today with no forecast and no internet',
      () async {
        final c = await container(const Duration(minutes: 4));
        final a = c.read(currentAssessmentProvider);
        expect(a, isNotNull);
        expect(a!.isMeasured, isTrue);
        expect(a.level, RiskLevel.red);
      },
    );

    test('readings over 30 minutes are ignored by ratings', () async {
      for (final minutes in [30, 45, 61, 180]) {
        final c = await container(Duration(minutes: minutes));
        expect(
          c.read(currentAssessmentProvider),
          isNull,
          reason: '$minutes min old → falls back to forecast (none here)',
        );
      }
    });
  });

  group('SignalRepository', () {
    test('sync stores the reading and it survives an app restart', () async {
      final store = await _store();
      final repo = SignalRepository(store, clock: () => _t0);
      final result = await repo.sync(
        _FakeScanner(
          adverts: const [
            SignalAdvert(
              deviceId: 'p',
              name: 'HNS-314-360-294-360-3',
              rssi: -60,
            ),
          ],
        ),
      );
      expect(result, isA<SignalSyncSuccess>());

      // A new repository over the same storage stands in for a restart.
      final restarted = SignalRepository(
        LocalStore(await SharedPreferences.getInstance()),
      );
      expect(restarted.loadLast()!.wbgt, 31.4);
      expect(restarted.loadHistory(), hasLength(1));
    });

    test('scanner problems come back as typed errors', () async {
      final repo = SignalRepository(await _store());
      for (final error in SignalError.values) {
        final result = await repo.sync(_FakeScanner(error: error));
        expect((result as SignalSyncFailure).error, error);
      }
    });

    test('no Signal / bad payload are typed and store nothing', () async {
      final repo = SignalRepository(await _store());
      final none = await repo.sync(_FakeScanner());
      expect((none as SignalSyncFailure).error, SignalError.notFound);
      final bad = await repo.sync(
        _FakeScanner(
          adverts: const [
            SignalAdvert(deviceId: 'p', name: 'HNS-314-360', rssi: -60),
          ],
        ),
      );
      expect((bad as SignalSyncFailure).error, SignalError.badPayload);
      expect(repo.loadHistory(), isEmpty);
      expect(repo.loadLast(), isNull);
    });

    test('removeSimulated keeps only real readings', () async {
      final repo = SignalRepository(await _store());
      await repo.save(_reading(at: _t0));
      await repo.save(
        _reading(at: _t0.add(const Duration(minutes: 5)), simulated: true),
      );
      expect(await repo.removeSimulated(), isTrue);
      expect(repo.loadHistory().every((r) => !r.simulated), isTrue);
      expect(repo.loadLast()!.simulated, isFalse);
    });

    test('corrupt stored entries are skipped, not fatal', () async {
      final repo = SignalRepository(
        await _store({
          SignalRepository.historyKey: jsonEncode([
            _reading().toJson(),
            {'band': 9},
            {'nonsense': true},
          ]),
        }),
      );
      expect(repo.loadHistory(), hasLength(1));
    });
  });

  group('SimulatedSignalScanner', () {
    test('each sync is hotter and parses like a real device', () async {
      final scanner = SimulatedSignalScanner();
      final bands = <int>[];
      final wbgts = <double>[];
      for (var i = 0; i < 6; i++) {
        final adverts = await scanner.scan(const Duration(seconds: 6));
        final r = SignalParser.parse(adverts.single.name, rssi: -58, at: _t0)!;
        bands.add(r.band);
        wbgts.add(r.wbgt);
        // Encoded WBGT matches ISO 7243 from the encoded probe values.
        expect(
          r.wbgt,
          closeTo(0.7 * r.wet + 0.2 * r.globe + 0.1 * r.air, 0.051),
        );
        expect(SignalBand.forWbgt(r.wbgt).code, r.band);
      }
      expect(bands, [0, 1, 2, 3, 4, 4]);
      for (var i = 1; i < 5; i++) {
        expect(wbgts[i], greaterThan(wbgts[i - 1]));
      }
    });
  });

  group('SignalLog', () {
    test('time in band: each reading covers up to 30 min or the next one', () {
      final day = DateTime(2026, 5, 20);
      DateTime t(int h, int m) => day.add(Duration(hours: h, minutes: m));
      final readings = [
        _reading(band: 3, at: t(10, 0)),
        _reading(band: 3, at: t(10, 20)),
        _reading(band: 2, at: t(11, 30)),
        _reading(
          band: 0,
          at: day.subtract(const Duration(hours: 2)),
        ), // yesterday
      ];
      final result = SignalLog.timeInBand(readings, from: day, to: t(11, 45));
      // Red: 10:00→10:20, then 10:20→10:50 (capped). Gap to 11:30 unknown.
      expect(result[SignalBand.red], const Duration(minutes: 50));
      // Orange: 11:30→11:45 (cut at "now").
      expect(result[SignalBand.orange], const Duration(minutes: 15));
      expect(result.containsKey(SignalBand.green), isFalse);
    });

    test('CSV has measurements only — no names, ids or location', () {
      final csv = SignalLog.toCsv([
        _reading(at: _t0.add(const Duration(minutes: 5)), band: 2, wbgt: 29.6),
        _reading(at: _t0),
      ]);
      final lines = const LineSplitter().convert(csv);
      expect(lines.first, SignalLog.csvHeader);
      expect(lines, hasLength(3));
      expect(lines[1], startsWith('2026-05-20 14:32:00,'));
      expect(lines[1], contains(',31.4,36.0,29.4,36.0,3,red,-60,false'));
      expect(lines[2], contains(',29.6,'));
      for (final banned in ['lat', 'lon', 'name', 'device', 'id']) {
        expect(lines.first.split(','), isNot(contains(banned)));
      }
    });
  });

  group('Hindi coverage', () {
    test('every error, band name and work/rest rule is translated', () {
      final keys = [
        for (final e in SignalError.values) e.message,
        for (final b in SignalBand.values) ...[b.label, b.workRest, b.water],
      ];
      for (final key in keys) {
        expect(
          AppLocalizations.translate('hi', key),
          isNot(key),
          reason: 'missing Hindi for "$key"',
        );
      }
    });
  });
}
