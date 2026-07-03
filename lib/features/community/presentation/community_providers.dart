import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../profile/presentation/profile_controller.dart';
import '../data/community_repository.dart';
import '../data/report_model.dart';

/// Active reports near home. Synchronous (local-first) but modelled as a
/// Notifier so submits/votes rebuild every listener.
class CommunityReportsController extends Notifier<List<CommunityReport>> {
  @override
  List<CommunityReport> build() {
    final home = ref.watch(profileControllerProvider.select((p) => p?.home));
    if (home == null) return const [];
    return ref.read(communityRepositoryProvider).loadActive(home);
  }

  Future<void> submit({
    required ReportCategory category,
    required String description,
    required double latitude,
    required double longitude,
  }) async {
    final name =
        ref.read(profileControllerProvider.select((p) => p?.name)) ?? '';
    await ref.read(communityRepositoryProvider).submit(
          category: category,
          description: description,
          latitude: latitude,
          longitude: longitude,
          authorName: name,
        );
    ref.invalidateSelf();
  }

  Future<void> vote(String reportId, int direction) async {
    await ref.read(communityRepositoryProvider).vote(reportId, direction);
    ref.invalidateSelf();
  }
}

final communityReportsProvider =
    NotifierProvider<CommunityReportsController, List<CommunityReport>>(
  CommunityReportsController.new,
);

/// The user's own votes (reportId → +1/-1), for highlighting vote buttons.
/// Depends on the reports controller so it rebuilds after every vote.
final myVotesProvider = Provider<Map<String, int>>((ref) {
  ref.watch(communityReportsProvider);
  return ref.read(communityRepositoryProvider).myVotes();
});

/// Hazard reports from the last 12 hours — surfaced as Home alerts.
final activeHazardsProvider = Provider<List<CommunityReport>>((ref) {
  final reports = ref.watch(communityReportsProvider);
  final cutoff = DateTime.now().subtract(const Duration(hours: 12));
  return reports
      .where((r) => r.category.isHazard && r.createdAt.isAfter(cutoff))
      .toList();
});

/// Nearby resources (water/shade/cooling) for plan preparation.
final communityResourcesProvider = Provider<List<CommunityReport>>((ref) {
  return ref
      .watch(communityReportsProvider)
      .where((r) => !r.category.isHazard)
      .toList();
});
