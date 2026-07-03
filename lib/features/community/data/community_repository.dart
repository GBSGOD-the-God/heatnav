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

  /// Deterministic sample dataset around the pilot city, timestamped
  /// relative to "now" so expiry behaviour is demonstrable. Every seed is
  /// flagged `isSample` and rendered with a "sample data" badge.
  List<CommunityReport> _seedsFor(Place home, DateTime now) {
    CommunityReport seed(
      int i,
      ReportCategory category,
      String description,
      String author, {
      required double bearingDeg,
      required double km,
      required Duration age,
      int upvotes = 0,
    }) {
      // ~111 km per degree latitude; longitude scaled by cos(lat).
      final rad = bearingDeg * math.pi / 180;
      final dLat = (km * math.cos(rad)) / 111.0;
      final dLng = (km * math.sin(rad)) /
          (111.0 * math.cos(home.latitude * math.pi / 180));
      return CommunityReport(
        id: 'sample-$i',
        category: category,
        description: description,
        latitude: home.latitude + dLat,
        longitude: home.longitude + dLng,
        createdAt: now.subtract(age),
        authorName: author,
        upvotes: upvotes,
        isSample: true,
      );
    }

    return [
      seed(1, ReportCategory.extremeHeat,
          'Asphalt radiating badly near the flyover — avoid walking this stretch after noon.',
          'Ravi K.',
          bearingDeg: 40, km: 1.2, age: const Duration(hours: 2), upvotes: 5),
      seed(2, ReportCategory.waterStation,
          'Free chilled water kiosk outside the metro station, refills allowed.',
          'Meena S.',
          bearingDeg: 130, km: 0.8, age: const Duration(days: 3), upvotes: 12),
      seed(3, ReportCategory.powerCut,
          'Power gone since morning in the east colony. Inverters running out.',
          'Arjun T.',
          bearingDeg: 90, km: 2.5, age: const Duration(hours: 4), upvotes: 4),
      seed(4, ReportCategory.shade,
          'Tree-lined lane behind the market — noticeably cooler than the main road.',
          'Fatima B.',
          bearingDeg: 220, km: 1.5, age: const Duration(days: 10), upvotes: 8),
      seed(5, ReportCategory.coolingCentre,
          'Community hall open 11 AM–6 PM as a cooling shelter. Drinking water available.',
          'City volunteer',
          bearingDeg: 310, km: 2.0, age: const Duration(days: 2), upvotes: 15),
      seed(6, ReportCategory.noShade,
          'New road stretch has zero tree cover — brutal between 12 and 4.',
          'Sunil D.',
          bearingDeg: 180, km: 3.0, age: const Duration(days: 5), upvotes: 3),
      seed(7, ReportCategory.brokenWaterSupply,
          'Public tap near the bus stand is broken, no water here.',
          'Priya M.',
          bearingDeg: 70, km: 1.8, age: const Duration(hours: 9), upvotes: 2),
    ];
  }
}

final communityRepositoryProvider = Provider<CommunityRepository>(
  (ref) => CommunityRepository(ref.watch(localStoreProvider)),
);
