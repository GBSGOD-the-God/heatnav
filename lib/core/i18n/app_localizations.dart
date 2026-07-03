import 'package:flutter/widgets.dart';

import 'strings_hi.dart';

/// Ultra-light translation lookup.
///
/// Design choice (keeps partial coverage coherent and safe): the **English
/// string is the key**. A translation map only needs the non-English values;
/// anything missing falls back to the English key verbatim, so a
/// half-translated screen is never blank — it's just bilingual until the
/// remaining strings are added.
abstract final class AppLocalizations {
  static const Map<String, Map<String, String>> _byLanguage = {
    'hi': hindiStrings,
  };

  /// Translate [key] (an English source string) into [languageCode].
  static String translate(String languageCode, String key) {
    if (languageCode == 'en') return key;
    return _byLanguage[languageCode]?[key] ?? key;
  }
}

extension L10nContext on BuildContext {
  /// Translate an English source string to the active locale, with optional
  /// `{name}`-style placeholder substitution.
  ///
  /// Usage: `context.tr('Hi, {name}', {'name': first})`.
  String tr(String key, [Map<String, String>? params]) {
    var result =
        AppLocalizations.translate(Localizations.localeOf(this).languageCode, key);
    if (params != null) {
      params.forEach((k, v) => result = result.replaceAll('{$k}', v));
    }
    return result;
  }
}
