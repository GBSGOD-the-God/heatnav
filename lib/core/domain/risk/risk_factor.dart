/// One named, explainable contribution to a risk assessment.
///
/// The list of factors IS the "Why this rating?" UI — if a factor can't be
/// stated in plain language with a source, it must not influence the band.
class RiskFactor {
  const RiskFactor({
    required this.title,
    required this.detail,
    required this.source,
    this.raisesBand = false,
  });

  /// Short human-readable name, e.g. "Very high UV".
  final String title;

  /// Plain-language explanation of what was observed and why it matters.
  final String detail;

  /// Where the rule comes from, e.g. "US NWS heat index categories".
  final String source;

  /// Whether this factor raised the overall band (vs. context that informed
  /// the base band).
  final bool raisesBand;
}
