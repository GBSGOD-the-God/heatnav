import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/domain/profile/user_profile.dart';
import '../data/profile_repository.dart';

/// Holds the current profile; `null` means onboarding hasn't completed and
/// the router redirects accordingly.
class ProfileController extends Notifier<UserProfile?> {
  @override
  UserProfile? build() => ref.watch(profileRepositoryProvider).load();

  Future<void> save(UserProfile profile) async {
    await ref.read(profileRepositoryProvider).save(profile);
    state = profile;
  }

  Future<void> update(UserProfile Function(UserProfile) change) async {
    final current = state;
    if (current == null) return;
    await save(change(current));
  }

  Future<void> reset() async {
    await ref.read(profileRepositoryProvider).clear();
    state = null;
  }
}

final profileControllerProvider =
    NotifierProvider<ProfileController, UserProfile?>(ProfileController.new);
