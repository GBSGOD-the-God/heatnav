import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:heatnav/core/domain/place.dart';
import 'package:heatnav/core/storage/local_store.dart';
import 'package:heatnav/features/community/data/community_repository.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  late CommunityRepository repo;
  const home = Place(
    label: 'Home',
    latitude: 21.1458,
    longitude: 79.0882,
    city: 'Nagpur',
  );

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    final container = ProviderContainer(
      overrides: [sharedPreferencesProvider.overrideWithValue(prefs)],
    );
    repo = CommunityRepository(container.read(localStoreProvider));
  });

  test('sample feed is stable within the same day', () {
    final now = DateTime(2026, 7, 3, 10);
    final first = repo.loadActive(home, now: now);
    final second = repo.loadActive(home, now: now.add(const Duration(hours: 3)));
    expect(first.map((r) => r.id).toSet(), second.map((r) => r.id).toSet());
  });

  test('sample feed varies across days', () {
    final day1 = repo.loadActive(home, now: DateTime(2026, 7, 3, 10));
    final day2 = repo.loadActive(home, now: DateTime(2026, 7, 4, 10));
    final sameDescriptions = day1.map((r) => r.description).toSet();
    final otherDescriptions = day2.map((r) => r.description).toSet();
    // Extremely unlikely for two independently-seeded random draws to
    // produce an identical set unless the seed ignores the date.
    expect(sameDescriptions, isNot(equals(otherDescriptions)));
  });

  test('sample feed varies across locations on the same day', () {
    const otherCity = Place(
      label: 'Home',
      latitude: 28.6139,
      longitude: 77.2090,
      city: 'Delhi',
    );
    final now = DateTime(2026, 7, 3, 10);
    final here = repo.loadActive(home, now: now);
    final there = repo.loadActive(otherCity, now: now);
    expect(
      here.map((r) => r.description).toSet(),
      isNot(equals(there.map((r) => r.description).toSet())),
    );
  });

  test('every seeded report is labelled as sample data', () {
    final reports = repo.loadActive(home, now: DateTime(2026, 7, 3));
    expect(reports, isNotEmpty);
    expect(reports.every((r) => r.isSample), isTrue);
  });
}
