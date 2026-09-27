import 'signal_band.dart';
import 'signal_reading.dart';

/// Parses the device-name payload `HNS-<wbgt>-<globe>-<wet>-<air>-<band>`,
/// where the four temperatures are integers in tenths of a degree C.
///
/// Example: `HNS-314-360-294-360-3` → WBGT 31.4, globe 36.0, wet 29.4,
/// air 36.0, band 3 (red).
abstract final class SignalParser {
  static const prefix = 'HNS-';

  /// Three digits caps every value at 99.9 °C, which rejects obviously
  /// corrupt payloads without excluding any real outdoor reading.
  static final _tenths = RegExp(r'^\d{1,3}$');
  static final _band = RegExp(r'^[0-4]$');

  static bool looksLikeSignal(String name) => name.trim().startsWith(prefix);

  /// Returns null for anything that isn't a complete, well-formed payload.
  static SignalReading? parse(
    String name, {
    required int rssi,
    required DateTime at,
  }) {
    final trimmed = name.trim();
    if (!trimmed.startsWith(prefix)) return null;

    final parts = trimmed.substring(prefix.length).split('-');
    if (parts.length != 5) return null;

    final temps = <double>[];
    for (final part in parts.take(4)) {
      if (!_tenths.hasMatch(part)) return null;
      temps.add(int.parse(part) / 10);
    }
    if (!_band.hasMatch(parts[4])) return null;
    final band = int.parse(parts[4]);
    if (SignalBand.fromCode(band) == null) return null;

    return SignalReading(
      wbgt: temps[0],
      globe: temps[1],
      wet: temps[2],
      air: temps[3],
      band: band,
      rssi: rssi,
      at: at,
    );
  }
}

/// One advertisement seen during a scan.
class SignalAdvert {
  const SignalAdvert({
    required this.deviceId,
    required this.name,
    required this.rssi,
  });

  final String deviceId;
  final String name;
  final int rssi;
}

enum SelectionOutcome { found, notFound, badPayload }

class SignalSelection {
  const SignalSelection._(this.outcome, [this.reading]);

  final SelectionOutcome outcome;
  final SignalReading? reading;
}

/// Picks the nearest Signal — the one heard at the strongest RSSI — and
/// parses it. If the nearest one is malformed this reports badPayload rather
/// than silently falling back to a farther pole, whose reading would
/// describe somewhere else.
abstract final class SignalSelector {
  static SignalSelection select(List<SignalAdvert> adverts, DateTime at) {
    // Per device: strongest RSSI heard, and its most recent name (the name
    // carries the data, so the latest one is the freshest measurement).
    final strongest = <String, int>{};
    final latestName = <String, String>{};
    for (final advert in adverts) {
      if (!SignalParser.looksLikeSignal(advert.name)) continue;
      final best = strongest[advert.deviceId];
      if (best == null || advert.rssi > best) {
        strongest[advert.deviceId] = advert.rssi;
      }
      latestName[advert.deviceId] = advert.name;
    }
    if (strongest.isEmpty) {
      return const SignalSelection._(SelectionOutcome.notFound);
    }

    final nearest = strongest.entries.reduce(
      (a, b) => b.value > a.value ? b : a,
    );
    final reading = SignalParser.parse(
      latestName[nearest.key]!,
      rssi: nearest.value,
      at: at,
    );
    return reading == null
        ? const SignalSelection._(SelectionOutcome.badPayload)
        : SignalSelection._(SelectionOutcome.found, reading);
  }
}
