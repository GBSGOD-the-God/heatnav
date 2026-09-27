import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/storage/local_store.dart';
import '../domain/signal_parser.dart';
import '../domain/signal_reading.dart';
import 'signal_scanner.dart';

sealed class SignalSyncResult {
  const SignalSyncResult();
}

class SignalSyncSuccess extends SignalSyncResult {
  const SignalSyncSuccess(this.reading);
  final SignalReading reading;
}

class SignalSyncFailure extends SignalSyncResult {
  const SignalSyncFailure(this.error);
  final SignalError error;
}

/// Scans for a Signal and keeps every reading on the device, in the same
/// local store as the rest of the app. Nothing here touches the network.
class SignalRepository {
  SignalRepository(this._store, {DateTime Function()? clock})
      : _clock = clock ?? DateTime.now;

  final LocalStore _store;
  final DateTime Function() _clock;

  static const lastKey = 'signal_last';
  static const historyKey = 'signal_history';
  static const scanDuration = Duration(seconds: 6);

  /// Bounds local storage (about a year of syncing every few minutes during
  /// working hours); the oldest readings are dropped first.
  static const maxHistory = 10000;

  SignalReading? loadLast() {
    final json = _store.readObject(lastKey);
    return json == null ? null : SignalReading.fromJson(json);
  }

  List<SignalReading> loadHistory() => _store
      .readList(historyKey)
      .map(SignalReading.fromJson)
      .whereType<SignalReading>()
      .toList()
    ..sort((a, b) => a.at.compareTo(b.at));

  /// Scans for [scanDuration], picks the nearest Signal and stores its
  /// reading. [simulated] marks the reading as rehearsal data.
  Future<SignalSyncResult> sync(
    SignalScanner scanner, {
    bool simulated = false,
  }) async {
    final List<SignalAdvert> adverts;
    try {
      adverts = await scanner.scan(scanDuration);
    } on SignalScanException catch (e) {
      return SignalSyncFailure(e.error);
    } catch (_) {
      return const SignalSyncFailure(SignalError.notFound);
    }

    final selection = SignalSelector.select(adverts, _clock());
    switch (selection.outcome) {
      case SelectionOutcome.notFound:
        return const SignalSyncFailure(SignalError.notFound);
      case SelectionOutcome.badPayload:
        return const SignalSyncFailure(SignalError.badPayload);
      case SelectionOutcome.found:
        final reading = selection.reading!.copyWith(simulated: simulated);
        await save(reading);
        return SignalSyncSuccess(reading);
    }
  }

  Future<void> save(SignalReading reading) async {
    var history = [...loadHistory(), reading];
    if (history.length > maxHistory) {
      history = history.sublist(history.length - maxHistory);
    }
    await _store.writeList(historyKey, history.map((r) => r.toJson()).toList());
    await _store.writeObject(lastKey, reading.toJson());
  }

  /// Drops rehearsal data so it can never mix with real measurements.
  /// Returns true if anything was removed.
  Future<bool> removeSimulated() async {
    final history = loadHistory();
    final real = history.where((r) => !r.simulated).toList();
    final last = loadLast();
    final lastIsSimulated = last?.simulated ?? false;
    if (real.length == history.length && !lastIsSimulated) return false;

    await _store.writeList(historyKey, real.map((r) => r.toJson()).toList());
    if (lastIsSimulated) {
      if (real.isEmpty) {
        await _store.remove(lastKey);
      } else {
        await _store.writeObject(lastKey, real.last.toJson());
      }
    }
    return true;
  }
}

final signalRepositoryProvider = Provider<SignalRepository>(
  (ref) => SignalRepository(ref.watch(localStoreProvider)),
);

final bleSignalScannerProvider = Provider<SignalScanner>(
  (ref) => BleSignalScanner(),
);

/// Kept for the life of the app so each rehearsal sync climbs one step.
final simulatedSignalScannerProvider = Provider<SignalScanner>(
  (ref) => SimulatedSignalScanner(),
);
