import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../community/presentation/community_providers.dart';
import '../../profile/presentation/profile_controller.dart';
import '../../weather/presentation/weather_providers.dart';
import '../data/plan_model.dart';
import '../data/plan_repository.dart';
import '../domain/plan_analyzer.dart';

class PlansController extends Notifier<List<Plan>> {
  @override
  List<Plan> build() => ref.read(planRepositoryProvider).loadAll();

  Future<void> add(Plan plan) async {
    state = [...state, plan]..sort((a, b) => a.leaveAt.compareTo(b.leaveAt));
    await ref.read(planRepositoryProvider).saveAll(state);
  }

  Future<void> remove(String id) async {
    state = state.where((p) => p.id != id).toList();
    await ref.read(planRepositoryProvider).saveAll(state);
  }

  Future<void> toggleChecklistItem(String planId, String label) async {
    state = [
      for (final p in state)
        if (p.id == planId)
          p.copyWith(
            checkedItems: p.checkedItems.contains(label)
                ? (Set.of(p.checkedItems)..remove(label))
                : {...p.checkedItems, label},
          )
        else
          p,
    ];
    await ref.read(planRepositoryProvider).saveAll(state);
  }
}

final plansProvider =
    NotifierProvider<PlansController, List<Plan>>(PlansController.new);

final upcomingPlansProvider = Provider<List<Plan>>(
  (ref) => ref.watch(plansProvider).where((p) => !p.isPast).toList(),
);

final planByIdProvider = Provider.family<Plan?, String>((ref, id) {
  for (final p in ref.watch(plansProvider)) {
    if (p.id == id) return p;
  }
  return null;
});

/// Full analysis for one plan; null until weather is available.
final planAssessmentProvider =
    Provider.family<PlanAssessment?, String>((ref, id) {
  final plan = ref.watch(planByIdProvider(id));
  final weather = ref.watch(weatherProvider).valueOrNull;
  if (plan == null || weather == null) return null;
  return PlanAnalyzer.analyze(
    plan: plan,
    weather: weather,
    profile: ref.watch(profileControllerProvider),
    resources: ref.watch(communityResourcesProvider),
  );
});
