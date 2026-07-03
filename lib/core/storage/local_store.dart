import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Injected in [main] after SharedPreferences is ready, so every repository
/// can read synchronously at construction time.
final sharedPreferencesProvider = Provider<SharedPreferences>(
  (ref) => throw UnimplementedError('Overridden in main()'),
);

/// Thin JSON document store over SharedPreferences.
///
/// Demo-scale persistence by design: every repository talks to this through
/// its own interface, so swapping in Firestore/drift later touches the data
/// layer only (see docs/PRODUCT_BLUEPRINT.md §9).
class LocalStore {
  LocalStore(this._prefs);

  final SharedPreferences _prefs;

  Map<String, dynamic>? readObject(String key) {
    final raw = _prefs.getString(key);
    if (raw == null) return null;
    try {
      return jsonDecode(raw) as Map<String, dynamic>;
    } on FormatException {
      return null;
    }
  }

  List<Map<String, dynamic>> readList(String key) {
    final raw = _prefs.getString(key);
    if (raw == null) return const [];
    try {
      return (jsonDecode(raw) as List).cast<Map<String, dynamic>>();
    } on FormatException {
      return const [];
    }
  }

  Future<void> writeObject(String key, Map<String, dynamic> value) =>
      _prefs.setString(key, jsonEncode(value));

  Future<void> writeList(String key, List<Map<String, dynamic>> value) =>
      _prefs.setString(key, jsonEncode(value));

  Future<void> remove(String key) async {
    await _prefs.remove(key);
  }
}

final localStoreProvider = Provider<LocalStore>(
  (ref) => LocalStore(ref.watch(sharedPreferencesProvider)),
);
