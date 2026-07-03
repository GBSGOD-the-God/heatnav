import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:heatnav/app.dart';
import 'package:heatnav/core/domain/place.dart';
import 'package:heatnav/core/domain/profile/user_profile.dart';
import 'package:heatnav/core/storage/local_store.dart';
import 'package:shared_preferences/shared_preferences.dart';

Future<void> _pumpApp(WidgetTester tester) async {
  final prefs = await SharedPreferences.getInstance();
  await tester.pumpWidget(
    ProviderScope(
      overrides: [sharedPreferencesProvider.overrideWithValue(prefs)],
      child: const HeatNavApp(),
    ),
  );
  // Fixed-duration pumps: skeleton/entrance animations repeat, so
  // pumpAndSettle would never settle.
  await tester.pump(const Duration(milliseconds: 700));
}

void main() {
  testWidgets('first launch lands on onboarding', (tester) async {
    SharedPreferences.setMockInitialValues({});
    await _pumpApp(tester);
    expect(find.text('Get started'), findsOneWidget);
  });

  testWidgets('existing profile skips onboarding into the shell',
      (tester) async {
    final profile = UserProfile(
      name: 'Ravi',
      ageGroup: AgeGroup.adult,
      occupation: Occupation.deliveryRider,
      outdoorHours: OutdoorHours.moreThanSix,
      transport: TransportMode.motorbike,
      healthConditions: const {},
      homeType: HomeType.tinRoof,
      cooling: CoolingType.fan,
      powerCuts: PowerCutFrequency.frequent,
      home: const Place(
        label: 'Home',
        latitude: 21.1458,
        longitude: 79.0882,
        city: 'Nagpur',
      ),
    );
    SharedPreferences.setMockInitialValues({
      'user_profile': jsonEncode(profile.toJson()),
    });
    await _pumpApp(tester);

    // The shell's bottom navigation proves the redirect worked; weather
    // itself will fail in tests (no network) and show the offline error UI.
    expect(find.text('Community'), findsOneWidget);
    expect(find.text('Get started'), findsNothing);
  });
}
