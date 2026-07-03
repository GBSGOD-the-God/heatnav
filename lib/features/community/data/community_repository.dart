import 'dart:math' as math;

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/domain/place.dart';
import '../../../core/storage/local_store.dart';
import 'report_model.dart';

/// Local-first community repository.
///
/// Cold-start honesty (blueprint §1.2): a live crowd doesn't exist at demo
/// time, so the feed is seeded with a *labelled* sample dataset generated
/// around the user's city. User-submitted reports and votes persist locally.
/// The Firestore-backed implementation slots in behind this same interface.
class CommunityRepository {
  CommunityRepository(this._store);

  final LocalStore _store;

  static const _reportsKey = 'community_reports';
  static const _votesKey = 'community_votes';

  /// All non-expired reports near [home], newest first.
  List<CommunityReport> loadActive(Place home, {DateTime? now}) {
    final current = now ?? DateTime.now();
    final mine = _store
        .readList(_reportsKey)
        .map(CommunityReport.fromJson)
        .toList();
    final all = [..._seedsFor(home, current), ...mine]
      ..removeWhere((r) => r.isExpired(current));

    final votes = myVotes();
    final adjusted = [
      for (final r in all)
        switch (votes[r.id]) {
          1 => r.copyWith(upvotes: r.upvotes + 1),
          -1 => r.copyWith(downvotes: r.downvotes + 1),
          _ => r,
        },
    ]..sort((a, b) => b.createdAt.compareTo(a.createdAt));
    return adjusted;
  }

  Future<CommunityReport> submit({
    required ReportCategory category,
    required String description,
    required double latitude,
    required double longitude,
    required String authorName,
  }) async {
    final report = CommunityReport(
      id: 'user-${DateTime.now().microsecondsSinceEpoch}',
      category: category,
      description: description,
      latitude: latitude,
      longitude: longitude,
      createdAt: DateTime.now(),
      authorName: authorName.isEmpty ? 'You' : authorName,
      isMine: true,
    );
    final existing = _store.readList(_reportsKey);
    await _store.writeList(_reportsKey, [...existing, report.toJson()]);
    return report;
  }

  /// The user's votes: reportId → +1 / -1.
  Map<String, int> myVotes() {
    final json = _store.readObject(_votesKey) ?? const {};
    return json.map((k, v) => MapEntry(k, v as int));
  }

  Future<void> vote(String reportId, int direction) async {
    final votes = myVotes();
    if (votes[reportId] == direction) {
      votes.remove(reportId); // Tapping again withdraws the vote.
    } else {
      votes[reportId] = direction;
    }
    await _store.writeObject(_votesKey, votes);
  }

  /// Randomized-but-stable sample dataset around the user's exact location.
  ///
  /// Cold-start honesty (blueprint §1.2) means this can never look like a
  /// hand-typed fixture: it draws from description/author pools and
  /// randomizes distance, bearing, age and votes. The random seed is derived
  /// from the location and the calendar day, so the feed looks alive (it
  /// changes day to day, and differs city to city) without reshuffling
  /// under the user's finger on every rebuild within the same session.
  /// Every seed is still flagged `isSample` and badged in the UI.
  List<CommunityReport> _seedsFor(Place home, DateTime now) {
    final seed = home.latitude.hashCode ^
        home.longitude.hashCode ^
        (now.year * 372 + now.month * 31 + now.day);
    final random = math.Random(seed);

    CommunityReport place({
      required int index,
      required ReportCategory category,
      required String description,
      required String author,
      required double bearingDeg,
      required double km,
      required Duration age,
      required int upvotes,
      required int downvotes,
    }) {
      // ~111 km per degree latitude; longitude scaled by cos(lat).
      final rad = bearingDeg * math.pi / 180;
      final dLat = (km * math.cos(rad)) / 111.0;
      final dLng = (km * math.sin(rad)) /
          (111.0 * math.cos(home.latitude * math.pi / 180));
      return CommunityReport(
        id: 'sample-$index',
        category: category,
        description: description,
        latitude: home.latitude + dLat,
        longitude: home.longitude + dLng,
        createdAt: now.subtract(age),
        authorName: author,
        upvotes: upvotes,
        downvotes: downvotes,
        isSample: true,
      );
    }

    final reports = <CommunityReport>[];
    var index = 0;

    for (final entry in _seedPool.entries) {
      final category = entry.key;
      final descriptions = entry.value;
      final count = _countRange[category]!;
      final howMany = count.$1 + random.nextInt(count.$2 - count.$1 + 1);
      final usedDescriptions = <String>{};

      for (var i = 0; i < howMany; i++) {
        // Avoid repeating a description for the same category in one feed.
        String description;
        do {
          description = descriptions[random.nextInt(descriptions.length)];
        } while (usedDescriptions.contains(description) &&
            usedDescriptions.length < descriptions.length);
        usedDescriptions.add(description);

        final maxAgeMinutes = category.ttl.inMinutes;
        // Skew toward fresher reports: sample age from the younger 70% of
        // the category's lifetime more often than the tail end.
        final ageMinutes = (random.nextDouble() < 0.7
                ? random.nextDouble() * maxAgeMinutes * 0.5
                : maxAgeMinutes * 0.5 +
                    random.nextDouble() * maxAgeMinutes * 0.45)
            .round()
            .clamp(5, maxAgeMinutes - 2);

        final upvotes = random.nextInt(18);
        // Most reports get few or no downvotes; occasionally a contested one.
        final downvotes = random.nextDouble() < 0.15 ? random.nextInt(6) : 0;

        reports.add(place(
          index: index++,
          category: category,
          description: description,
          author: _authorPool[random.nextInt(_authorPool.length)],
          bearingDeg: random.nextDouble() * 360,
          km: 0.3 + random.nextDouble() * 3.7,
          age: Duration(minutes: ageMinutes),
          upvotes: upvotes,
          downvotes: downvotes,
        ));
      }
    }
    return reports;
  }

