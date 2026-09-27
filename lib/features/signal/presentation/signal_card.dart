import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/i18n/app_localizations.dart';
import '../../../core/utils/clock.dart';
import '../domain/signal_freshness.dart';
import '../domain/signal_reading.dart';
import 'signal_providers.dart';
import 'signal_widgets.dart';

/// "HeatNav Signal" card on Today: sync with a nearby pole-mounted sensor
/// and show what it measured.
class SignalCard extends ConsumerWidget {
  const SignalCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final state = ref.watch(signalReadingProvider);
    final now = ref.watch(currentTimeProvider);
    final last = state.last;
    final freshness = last == null ? null : SignalFreshnessRules.of(last, now);
    final showReading = last != null && freshness != SignalFreshness.expired;

    return Card(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.sensors, color: theme.colorScheme.primary),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    context.tr('HeatNav Signal'),
                    style: theme.textTheme.titleMedium,
                  ),
                ),
                if (state.simulate || (showReading && last.simulated))
                  const SimulatedTag(),
              ],
            ),
            const SizedBox(height: 12),
            if (state.syncing)
              const _Syncing()
            else if (showReading)
              _ReadingView(
                reading: last,
                stale: freshness == SignalFreshness.stale,
                now: now,
              )
            else ...[
              Text(
                context.tr('Measures the heat right where you are.'),
                style: theme.textTheme.bodyMedium,
              ),
              if (last != null) ...[
                const SizedBox(height: 6),
                Text(
                  context.tr(
                    'Last reading is over an hour old — kept in '
                    'history, not used for ratings.',
                  ),
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ],
            if (state.error != null && !state.syncing) ...[
              const SizedBox(height: 12),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: theme.colorScheme.errorContainer,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Text(
                  context.tr(state.error!.message),
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onErrorContainer,
                  ),
                ),
              ),
            ],
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerLeft,
              child: showReading && !state.syncing
                  ? TextButton.icon(
                      onPressed: () =>
                          ref.read(signalReadingProvider.notifier).sync(),
                      icon: const Icon(Icons.refresh),
                      label: Text(context.tr('Sync again')),
                    )
                  : FilledButton.icon(
                      onPressed: state.syncing
                          ? null
                          : () =>
                              ref.read(signalReadingProvider.notifier).sync(),
                      icon: const Icon(Icons.bluetooth_searching),
                      label: Text(context.tr('Sync')),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Syncing extends StatelessWidget {
  const _Syncing();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const SizedBox(
          width: 18,
          height: 18,
          child: CircularProgressIndicator(strokeWidth: 2.2),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            context.tr('Looking for a Signal nearby…'),
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ),
      ],
    );
  }
}

/// Luminance-weighted greyscale, for readings that may be out of date.
const _greyscale = ColorFilter.matrix([
  0.2126, 0.7152, 0.0722, 0, 0, //
  0.2126, 0.7152, 0.0722, 0, 0, //
  0.2126, 0.7152, 0.0722, 0, 0, //
  0, 0, 0, 1, 0, //
]);

class _ReadingView extends StatelessWidget {
  const _ReadingView({
    required this.reading,
    required this.stale,
    required this.now,
  });

  final SignalReading reading;
  final bool stale;
  final DateTime now;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final band = reading.signalBand;
    final minutes = now.difference(reading.at).inMinutes;
    final measured = minutes < 1
        ? context.tr('measured just now')
        : context.tr('measured {n} min ago', {'n': '$minutes'});

    final body = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Text(
              reading.wbgt.toStringAsFixed(1),
              style: theme.textTheme.displayMedium?.copyWith(
                fontWeight: FontWeight.w700,
                height: 1,
              ),
            ),
            const SizedBox(width: 6),
            Text('°C\nWBGT', style: theme.textTheme.labelMedium),
            const Spacer(),
            SignalBandChip(band),
          ],
        ),
        const SizedBox(height: 12),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: theme.colorScheme.surfaceContainerHigh,
            borderRadius: BorderRadius.circular(14),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.timer_outlined, size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      context.tr(band.workRest),
                      style: theme.textTheme.titleSmall,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  const Icon(Icons.water_drop_outlined, size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      context.tr(band.water),
                      style: theme.textTheme.bodyMedium,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                context.tr('Heavy work limits · US Army TB MED 507'),
                style: theme.textTheme.labelSmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 10),
        Text(
          context.tr('Globe {g} · Wet bulb {w} · Air {a}', {
            'g': '${reading.globe.toStringAsFixed(1)}°',
            'w': '${reading.wet.toStringAsFixed(1)}°',
            'a': '${reading.air.toStringAsFixed(1)}°',
          }),
          style: theme.textTheme.labelSmall?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          measured,
          style: theme.textTheme.labelSmall?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    );

    if (!stale) return body;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Opacity(
          opacity: 0.55,
          child: ColorFiltered(colorFilter: _greyscale, child: body),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Icon(
              Icons.history_toggle_off,
              size: 18,
              color: theme.colorScheme.error,
            ),
            const SizedBox(width: 6),
            Expanded(
              child: Text(
                context.tr('may be out of date — sync again'),
                style: theme.textTheme.labelLarge?.copyWith(
                  color: theme.colorScheme.error,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}
