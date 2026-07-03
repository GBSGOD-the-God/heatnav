import 'package:flutter/material.dart';

import '../domain/risk/risk_level.dart';

/// The four risk colours, exposed as a theme extension so widgets never
/// hard-code them. These hues are reserved for risk semantics only —
/// decorative UI must not use them (see docs/PRODUCT_BLUEPRINT.md §8).
@immutable
class RiskPalette extends ThemeExtension<RiskPalette> {
  const RiskPalette({
    required this.green,
    required this.yellow,
    required this.orange,
    required this.red,
    required this.onRisk,
  });

  final Color green;
  final Color yellow;
  final Color orange;
  final Color red;

  /// Foreground used on top of solid risk fills.
  final Color onRisk;

  static const light = RiskPalette(
    green: Color(0xFF2E7D32),
    yellow: Color(0xFFB07C00),
    orange: Color(0xFFD84315),
    red: Color(0xFFB71C1C),
    onRisk: Colors.white,
  );

  static const dark = RiskPalette(
    green: Color(0xFF66BB6A),
    yellow: Color(0xFFE6B84C),
    orange: Color(0xFFFF7043),
    red: Color(0xFFEF5350),
    onRisk: Color(0xFF10130F),
  );

  Color of(RiskLevel level) => switch (level) {
        RiskLevel.green => green,
        RiskLevel.yellow => yellow,
        RiskLevel.orange => orange,
        RiskLevel.red => red,
      };

  /// Soft container tint for cards/chips carrying a risk colour.
  Color containerOf(RiskLevel level) => of(level).withValues(alpha: 0.14);

  @override
  RiskPalette copyWith({
    Color? green,
    Color? yellow,
    Color? orange,
    Color? red,
    Color? onRisk,
  }) {
    return RiskPalette(
      green: green ?? this.green,
      yellow: yellow ?? this.yellow,
      orange: orange ?? this.orange,
      red: red ?? this.red,
      onRisk: onRisk ?? this.onRisk,
    );
  }

  @override
  RiskPalette lerp(RiskPalette? other, double t) {
    if (other == null) return this;
    return RiskPalette(
      green: Color.lerp(green, other.green, t)!,
      yellow: Color.lerp(yellow, other.yellow, t)!,
      orange: Color.lerp(orange, other.orange, t)!,
      red: Color.lerp(red, other.red, t)!,
      onRisk: Color.lerp(onRisk, other.onRisk, t)!,
    );
  }
}

extension RiskPaletteX on BuildContext {
  RiskPalette get riskPalette => Theme.of(this).extension<RiskPalette>()!;
}
