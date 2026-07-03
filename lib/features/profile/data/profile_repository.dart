import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/domain/profile/user_profile.dart';
import '../../../core/storage/local_store.dart';

/// Local persistence for the user's heat profile. Health data stays on
/// device — a deliberate privacy stance, not a shortcut.
class ProfileRepository {
  ProfileRepository(this._store);

  static const _key = 'user_profile';
  final LocalStore _store;

  UserProfile? load() {
    final json = _store.readObject(_key);
    if (json == null) return null;
    try {
      return UserProfile.fromJson(json);
    } catch (_) {
      // A corrupt profile must never brick the app; re-onboard instead.
      return null;
    }
  }

  Future<void> save(UserProfile profile) =>
      _store.writeObject(_key, profile.toJson());

  Future<void> clear() => _store.remove(_key);
}

final profileRepositoryProvider = Provider<ProfileRepository>(
  (ref) => ProfileRepository(ref.watch(localStoreProvider)),
);
