import 'package:intl/intl.dart';

import 'signal_band.dart';
import 'signal_reading.dart';

/// Site-log calculations over stored readings: time spent in each band, and
/// the CSV export.
abstract final class SignalLog {
  /// A reading is taken to describe the site until the next reading, but
  /// for no longer than it would stay fresh. Beyond that the site's band is
  /// unknown, and unknown time is not attributed to any band.
  static const coverPerReading = Duration(minutes: 30);

  /// Readings taken between [from] and [to], oldest first.
  static List<SignalReading> between(
    List<SignalReading> readings,
    DateTime from,
    DateTime to,
  ) =>
      readings.where((r) => !r.at.isBefore(from) && !r.at.isAfter(to)).toList()
        ..sort((a, b) => a.at.compareTo(b.at));

  /// Time attributed to each band, for readings between [from] and [to].
  /// Bands with no time are omitted; order follows [SignalBand.values].
  static Map<SignalBand, Duration> timeInBand(
    List<SignalReading> readings, {
    required DateTime from,
    required DateTime to,
  }) {
    final sorted = between(readings, from, to);
    final totals = <SignalBand, Duration>{};
    for (var i = 0; i < sorted.length; i++) {
      final r = sorted[i];
      var end = r.at.add(coverPerReading);
      if (i + 1 < sorted.length && sorted[i + 1].at.isBefore(end)) {
        end = sorted[i + 1].at;
      }
      if (end.isAfter(to)) end = to;
      final span = end.difference(r.at);
      if (span <= Duration.zero) continue;
      totals.update(r.signalBand, (d) => d + span, ifAbsent: () => span);
    }
    return {
      for (final band in SignalBand.values)
        if (totals[band] != null) band: totals[band]!,
    };
  }

  static const csvHeader = 'timestamp_local,timestamp_utc,wbgt_c,globe_c,'
      'wet_bulb_c,air_c,band,band_name,rssi_dbm,simulated';

  /// One row per reading, oldest first. Measurements only: no names, device
  /// identifiers or coordinates.
  static String toCsv(List<SignalReading> readings) {
    final sorted = [...readings]..sort((a, b) => a.at.compareTo(b.at));
    final local = DateFormat('yyyy-MM-dd HH:mm:ss');
    final rows = [
      csvHeader,
      for (final r in sorted)
        [
          local.format(r.at),
          r.at.toUtc().toIso8601String(),
          r.wbgt.toStringAsFixed(1),
          r.globe.toStringAsFixed(1),
          r.wet.toStringAsFixed(1),
          r.air.toStringAsFixed(1),
          r.band,
          r.signalBand.name,
          r.rssi,
          r.simulated,
        ].join(','),
    ];
    return '${rows.join('\n')}\n';
  }
}
