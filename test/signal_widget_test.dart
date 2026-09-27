import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:heatnav/core/i18n/app_language.dart';
import 'package:heatnav/core/storage/local_store.dart';
import 'package:heatnav/core/theme/app_theme.dart';
import 'package:heatnav/core/utils/clock.dart';
import 'package:heatnav/features/signal/data/signal_repository.dart';
import 'package:heatnav/features/signal/data/signal_scanner.dart';
import 'package:heatnav/features/signal/domain/signal_parser.dart';
import 'package:heatnav/features/signal/domain/signal_reading.dart';
import 'package:heatnav/features/signal/presentation/signal_card.dart';
import 'package:shared_preferences/shared_preferences.dart';

final _t0 = DateTime(2026, 5, 20, 14, 32);

SignalReading _red({bool simulated = false}) => SignalReading(
      wbgt: 31.4,
      globe: 36.0,
      wet: 29.4,
      air: 36.0,
      band: 3,
      rssi: -60,
      at: _t0,
      simulated: simulated,
    );

class _FakeScanner implements SignalScanner {
  _FakeScanner({this.name, this.error});

  final String? name;
  final SignalError? error;

  @override
  Future<List<SignalAdvert>> scan(Duration duration) async {
    if (error != null) throw SignalScanException(error!);
    return [
      if (name != null) SignalAdvert(deviceId: 'pole', name: name!, rssi: -60),
    ];
  }
}

Future<void> _pumpCard(
  WidgetTester tester, {
  SignalReading? stored,
  DateTime? now,
  Locale locale = const Locale('en'),
  SignalScanner? scanner,
}) async {
  SharedPreferences.setMockInitialValues({
    if (stored != null) ...{
      SignalRepository.lastKey: jsonEncode(stored.toJson()),
      SignalRepository.historyKey: jsonEncode([stored.toJson()]),
    },
  });
  final prefs = await SharedPreferences.getInstance();
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        sharedPreferencesProvider.overrideWithValue(prefs),
        currentTimeProvider.overrideWithValue(now ?? _t0),
        if (scanner != null)
          bleSignalScannerProvider.overrideWithValue(scanner),
      ],
      child: MaterialApp(
        theme: AppTheme.light(),
        locale: locale,
        supportedLocales: AppLanguage.supportedLocales,
        localizationsDelegates: const [
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        home: const Scaffold(body: SingleChildScrollView(child: SignalCard())),
      ),
    ),
  );
  await tester.pump();
}

void main() {
  testWidgets('not synced yet: Sync button and the one-line pitch', (
    tester,
  ) async {
    await _pumpCard(tester);
    expect(find.text('HeatNav Signal'), findsOneWidget);
    expect(find.text('Measures the heat right where you are.'), findsOneWidget);
    expect(find.text('Sync'), findsOneWidget);
    expect(find.text('SIMULATED'), findsNothing);
  });

  testWidgets('fresh reading: WBGT, band, work/rest rule, probes, age', (
    tester,
  ) async {
    await _pumpCard(
      tester,
      stored: _red(),
      now: _t0.add(const Duration(minutes: 4)),
    );
    expect(find.text('31.4'), findsOneWidget);
    expect(find.text('Red'), findsOneWidget);
    expect(find.text('20 min work / 40 rest'), findsOneWidget);
    expect(find.text('~1 L per hour'), findsOneWidget);
    expect(
      find.text('Globe 36.0° · Wet bulb 29.4° · Air 36.0°'),
      findsOneWidget,
    );
    expect(find.text('measured 4 min ago'), findsOneWidget);
    expect(find.text('may be out of date — sync again'), findsNothing);
    expect(find.byType(ColorFiltered), findsNothing);
  });

  testWidgets('30–60 min old: greyed, with "may be out of date"', (
    tester,
  ) async {
    await _pumpCard(
      tester,
      stored: _red(),
      now: _t0.add(const Duration(minutes: 45)),
    );
    expect(find.text('31.4'), findsOneWidget);
    expect(find.text('may be out of date — sync again'), findsOneWidget);
    expect(find.byType(ColorFiltered), findsOneWidget);
  });

  testWidgets('over 60 min old: no longer shown as current', (tester) async {
    await _pumpCard(
      tester,
      stored: _red(),
      now: _t0.add(const Duration(minutes: 61)),
    );
    expect(find.text('31.4'), findsNothing);
    expect(find.text('Measures the heat right where you are.'), findsOneWidget);
    expect(
      find.text(
        'Last reading is over an hour old — kept in history, not '
        'used for ratings.',
      ),
      findsOneWidget,
    );
    expect(find.text('Sync'), findsOneWidget);
  });

  testWidgets('Hindi: band and work/rest rule are translated', (tester) async {
    await _pumpCard(
      tester,
      stored: _red(),
      now: _t0.add(const Duration(minutes: 4)),
      locale: const Locale('hi'),
    );
    expect(find.text('लाल'), findsOneWidget);
    expect(find.text('20 मिनट काम / 40 मिनट आराम'), findsOneWidget);
    expect(find.text('4 मिनट पहले मापा गया'), findsOneWidget);
  });

  testWidgets('a stored simulated reading is dropped at startup', (
    tester,
  ) async {
    await _pumpCard(
      tester,
      stored: _red(simulated: true),
      now: _t0.add(const Duration(minutes: 4)),
    );
    // Simulation always starts off, so rehearsal data never shows as real.
    expect(find.text('31.4'), findsNothing);
    expect(find.text('SIMULATED'), findsNothing);
  });

  testWidgets('tapping Sync reads the nearest Signal', (tester) async {
    await _pumpCard(
      tester,
      now: DateTime.now(),
      scanner: _FakeScanner(name: 'HNS-${296}-400-260-340-2'),
    );
    await tester.tap(find.text('Sync'));
    await tester.pump();
    await tester.pump();
    expect(find.text('29.6'), findsOneWidget);
    expect(find.text('Orange'), findsOneWidget);
    expect(find.text('30 min work / 30 rest'), findsOneWidget);
    expect(find.text('Sync again'), findsOneWidget);
  });

  testWidgets('a failed sync shows a plain-language error', (tester) async {
    await _pumpCard(
      tester,
      scanner: _FakeScanner(error: SignalError.bluetoothOff),
    );
    await tester.tap(find.text('Sync'));
    await tester.pump();
    await tester.pump();
    expect(find.text(SignalError.bluetoothOff.message), findsOneWidget);
    expect(find.textContaining('Exception'), findsNothing);
  });

  testWidgets('no device anywhere: clear "not found", nothing breaks', (
    tester,
  ) async {
    await _pumpCard(tester, scanner: _FakeScanner());
    await tester.tap(find.text('Sync'));
    await tester.pump();
    await tester.pump();
    expect(find.text(SignalError.notFound.message), findsOneWidget);
    expect(find.text('Sync'), findsOneWidget);
  });

  test('prefix constant matches the documented payload', () {
    expect(SignalParser.prefix, 'HNS-');
  });
}
