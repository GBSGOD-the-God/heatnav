import '../../../core/domain/risk/risk_level.dart';

/// The five bands a HeatNav Signal broadcasts, with the heavy-work limits
/// from US Army TB MED 507 (Heat Stress Control and Heat Casualty
/// Management). WBGT ranges are the TB MED 507 °F categories converted to °C.
enum SignalBand {
  green(
    code: 0,
    riskLevel: RiskLevel.green,
    label: 'Green',
    wbgtRange: 'below 25.6 °C',
    workRest: 'Work normally',
    water: 'Drink water hourly',
  ),
  yellow(
    code: 1,
    riskLevel: RiskLevel.yellow,
    label: 'Yellow',
    wbgtRange: '25.6–27.7 °C',
    workRest: '40 min work / 20 rest',
    water: '~0.7 L per hour',
  ),
  orange(
    code: 2,
    riskLevel: RiskLevel.orange,
    label: 'Orange',
    wbgtRange: '27.8–31.0 °C',
    workRest: '30 min work / 30 rest',
    water: '~1 L per hour',
  ),
  red(
    code: 3,
    riskLevel: RiskLevel.red,
    label: 'Red',
    wbgtRange: '31.1–32.1 °C',
    workRest: '20 min work / 40 rest',
    water: '~1 L per hour',
  ),
  // The app's risk scale tops out at red, so flashing red rates as red; its
  // stricter work rule is what distinguishes it.
  flashingRed(
    code: 4,
    riskLevel: RiskLevel.red,
    label: 'Flashing red',
    wbgtRange: '32.2 °C and above',
    workRest: 'Stop heavy work',
    water: '~1 L per hour',
  );

  const SignalBand({
    required this.code,
    required this.riskLevel,
    required this.label,
    required this.wbgtRange,
    required this.workRest,
    required this.water,
  });

  final int code;
  final RiskLevel riskLevel;
  final String label;
  final String wbgtRange;
  final String workRest;
  final String water;

  bool get isFlashing => this == flashingRed;

  static SignalBand? fromCode(int code) {
    for (final band in values) {
      if (band.code == code) return band;
    }
    return null;
  }

  /// Band for a WBGT value in °C, using the same thresholds as the device.
  static SignalBand forWbgt(double wbgt) {
    if (wbgt < 25.6) return green;
    if (wbgt < 27.8) return yellow;
    if (wbgt < 31.1) return orange;
    if (wbgt < 32.2) return red;
    return flashingRed;
  }
}
