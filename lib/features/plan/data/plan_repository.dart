import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/storage/local_store.dart';
import 'plan_model.dart';

class PlanRepository {
  PlanRepository(this._store);

  static const _key = 'plans';
  final LocalStore _store;

  List<Plan> loadAll() =>
      _store.readList(_key).map(Plan.fromJson).toList()
        ..sort((a, b) => a.leaveAt.compareTo(b.leaveAt));

  Future<void> saveAll(List<Plan> plans) =>
      _store.writeList(_key, plans.map((p) => p.toJson()).toList());
}

final planRepositoryProvider = Provider<PlanRepository>(
  (ref) => PlanRepository(ref.watch(localStoreProvider)),
);
