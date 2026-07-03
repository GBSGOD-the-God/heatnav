import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/storage/local_store.dart';

/// App settings, including the notification policy toggles. Delivery (FCM /
/// geofencing) is a documented Tier-3 seam; the *decision* logic these
/// toggles feed is the interesting part and is real.
class AppSettings {
  const AppSettings({
    this.themeMode = ThemeMode.system,
    this.notifyRiskChanges = true,
    this.notifyPlanWarnings = true,
    this.notifyCommunityDanger = true,
  });

  final ThemeMode themeMode;
  final bool notifyRiskChanges;
  final bool notifyPlanWarnings;
  final bool notifyCommunityDanger;

  AppSettings copyWith({
    ThemeMode? themeMode,
    bool? notifyRiskChanges,
    bool? notifyPlanWarnings,
    bool? notifyCommunityDanger,
  }) {
    return AppSettings(
      themeMode: themeMode ?? this.themeMode,
      notifyRiskChanges: notifyRiskChanges ?? this.notifyRiskChanges,
      notifyPlanWarnings: notifyPlanWarnings ?? this.notifyPlanWarnings,
      notifyCommunityDanger:
          notifyCommunityDanger ?? this.notifyCommunityDanger,
    );
  }

  Map<String, dynamic> toJson() => {
        'themeMode': themeMode.name,
        'notifyRiskChanges': notifyRiskChanges,
        'notifyPlanWarnings': notifyPlanWarnings,
        'notifyCommunityDanger': notifyCommunityDanger,
      };

  factory AppSettings.fromJson(Map<String, dynamic> json) => AppSettings(
        themeMode: ThemeMode.values.byName(
          json['themeMode'] as String? ?? ThemeMode.system.name,
        ),
        notifyRiskChanges: json['notifyRiskChanges'] as bool? ?? true,
        notifyPlanWarnings: json['notifyPlanWarnings'] as bool? ?? true,
        notifyCommunityDanger: json['notifyCommunityDanger'] as bool? ?? true,
      );
}

class SettingsController extends Notifier<AppSettings> {
  static const _key = 'app_settings';

  @override
  AppSettings build() {
    final json = ref.watch(localStoreProvider).readObject(_key);
    return json == null ? const AppSettings() : AppSettings.fromJson(json);
  }

  Future<void> update(AppSettings Function(AppSettings) change) async {
    state = change(state);
    await ref.read(localStoreProvider).writeObject(_key, state.toJson());
  }
}

final settingsControllerProvider =
    NotifierProvider<SettingsController, AppSettings>(SettingsController.new);
