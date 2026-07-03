import 'dart:math' as math;

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:latlong2/latlong.dart';

import '../../../core/domain/place.dart';
import 'route_models.dart';

/// Route intelligence interface.
///
/// Honesty contract (blueprint §1.3): segment-level shade cannot be computed
/// without tree-cover data we don't yet have, so this build ships a curated
/// demo implementation — clearly labelled in the UI — while the interface is
/// where an OSRM/Google Directions + canopy-data provider plugs in.
abstract interface class RouteIntelligenceRepository {
  Future<RouteComparison> compare({required Place from, required Place to});
}

/// Deterministic demo dataset: geometry synthesized between the two points,
/// comparative numbers hand-curated to represent a realistic pilot-city
/// study. Never presented as live computation.
class DemoRouteRepository implements RouteIntelligenceRepository {
  @override
  Future<RouteComparison> compare({
    required Place from,
    required Place to,
  }) async {
    final start = LatLng(from.latitude, from.longitude);
    // When origin and destination coincide (plans default to "around home"),
    // synthesize a nearby destination so the comparison stays meaningful.
    final end = (from.latitude == to.latitude && from.longitude == to.longitude)
        ? LatLng(to.latitude + 0.018, to.longitude + 0.022)
        : LatLng(to.latitude, to.longitude);

    const distance = Distance();
    final directKm = distance.as(LengthUnit.Kilometer, start, end);
    final baseMinutes = math.max(8, (directKm * 12).round()); // walking pace

    return RouteComparison(
      from: from.label,
      to: to.label,
      options: [
        RouteOption(
          kind: RouteKind.fastest,
          minutes: baseMinutes,
          distanceKm: directKm,
          shadePercent: 20,
          waterStops: 0,
          tempDeltaC: 0,
          points: _line(start, end, bulge: 0),
          highlights: const [
            'Main road, continuous traffic',
            'Long unshaded stretch at midday',
          ],
        ),
        RouteOption(
          kind: RouteKind.coolest,
          minutes: (baseMinutes * 1.2).round(),
          distanceKm: directKm * 1.15,
          shadePercent: 65,
          waterStops: 2,
          tempDeltaC: -3,
          points: _line(start, end, bulge: 0.35),
          highlights: const [
            'Passes 2 community water stations',
            'Runs along the park edge',
            'Community-reported shade for most of the way',
          ],
        ),
        RouteOption(
          kind: RouteKind.shaded,
          minutes: (baseMinutes * 1.35).round(),
          distanceKm: directKm * 1.25,
          shadePercent: 80,
          waterStops: 1,
          tempDeltaC: -2,
          points: _line(start, end, bulge: -0.4),
          highlights: const [
            'Tree-lined residential lanes',
            'Almost no direct sun before 4 PM',
          ],
        ),
      ],
    );
  }

  /// Smooth curve between two points; `bulge` bends it sideways so the three
  /// options are visually distinct on the map.
  static List<LatLng> _line(LatLng a, LatLng b, {required double bulge}) {
    const steps = 24;
    final points = <LatLng>[];
    // Perpendicular offset direction.
    final dLat = b.latitude - a.latitude;
    final dLng = b.longitude - a.longitude;
    for (var i = 0; i <= steps; i++) {
      final t = i / steps;
      final arc = math.sin(t * math.pi) * bulge;
      points.add(LatLng(
        a.latitude + dLat * t - dLng * arc * 0.5,
        a.longitude + dLng * t + dLat * arc * 0.5,
      ));
    }
    return points;
  }
}

final routeRepositoryProvider = Provider<RouteIntelligenceRepository>(
  (ref) => DemoRouteRepository(),
);
