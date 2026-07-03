import '../profile/user_profile.dart';
import 'heat_index.dart';
import 'risk_factor.dart';
import 'risk_level.dart';

/// Weather/environment snapshot the engine evaluates.
class ConditionsInput {
  const ConditionsInput({
    required this.tempC,
    required this.relativeHumidity,
    this.uvIndex,
    this.usAqi,
    this.governmentAlert,
  });

  final double tempC;
  final double relativeHumidity;
  final double? uvIndex;
  final int? usAqi;

  /// Active official heat advisory text, if any.
  final String? governmentAlert;
}

/// What the user intends to do — supplied when assessing a plan rather than
/// ambient conditions.
class PlanContext {
  const PlanContext({
    required this.isOutdoor,
    required this.durationMinutes,
    required this.exertion,
  });

  final bool isOutdoor;
  final int durationMinutes;
  final ExertionLevel exertion;
}

enum ExertionLevel {
  light('Light', 'sitting, standing, slow walking'),
  moderate('Moderate', 'walking, light physical work'),
  heavy('Heavy', 'sport, manual labour, cycling');

  const ExertionLevel(this.label, this.examples);
  final String label;
  final String examples;
}

/// Result: a categorical band plus every factor that produced it.
class RiskAssessment {
  const RiskAssessment({
    required this.level,
    required this.heatIndexC,
    required this.factors,
  });

  final RiskLevel level;
  final double heatIndexC;
  final List<RiskFactor> factors;
}

/// Transparent, rule-based heat-risk engine.
///
/// Design contract (docs/PRODUCT_BLUEPRINT.md §6):
/// * The base band comes from the published NWS heat-index categories.
/// * Environment, personal profile and plan intensity can each raise the band
///   by at most one step — bands never come from invented math.
/// * Every influence is returned as a named [RiskFactor] with its source;
///   the factor list is rendered verbatim in the "Why this rating?" UI.
abstract final class RiskEngine {
  static RiskAssessment assess({
    required ConditionsInput conditions,
    UserProfile? profile,
    PlanContext? plan,
  }) {
    final factors = <RiskFactor>[];
    final hi = HeatIndex.celsius(
      conditions.tempC,
      conditions.relativeHumidity,
    );

    var level = _baseBand(hi);
    factors.add(_baseFactor(hi, level, conditions));

    // --- Environmental modifiers (max +1 in aggregate). -------------------
    final environment = <RiskFactor>[];
    final outdoorContext = plan?.isOutdoor ?? true;
    if (outdoorContext && (conditions.uvIndex ?? 0) >= 8) {
      environment.add(RiskFactor(
        title: 'Very high UV',
        detail:
            'UV index ${conditions.uvIndex!.toStringAsFixed(0)} — the WHO '
            'classifies 8+ as "very high"; unprotected skin burns quickly.',
        source: 'WHO Global Solar UV Index',
        raisesBand: true,
      ));
    }
    if ((conditions.usAqi ?? 0) >= 151) {
      environment.add(RiskFactor(
        title: 'Unhealthy air quality',
        detail:
            'US AQI ${conditions.usAqi} — heat stress and polluted air load '
            'the heart and lungs at the same time.',
        source: 'US EPA AQI categories',
        raisesBand: true,
      ));
    }
    if (environment.isNotEmpty) {
      level = level.raise();
      factors.addAll(environment);
    }

    if (conditions.governmentAlert != null) {
      final alerted =
          level >= RiskLevel.orange ? level : RiskLevel.orange;
      factors.add(RiskFactor(
        title: 'Official heat advisory',
        detail: conditions.governmentAlert!,
        source: 'Government alert feed',
        raisesBand: alerted != level,
      ));
      level = alerted;
    }

    // --- Personal factors (max +1, only once heat is already a concern). ---
    if (profile != null && level >= RiskLevel.yellow) {
      final personal = _personalFactors(profile);
      if (personal.isNotEmpty) {
        level = level.raise();
        factors.addAll(personal);
      }
    }

    // --- Plan intensity (max +1). ------------------------------------------
    if (plan != null &&
        plan.isOutdoor &&
        level >= RiskLevel.yellow &&
        plan.exertion == ExertionLevel.heavy &&
        plan.durationMinutes >= 60) {
      level = level.raise();
      factors.add(RiskFactor(
        title: 'Strenuous activity in the heat',
        detail:
            '${plan.durationMinutes ~/ 60}h+ of ${plan.exertion.label.toLowerCase()} '
            'activity (${plan.exertion.examples}) multiplies internal heat '
            'production — the body must shed exercise heat on top of '
            'environmental heat.',
        source: 'CDC/NIOSH heat stress guidance',
        raisesBand: true,
      ));
    }

    return RiskAssessment(level: level, heatIndexC: hi, factors: factors);
  }

