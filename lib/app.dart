import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/constants/app_constants.dart';
import 'core/i18n/app_language.dart';
import 'core/i18n/locale_controller.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'features/profile/presentation/settings_controller.dart';
import 'features/signal/presentation/signal_providers.dart';
import 'features/signal/presentation/signal_widgets.dart';

class HeatNavApp extends ConsumerWidget {
  const HeatNavApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);
    final settings = ref.watch(settingsControllerProvider);
    final language = ref.watch(localeControllerProvider);

    return MaterialApp.router(
      title: AppConstants.appName,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: settings.themeMode,
      locale: language.locale,
      supportedLocales: AppLanguage.supportedLocales,
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      routerConfig: router,
      builder: (context, child) => _SimulationBanner(child: child!),
    );
  }
}

/// While rehearsal mode is on, every screen carries a "SIMULATED" corner
/// ribbon, so simulated data can never appear untagged anywhere.
class _SimulationBanner extends ConsumerWidget {
  const _SimulationBanner({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final simulate = ref.watch(signalReadingProvider.select((s) => s.simulate));
    if (!simulate) return child;
    return Banner(
      message: 'SIMULATED',
      location: BannerLocation.topEnd,
      color: SimulatedTag.color,
      child: child,
    );
  }
}
