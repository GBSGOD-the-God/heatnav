import 'package:flutter/material.dart';

/// Languages HeatNav ships. Adding another Indian language is deliberately
/// cheap: add a value here and a translation map in [translationsFor].
///
/// The app was built for outdoor workers who may read/speak an Indian
/// language more comfortably than English, so language is the very first
/// question at onboarding and is changeable any time from Profile.
enum AppLanguage {
  english('en', 'English', 'English'),
  hindi('hi', 'हिन्दी', 'Hindi');

  const AppLanguage(this.code, this.nativeName, this.englishName);

  /// ISO code used for [Locale] and Flutter's own localizations.
  final String code;

  /// Name shown in its own script (what a speaker recognizes).
  final String nativeName;

  /// Name in English (for the settings subtitle).
  final String englishName;

  Locale get locale => Locale(code);

  static AppLanguage fromCode(String? code) => values.firstWhere(
        (l) => l.code == code,
        orElse: () => AppLanguage.english,
      );

  static List<Locale> get supportedLocales =>
      values.map((l) => l.locale).toList();
}
