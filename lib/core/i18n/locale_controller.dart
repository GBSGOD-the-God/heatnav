import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../storage/local_store.dart';
import 'app_language.dart';

/// Persists the chosen [AppLanguage]. Selected as the first onboarding step
/// so the rest of setup is already in the user's language, and editable
/// later from Profile.
class LocaleController extends Notifier<AppLanguage> {
  static const _key = 'app_language';

  @override
  AppLanguage build() {
    final stored = ref.watch(localeStoreProvider).getString(_key);
    return AppLanguage.fromCode(stored);
  }

  Future<void> set(AppLanguage language) async {
    state = language;
    await ref.read(localeStoreProvider).setString(_key, language.code);
  }
}

/// Small typed view over the prefs used only for the language key, so the
/// controller doesn't depend on the JSON document store's shape.
class _LocaleStore {
  _LocaleStore(this._prefs);
  final dynamic _prefs;
  String? getString(String key) => _prefs.getString(key) as String?;
  Future<void> setString(String key, String value) =>
      _prefs.setString(key, value) as Future<void>;
}

final localeStoreProvider = Provider<_LocaleStore>(
  (ref) => _LocaleStore(ref.watch(sharedPreferencesProvider)),
);

final localeControllerProvider =
    NotifierProvider<LocaleController, AppLanguage>(LocaleController.new);
