import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/utils/clock.dart';
import '../data/signal_repository.dart';
import '../data/signal_scanner.dart';
import '../domain/signal_freshness.dart';
import '../domain/signal_reading.dart';

class SignalState {
  const SignalState({
    this.last,
    this.history = const [],
    this.syncing = false,
    this.error,
    this.simulate = false,
  });

  final SignalReading? last;

  /// Every stored reading, oldest first.
  final List<SignalReading> history;
  final bool syncing;
  final SignalError? error;

  /// Debug-only rehearsal mode; always false in release builds.
  final bool simulate;

  SignalState copyWith({
    SignalReading? last,
    bool clearLast = false,
    List<SignalReading>? history,
    bool? syncing,
    SignalError? error,
    bool clearError = false,
    bool? simulate,
  }) =>
      SignalState(
        last: clearLast ? null : last ?? this.last,
        history: history ?? this.history,
        syncing: syncing ?? this.syncing,
        error: clearError ? null : error ?? this.error,
        simulate: simulate ?? this.simulate,
      );
}

class SignalController extends Notifier<SignalState> {
  @override
  SignalState build() {
    final repo = ref.watch(signalRepositoryProvider);
    // Simulation always starts switched off, so rehearsal data left over from
    // an earlier session is dropped rather than shown as real.
    unawaited(repo.removeSimulated());
    final history = repo.loadHistory().where((r) => !r.simulated).toList();
    final last = repo.loadLast();
    return SignalState(
      last: last != null && !last.simulated
          ? last
          : (history.isEmpty ? null : history.last),
      history: history,
    );
  }

  /// Available only in debug builds, off by default.
  static bool get simulationAvailable => kDebugMode;

  Future<void> sync() async {
    if (state.syncing) return;
    state = state.copyWith(syncing: true, clearError: true);
    final simulate = state.simulate && simulationAvailable;
    final scanner = ref.read(
      simulate ? simulatedSignalScannerProvider : bleSignalScannerProvider,
    );
    final result = await ref
        .read(signalRepositoryProvider)
        .sync(scanner, simulated: simulate);
    state = switch (result) {
      SignalSyncSuccess(:final reading) => state.copyWith(
          syncing: false,
          last: reading,
          history: [...state.history, reading],
        ),
      SignalSyncFailure(:final error) => state.copyWith(
          syncing: false,
          error: error,
        ),
    };
  }

  /// Turning simulation off deletes every simulated reading.
  Future<void> setSimulate(bool enabled) async {
    if (!simulationAvailable) return;
    if (enabled) {
      state = state.copyWith(simulate: true, clearError: true);
      return;
    }
    final repo = ref.read(signalRepositoryProvider);
    await repo.removeSimulated();
    final history = repo.loadHistory();
    state = SignalState(last: repo.loadLast(), history: history);
  }
}

final signalReadingProvider = NotifierProvider<SignalController, SignalState>(
  SignalController.new,
);

/// The reading ratings may use: the latest one, only while it is fresh
/// (under 30 minutes). Null means "rate from the forecast as usual".
final ratingSignalReadingProvider = Provider<SignalReading?>((ref) {
  final last = ref.watch(signalReadingProvider.select((s) => s.last));
  if (last == null) return null;
  final now = ref.watch(currentTimeProvider);
  return SignalFreshnessRules.usableForRating(last, now) ? last : null;
});