  /// NWS heat-index categories: Caution 27–32 °C (80–90 °F), Extreme Caution
  /// 32–39 °C (90–103 °F), Danger 39 °C+ (103 °F+).
  static RiskLevel _baseBand(double heatIndexC) {
    if (heatIndexC < 26.7) return RiskLevel.green;
    if (heatIndexC < 32.2) return RiskLevel.yellow;
    if (heatIndexC < 39.4) return RiskLevel.orange;
    return RiskLevel.red;
  }

  static RiskFactor _baseFactor(
    double hi,
    RiskLevel band,
    ConditionsInput c,
  ) {
    final bandName = switch (band) {
      RiskLevel.green => 'below the caution threshold',
      RiskLevel.yellow => 'in the NWS "Caution" band',
      RiskLevel.orange => 'in the NWS "Extreme Caution" band',
      RiskLevel.red => 'in the NWS "Danger" band',
    };
    return RiskFactor(
      title: 'Heat index ${hi.toStringAsFixed(0)}°C',
      detail:
          '${c.tempC.toStringAsFixed(0)}°C at ${c.relativeHumidity.toStringAsFixed(0)}% '
          'humidity feels like ${hi.toStringAsFixed(0)}°C — $bandName.',
      source: 'US NWS heat index (Rothfusz 1990)',
    );
  }

  static List<RiskFactor> _personalFactors(UserProfile p) {
    final out = <RiskFactor>[];
    if (p.ageGroup == AgeGroup.senior || p.ageGroup == AgeGroup.child) {
      out.add(RiskFactor(
        title: p.ageGroup == AgeGroup.senior
            ? 'Age 65+'
            : 'Child age group',
        detail: 'Thermoregulation is less effective at this age, so the same '
            'conditions carry more risk.',
        source: 'WHO heat & health guidance',
        raisesBand: true,
      ));
    }
    if (p.healthConditions.contains(HealthCondition.pregnancy)) {
      out.add(const RiskFactor(
        title: 'Pregnancy',
        detail: 'Pregnancy raises core temperature and cardiovascular load; '
            'heat stress risk is higher for both mother and baby.',
        source: 'CDC heat & pregnancy guidance',
        raisesBand: true,
      ));
    }
    final cardioRespiratory = p.healthConditions.intersection(const {
      HealthCondition.heartDisease,
      HealthCondition.hypertension,
      HealthCondition.diabetes,
      HealthCondition.asthma,
      HealthCondition.kidneyDisease,
    });
    if (cardioRespiratory.isNotEmpty) {
      out.add(RiskFactor(
        title: 'Health condition',
        detail:
            '${cardioRespiratory.map((c) => c.label).join(', ')} — these '
            'conditions (and some of their medications) reduce the body\'s '
            'ability to cope with heat.',
        source: 'WHO/CDC heat-vulnerable groups',
        raisesBand: true,
      ));
    }
    if (p.occupation.isOutdoor &&
        p.outdoorHours == OutdoorHours.moreThanSix) {
      out.add(RiskFactor(
        title: 'Long daily outdoor exposure',
        detail:
            '${p.occupation.label} with 6+ hours outdoors means cumulative '
            'heat load across the day, not just this trip.',
        source: 'CDC/NIOSH occupational heat guidance',
        raisesBand: true,
      ));
    }
    if (p.cooling == CoolingType.none &&
        p.powerCuts == PowerCutFrequency.frequent) {
      out.add(const RiskFactor(
        title: 'No reliable cooling at home',
        detail: 'Without night-time cooling the body cannot recover between '
            'hot days, which compounds heat strain.',
        source: 'WHO heat & health guidance',
        raisesBand: true,
      ));
    }
    return out;
  }
}
