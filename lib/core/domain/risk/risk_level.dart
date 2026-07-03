/// Categorical heat-risk bands. HeatNav never shows invented percentages —
/// only these four bands, each traceable to its contributing factors.
enum RiskLevel {
  green,
  yellow,
  orange,
  red;

  String get label => switch (this) {
        green => 'Low risk',
        yellow => 'Caution',
        orange => 'High risk',
        red => 'Danger',
      };

  String get headline => switch (this) {
        green => 'Conditions look safe',
        yellow => 'Take basic precautions',
        orange => 'Limit time outdoors',
        red => 'Avoid outdoor exposure',
      };

  /// Raises the band by [steps], capped at [RiskLevel.red].
  RiskLevel raise([int steps = 1]) {
    final next = (index + steps).clamp(0, RiskLevel.values.length - 1);
    return RiskLevel.values[next];
  }

  bool operator >=(RiskLevel other) => index >= other.index;
}
