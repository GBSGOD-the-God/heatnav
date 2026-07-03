import 'package:flutter_map/flutter_map.dart';

/// Single tile source definition — the seam where Google Maps tiles would
/// plug in. OpenStreetMap keeps the demo keyless and cache-friendly.
TileLayer osmTileLayer() => TileLayer(
      urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      userAgentPackageName: 'com.heatnav.heatnav',
    );
