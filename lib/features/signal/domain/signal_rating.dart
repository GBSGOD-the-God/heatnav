import 'package:intl/intl.dart';

import '../../../core/domain/profile/user_profile.dart';
import '../../../core/domain/risk/risk_engine.dart';
import '../../../core/domain/risk/risk_factor.dart';
import 'signal_reading.dart';

/// Turns a fresh on-site reading into a rating, with "Why this rating?"
/// rows in the same title / detail / source style as forecast ratings.
/// Titles are fixed strings so they can be translated.
abstract final class SignalRating {
  static RiskAssessment assess(SignalReading reading, UserProfile? profile) =>
      RiskEngine.assessMeasured(
        measuredLevel: reading.signalBand.riskLevel,
        measurementFactors: factorsFor(reading),
        profile: profile,
      );

  static List<RiskFactor> factorsFor(SignalReading r) {
    final band = r.signalBand;
    return [
      RiskFactor(
        title: 'Measured on site',
        detail: 'HeatNav Signal, ${DateFormat('HH:mm').format(r.at)}, '
            'WBGT ${_c(r.wbgt)} — ${band.label} band'
            '${r.simulated ? ' (SIMULATED)' : ''}',
        source: 'HeatNav Signal',
      ),
      RiskFactor(
        title: 'WBGT = 0.7 × wet bulb + 0.2 × globe + 0.1 × air',
        detail: 'Wet bulb ${_c(r.wet)} · globe ${_c(r.globe)} · '
            'air ${_c(r.air)}',
        source: 'ISO 7243',
      ),
      RiskFactor(
        title: 'Work/rest limits',
        detail: band.workRest,
        source: 'US Army TB MED 507, heavy work',
      ),
      const RiskFactor(
        title: 'City forecast not used',
        detail: 'This rating comes from the on-site measurement, not the '
            'city forecast.',
        source: 'HeatNav Signal',
      ),
    ];
  }

  static String _c(double v) => '${v.toStringAsFixed(1)} °C';
}
