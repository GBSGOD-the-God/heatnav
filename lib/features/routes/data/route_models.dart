import 'package:latlong2/latlong.dart';

enum RouteKind {
  fastest('Fastest', 'Shortest travel time'),
  coolest('Coolest', 'Lowest heat exposure'),
  shaded('Most shaded', 'Maximum tree cover');

  const RouteKind(this.label, this.subtitle);
  final String label;
  final String subtitle;
}

/// One comparable route option between two points.
class RouteOption {
  const RouteOption({
    required this.kind,
    required this.minutes,
    required this.distanceKm,
    required this.shadePercent,
    required this.waterStops,
    required this.tempDeltaC,
    required this.points,
    required this.highlights,
  });

  final RouteKind kind;
  final int minutes;
  final double distanceKm;

  /// Portion of the route with meaningful shade (0–100).
  final int shadePercent;
  final int waterStops;

  /// Experienced-temperature difference vs. the fastest route (≤ 0 for
  /// cooler options).
  final double tempDeltaC;
  final List<LatLng> points;
  final List<String> highlights;
}

class RouteComparison {
  const RouteComparison({
    required this.from,
    required this.to,
    required this.options,
  });

  final String from;
  final String to;
  final List<RouteOption> options;
}
