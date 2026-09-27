import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

final _tickerProvider = StreamProvider<DateTime>((ref) {
  final controller = StreamController<DateTime>();
  controller.add(DateTime.now());
  final timer = Timer.periodic(
    const Duration(seconds: 30),
    (_) => controller.add(DateTime.now()),
  );
  ref.onDispose(() {
    timer.cancel();
    controller.close();
  });
  return controller.stream;
});

/// "Now", refreshed every 30 seconds, for anything that ages on screen
/// ("measured 4 min ago", readings going stale). Override in tests to pin
/// time.
final currentTimeProvider = Provider<DateTime>(
  (ref) => ref.watch(_tickerProvider).valueOrNull ?? DateTime.now(),
);
