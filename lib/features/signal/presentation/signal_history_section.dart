import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:share_plus/share_plus.dart';

import '../../../core/i18n/app_localizations.dart';
import '../../../core/theme/risk_palette.dart';
import '../../../core/utils/clock.dart';
import '../../../core/widgets/section_header.dart';
import '../domain/signal_band.dart';
import '../domain/signal_log.dart';
import '../domain/signal_reading.dart';
import 'signal_providers.dart';
import 'signal_widgets.dart';

/// Today's Signal readings for the History screen: time spent in each band,
/// a timeline, and CSV export. Renders nothing until a Signal has ever
/// been synced.
class SignalHistorySection extends ConsumerWidget {
  const SignalHistorySection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final history = ref.watch(signalReadingProvider.select((s) => s.history));
    if (history.isEmpty) return const SizedBox.shrink();

    final now = ref.watch(currentTimeProvider);
    final midnight = DateTime(now.year, now.month, now.day);
    final today = SignalLog.between(history, midnight, now);
    final inBand = SignalLog.timeInBand(history, from: midnight, to: now);
    final anySimulated = today.any((r) => r.simulated);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Expanded(child: SectionHeader('HeatNav Signal — today')),
            if (anySimulated) const SimulatedTag(),
          ],
        ),
        if (today.isEmpty)
          Text(
            context.tr('No Signal readings today.'),
            style: theme.textTheme.bodyMedium,
          )
        else ...[
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final entry in inBand.entries)
                _TimeInBandChip(band: entry.key, duration: entry.value),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            context.tr(
              'Each reading counts until the next one, for up '
              'to 30 minutes.',
            ),
            style: theme.textTheme.labelSmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: Column(
              children: [
                for (final reading in today.reversed)
                  _ReadingRow(reading: reading),
              ],
            ),
          ),
        ],
        const SizedBox(height: 8),
        OutlinedButton.icon(
          onPressed: () => _export(context, history),
          icon: const Icon(Icons.ios_share),
          label: Text(context.tr('Export CSV')),
        ),
        const SizedBox(height: 6),
        Text(
          context.tr(
            'Stored only on this phone. It leaves only when you '
            'export and share it.',
          ),
          style: theme.textTheme.labelSmall?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }

  static Future<void> _export(
    BuildContext context,
    List<SignalReading> history,
  ) async {
    final name =
        'heatnav-signal-${DateFormat('yyyyMMdd-HHmm').format(DateTime.now())}.csv';
    final file = XFile.fromData(
      utf8.encode(SignalLog.toCsv(history)),
      mimeType: 'text/csv',
      name: name,
    );
    final box = context.findRenderObject() as RenderBox?;
    await SharePlus.instance.share(
      ShareParams(
        files: [file],
        fileNameOverrides: [name],
        subject: 'HeatNav Signal readings',
        // Required on iPad, where the share sheet is a popover.
        sharePositionOrigin:
            box == null ? null : box.localToGlobal(Offset.zero) & box.size,
      ),
    );
  }
}

/// "2 h 10 m in red".
class _TimeInBandChip extends StatelessWidget {
  const _TimeInBandChip({required this.band, required this.duration});

  final SignalBand band;
  final Duration duration;

  @override
  Widget build(BuildContext context) {
    final palette = context.riskPalette;
    final h = duration.inHours;
    final m = duration.inMinutes % 60;
    final length = h > 0
        ? context.tr('{h} h {m} m', {'h': '$h', 'm': '$m'})
        : context.tr('{m} m', {'m': '$m'});
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: palette.containerOf(band.riskLevel),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: palette.of(band.riskLevel),
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 6),
          Text(
            context.tr('{d} in {band}', {
              'd': length,
              'band': context.tr(band.label).toLowerCase(),
            }),
            style: Theme.of(
              context,
            ).textTheme.labelMedium?.copyWith(fontWeight: FontWeight.w700),
          ),
        ],
      ),
    );
  }
}

class _ReadingRow extends StatelessWidget {
  const _ReadingRow({required this.reading});

  final SignalReading reading;

  @override
  Widget build(BuildContext context) {
    final band = reading.signalBand;
    return ListTile(
      leading: Text(
        DateFormat('HH:mm').format(reading.at),
        style: Theme.of(context).textTheme.titleSmall,
      ),
      title: Text('WBGT ${reading.wbgt.toStringAsFixed(1)} °C'),
      subtitle: Text(context.tr(band.workRest)),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (reading.simulated) ...[
            const SimulatedTag(),
            const SizedBox(width: 6),
          ],
          SignalBandChip(band, compact: true),
        ],
      ),
    );
  }
}
