import 'package:flutter/material.dart';

import '../domain/risk/risk_factor.dart';
import '../i18n/app_localizations.dart';

/// The transparency feature: renders the exact factor list produced by the
/// risk engine. Used by Home, plan analysis and the calendar day sheet.
class WhyThisRating extends StatelessWidget {
  const WhyThisRating({super.key, required this.factors});

  final List<RiskFactor> factors;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Theme(
      data: theme.copyWith(dividerColor: Colors.transparent),
      child: ExpansionTile(
        tilePadding: EdgeInsets.zero,
        childrenPadding: const EdgeInsets.only(bottom: 8),
        title: Row(
          children: [
            Icon(
              Icons.psychology_alt_outlined,
              size: 20,
              color: theme.colorScheme.primary,
            ),
            const SizedBox(width: 8),
            Text(
              context.tr('Why this rating?'),
              style: theme.textTheme.titleSmall?.copyWith(
                color: theme.colorScheme.primary,
              ),
            ),
          ],
        ),
        children: [
          for (final factor in factors) _FactorRow(factor: factor),
        ],
      ),
    );
  }
}

class _FactorRow extends StatelessWidget {
  const _FactorRow({required this.factor});

  final RiskFactor factor;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 2),
            child: Icon(
              factor.raisesBand
                  ? Icons.arrow_circle_up_rounded
                  : Icons.info_outline_rounded,
              size: 18,
              color: factor.raisesBand
                  ? theme.colorScheme.error
                  : theme.colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(factor.title, style: theme.textTheme.titleSmall),
                const SizedBox(height: 2),
                Text(factor.detail, style: theme.textTheme.bodySmall),
                const SizedBox(height: 4),
                Text(
                  'Source: ${factor.source}',
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
