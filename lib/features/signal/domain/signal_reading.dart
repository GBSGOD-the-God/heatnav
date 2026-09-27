import 'signal_band.dart';

/// One on-site measurement read from a HeatNav Signal advertisement.
/// Temperatures are °C; [rssi] is the signal strength it was received at.
/// Deliberately carries no device identifier or location, so exported
/// history can't identify a person or place.
class SignalReading {
  const SignalReading({
    required this.wbgt,
    required this.globe,
    required this.wet,
    required this.air,
    required this.band,
    required this.rssi,
    required this.at,
    this.simulated = false,
  });

  final double wbgt;
  final double globe;
  final double wet;
  final double air;

  /// 0..4 as broadcast; see [signalBand].
  final int band;
  final int rssi;
  final DateTime at;

  /// True for rehearsal data from the debug-only simulator.
  final bool simulated;

  SignalBand get signalBand => SignalBand.fromCode(band)!;

  SignalReading copyWith({DateTime? at, bool? simulated}) => SignalReading(
        wbgt: wbgt,
        globe: globe,
        wet: wet,
        air: air,
        band: band,
        rssi: rssi,
        at: at ?? this.at,
        simulated: simulated ?? this.simulated,
      );

  Map<String, dynamic> toJson() => {
        'wbgt': wbgt,
        'globe': globe,
        'wet': wet,
        'air': air,
        'band': band,
        'rssi': rssi,
        'at': at.toIso8601String(),
        'simulated': simulated,
      };

  /// Returns null for anything malformed, so one corrupt stored entry can't
  /// break the whole history.
  static SignalReading? fromJson(Map<String, dynamic> json) {
    try {
      final band = json['band'] as int;
      if (SignalBand.fromCode(band) == null) return null;
      return SignalReading(
        wbgt: (json['wbgt'] as num).toDouble(),
        globe: (json['globe'] as num).toDouble(),
        wet: (json['wet'] as num).toDouble(),
        air: (json['air'] as num).toDouble(),
        band: band,
        rssi: json['rssi'] as int,
        at: DateTime.parse(json['at'] as String),
        simulated: json['simulated'] as bool? ?? false,
      );
    } catch (_) {
      return null;
    }
  }
}
