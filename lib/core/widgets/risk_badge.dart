import 'package:flutter/material.dart';

import '../domain/risk/risk_level.dart';
import '../i18n/app_localizations.dart';
import '../theme/risk_palette.dart';

/// Compact pill showing a risk band. The only widget allowed to pair risk
/// colour with text, so the treatment stays consistent everywhere.
class RiskBadge extends StatelessWidget {
  const RiskBadge(this.level, {super.key, this.compact = false});

  final RiskLevel level;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final palette = context.riskPalette;
    final color = palette.of(level);
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 8 : 12,
        vertical: compact ? 4 : 6,
      ),
      decoration: BoxDecoration(
        color: palette.containerOf(level),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 6),
          Text(
            context.tr(level.label),
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
                  color: color,
                  fontWeight: FontWeight.w700,
                ),
          ),
        ],
      ),
    );
  }
}
