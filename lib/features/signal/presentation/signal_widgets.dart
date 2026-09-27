import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../../core/i18n/app_localizations.dart';
import '../../../core/theme/risk_palette.dart';
import '../domain/signal_band.dart';

/// The band as a filled chip in its risk colour. Flashing red pulses,
/// unless the user has asked the system to reduce motion — then a warning
/// icon carries the same meaning.
class SignalBandChip extends StatelessWidget {
  const SignalBandChip(this.band, {super.key, this.compact = false});

  final SignalBand band;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final palette = context.riskPalette;
    final reduceMotion = MediaQuery.of(context).disableAnimations;
    final chip = Container(
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 8 : 12,
        vertical: compact ? 4 : 6,
      ),
      decoration: BoxDecoration(
        color: palette.of(band.riskLevel),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (band.isFlashing) ...[
            Icon(
              Icons.warning_amber_rounded,
              size: compact ? 14 : 16,
              color: palette.onRisk,
            ),
            const SizedBox(width: 4),
          ],
          Text(
            context.tr(band.label),
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
                  color: palette.onRisk,
                  fontWeight: FontWeight.w700,
                ),
          ),
        ],
      ),
    );
    if (!band.isFlashing || reduceMotion) return chip;
    return chip
        .animate(onPlay: (c) => c.repeat(reverse: true))
        .fade(begin: 1, end: 0.35, duration: 600.ms);
  }
}

/// Marks rehearsal data wherever it appears. Deliberately loud.
class SimulatedTag extends StatelessWidget {
  const SimulatedTag({super.key});

  static const color = Color(0xFF6A1B9A);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        'SIMULATED',
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.8,
            ),
      ),
    );
  }
}

/// Shown on a rating that came from an on-site Signal, not the forecast.
class MeasuredHereTag extends StatelessWidget {
  const MeasuredHereTag({super.key});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: scheme.primaryContainer,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.sensors, size: 14, color: scheme.onPrimaryContainer),
          const SizedBox(width: 4),
          Text(
            context.tr('Measured here'),
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
                  color: scheme.onPrimaryContainer,
                  fontWeight: FontWeight.w700,
                ),
          ),
        ],
      ),
    );
  }
}
