import 'package:flutter_test/flutter_test.dart';
import 'package:heatnav/core/i18n/app_language.dart';
import 'package:heatnav/core/i18n/app_localizations.dart';
import 'package:heatnav/core/i18n/strings_hi.dart';

void main() {
  group('AppLanguage', () {
    test('unknown codes fall back to English', () {
      expect(AppLanguage.fromCode(null), AppLanguage.english);
      expect(AppLanguage.fromCode('xx'), AppLanguage.english);
      expect(AppLanguage.fromCode('hi'), AppLanguage.hindi);
    });
  });

  group('AppLocalizations', () {
    test('English returns the key verbatim', () {
      expect(AppLocalizations.translate('en', 'Plan my day'), 'Plan my day');
    });

    test('Hindi translates known keys', () {
      expect(AppLocalizations.translate('hi', 'Plan my day'),
          hindiStrings['Plan my day']);
      expect(AppLocalizations.translate('hi', 'Emergency'), isNot('Emergency'));
    });

    test('missing Hindi keys fall back to the English key, never blank', () {
      const madeUp = 'A string that was never translated 12345';
      expect(AppLocalizations.translate('hi', madeUp), madeUp);
    });

    test('every Hindi value is non-empty', () {
      for (final entry in hindiStrings.entries) {
        expect(entry.value.trim(), isNotEmpty, reason: 'empty for ${entry.key}');
      }
    });
  });
}