  static const _authorPool = [
    'Ravi K.', 'Meena S.', 'Arjun T.', 'Fatima B.', 'Sunil D.', 'Priya M.',
    'Ananya R.', 'Vikram J.', 'Deepa N.', 'Karan P.', 'Neha V.', 'Rohit G.',
    'Kavya L.', 'Imran S.', 'Lakshmi C.', 'Aditya M.', 'City volunteer',
    'Local shopkeeper', 'Municipal worker',
  ];

  /// (min, max) instances of each category to seed per feed.
  static const _countRange = <ReportCategory, (int, int)>{
    ReportCategory.extremeHeat: (1, 3),
    ReportCategory.waterStation: (2, 4),
    ReportCategory.powerCut: (1, 3),
    ReportCategory.shade: (2, 3),
    ReportCategory.coolingCentre: (1, 2),
    ReportCategory.noShade: (1, 2),
    ReportCategory.roadClosed: (0, 2),
    ReportCategory.medicalEmergency: (0, 1),
    ReportCategory.brokenWaterSupply: (0, 2),
  };

  static const _seedPool = <ReportCategory, List<String>>{
    ReportCategory.extremeHeat: [
      'Asphalt radiating badly near the flyover — avoid walking this stretch after noon.',
      'No breeze at all in this lane, feels 4-5 degrees hotter than the main road.',
      'Metal railings and signposts too hot to touch by 11 AM here.',
      'Open ground near the market turns into an oven by midday — steer clear.',
    ],
    ReportCategory.waterStation: [
      'Free chilled water kiosk outside the metro station, refills allowed.',
      'RO water dispenser near the bus stop, works fine and no queue right now.',
      'Temple handing out cold buttermilk and water to anyone who stops by.',
      'Public tap here has decent pressure and is safe for a refill.',
    ],
    ReportCategory.powerCut: [
      'Power gone since morning in the east colony. Inverters running out.',
      'Rolling cuts every 2 hours in this area today, no fixed schedule.',
      'Transformer tripped near the junction, whole block without power.',
      'Low voltage all afternoon — fans barely spinning, AC units struggling.',
    ],
    ReportCategory.shade: [
      'Tree-lined lane behind the market — noticeably cooler than the main road.',
      'Covered walkway by the shops blocks the sun almost all day.',
      'Park path under old banyan trees, easily 5 degrees cooler in here.',
      'Building overhangs create a shaded stretch good for a break.',
    ],
    ReportCategory.coolingCentre: [
      'Community hall open 11 AM–6 PM as a cooling shelter. Drinking water available.',
      'Library has strong AC and lets anyone sit in the reading room to cool off.',
      'Shopping mall food court is a good free spot to escape the heat for a while.',
      'Local NGO has set up a shaded rest tent with water near the crossing.',
    ],
    ReportCategory.noShade: [
      'New road stretch has zero tree cover — brutal between 12 and 4.',
      'Under-construction area, all trees cleared, nowhere to hide from the sun.',
      'Wide open crossing with no awnings — a hard spot to wait for a signal.',
      'This stretch by the highway service road bakes all afternoon.',
    ],
    ReportCategory.roadClosed: [
      'Main road closed for repairs, traffic diverted through the back lane.',
      'Waterlogging near the underpass after last night\'s storm, road blocked.',
      'Construction barricades have shut one lane, expect delays.',
    ],
    ReportCategory.medicalEmergency: [
      'Someone collapsed near the bus stand, ambulance was called — avoid crowding.',
      'Heat-exhaustion case reported near the market, first-aid volunteers on site.',
    ],
    ReportCategory.brokenWaterSupply: [
      'Public tap near the bus stand is broken, no water here.',
      'Municipal water line burst overnight, area without supply since morning.',
      'Cooler at the community centre is out of order, no water available.',
    ],
  };
}

final communityRepositoryProvider = Provider<CommunityRepository>(
  (ref) => CommunityRepository(ref.watch(localStoreProvider)),
);
