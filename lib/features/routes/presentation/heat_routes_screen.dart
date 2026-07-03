import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/domain/place.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/skeleton.dart';
import '../../map/presentation/map_tiles.dart';
import '../../profile/presentation/profile_controller.dart';
import '../data/route_models.dart';
import '../data/route_repository.dart';

final _comparisonProvider =
    FutureProvider.family<RouteComparison, Place>((ref, destination) {
  final home = ref.watch(profileControllerProvider)!.home;
  return ref
      .watch(routeRepositoryProvider)
      .compare(from: home, to: destination);
});

/// Fastest vs coolest vs most-shaded — the "not just shortest" feature.
class HeatRoutesScreen extends ConsumerStatefulWidget {
  const HeatRoutesScreen({super.key});

  @override
  ConsumerState<HeatRoutesScreen> createState() => _HeatRoutesScreenState();
}

class _HeatRoutesScreenState extends ConsumerState<HeatRoutesScreen> {
  Place? _destination;
  RouteKind _selected = RouteKind.coolest;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final profile = ref.watch(profileControllerProvider)!;
    final destination = _destination ??
        Place(
          label: 'City centre',
          latitude: profile.home.latitude,
          longitude: profile.home.longitude,
          city: profile.home.city,
        );
    final comparison = ref.watch(_comparisonProvider(destination));

    return Scaffold(
      appBar: AppBar(title: const Text('Heat routes')),
      body: comparison.when(
        loading: () => ListView(
          padding: const EdgeInsets.all(20),
          children: const [
            Skeleton.card(height: 220),
            SizedBox(height: 16),
            Skeleton.card(height: 120),
            SizedBox(height: 12),
            Skeleton.card(height: 120),
          ],
        ),
        error: (e, _) => Center(child: Text('Route comparison failed: $e')),
        data: (routes) => ListView(
          padding: const EdgeInsets.fromLTRB(20, 4, 20, 32),
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: theme.colorScheme.surfaceContainerHigh,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(
                children: [
                  Icon(Icons.science_outlined,
                      size: 18, color: theme.colorScheme.primary),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Pilot-city demo dataset. Live shade computation plugs '
                      'in behind this same screen.',
                      style: theme.textTheme.labelMedium,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(24),
              child: SizedBox(
                height: 220,
                child: _RouteMap(
                  comparison: routes,
                  selected: _selected,
                ),
              ),
            ).animate().fadeIn(duration: 400.ms),
            const SizedBox(height: 16),
            for (final option in routes.options)
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: _RouteCard(
                  option: option,
                  isSelected: option.kind == _selected,
                  onTap: () => setState(() => _selected = option.kind),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _RouteMap extends StatelessWidget {
  const _RouteMap({required this.comparison, required this.selected});

  final RouteComparison comparison;
  final RouteKind selected;

  static Color colorOf(BuildContext context, RouteKind kind) {
    final scheme = Theme.of(context).colorScheme;
    return switch (kind) {
      RouteKind.fastest => scheme.error,
      RouteKind.coolest => scheme.primary,
      RouteKind.shaded => scheme.tertiary,
    };
  }

  @override
  Widget build(BuildContext context) {
    final all = comparison.options.expand((o) => o.points).toList();
    final bounds = LatLngBounds.fromPoints(all);
    return FlutterMap(
      options: MapOptions(
        initialCameraFit: CameraFit.bounds(
          bounds: bounds,
          padding: const EdgeInsets.all(32),
        ),
      ),
      children: [
        osmTileLayer(),
        PolylineLayer(
          polylines: [
            for (final option in comparison.options)
              Polyline(
                points: option.points,
                strokeWidth: option.kind == selected ? 6 : 3,
                color: colorOf(context, option.kind).withValues(
                  alpha: option.kind == selected ? 0.95 : 0.45,
                ),
              ),
          ],
        ),
        MarkerLayer(
          markers: [
            Marker(
              point: comparison.options.first.points.first,
              child: const Icon(Icons.trip_origin, size: 20),
            ),
            Marker(
              point: comparison.options.first.points.last,
              child: const Icon(Icons.location_pin, size: 28),
            ),
          ],
        ),
        const SimpleAttributionWidget(
          source: Text('© OpenStreetMap contributors'),
        ),
      ],
    );
  }
}

class _RouteCard extends StatelessWidget {
  const _RouteCard({
    required this.option,
    required this.isSelected,
    required this.onTap,
  });

  final RouteOption option;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final color = _RouteMap.colorOf(context, option.kind);
    return AnimatedContainer(
      duration: const Duration(milliseconds: 250),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainer,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isSelected ? color : Colors.transparent,
          width: 1.5,
        ),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(24),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 12,
                    height: 12,
                    decoration:
                        BoxDecoration(color: color, shape: BoxShape.circle),
                  ),
                  const SizedBox(width: 8),
                  Text(option.kind.label, style: theme.textTheme.titleMedium),
                  const Spacer(),
                  Text(
                    '${option.minutes} min · ${Formatters.distanceKm(option.distanceKm)}',
                    style: theme.textTheme.titleSmall,
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  _Metric(
                    icon: Icons.park_outlined,
                    text: '${option.shadePercent}% shaded',
                  ),
                  _Metric(
                    icon: Icons.water_drop_outlined,
                    text: '${option.waterStops} water',
                  ),
                  _Metric(
                    icon: Icons.thermostat,
                    text: option.tempDeltaC == 0
                        ? 'baseline'
                        : '${option.tempDeltaC.toStringAsFixed(0)}°C cooler',
                  ),
                ],
              ),
              if (isSelected) ...[
                const SizedBox(height: 10),
                for (final highlight in option.highlights)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 4),
                    child: Row(
                      children: [
                        Icon(Icons.check,
                            size: 14, color: theme.colorScheme.primary),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(highlight,
                              style: theme.textTheme.bodySmall),
                        ),
                      ],
                    ),
                  ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _Metric extends StatelessWidget {
  const _Metric({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Expanded(
      child: Row(
        children: [
          Icon(icon, size: 16, color: theme.colorScheme.onSurfaceVariant),
          const SizedBox(width: 4),
          Flexible(
            child: Text(
              text,
              style: theme.textTheme.labelMedium,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}
