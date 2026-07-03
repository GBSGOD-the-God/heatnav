import 'dart:convert';

import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;

import '../domain/place.dart';

/// Thrown when GPS can't be used — permission denied, service disabled, etc.
/// Carries a plain-language reason so the UI can explain what to do next.
class LocationException implements Exception {
  LocationException(this.message);
  final String message;

  @override
  String toString() => message;
}

/// Device GPS + reverse geocoding, so a user's *exact* location (not just a
/// pilot city) can become their home or a plan destination.
///
/// Reverse geocoding uses OpenStreetMap's Nominatim — free, keyless, and
/// consistent with the rest of the app's mapping stack. Nominatim's usage
/// policy asks for an identifying User-Agent and light request volume, both
/// of which are respected here.
abstract final class LocationService {
  static const _nominatimHost = 'nominatim.openstreetmap.org';
  static const _userAgent = 'HeatNav/1.0 (heat-safety competition app)';

  /// Requests permission if needed, then returns the device's current
  /// position as a labelled [Place]. Throws [LocationException] with a
  /// human-readable reason on any failure.
  static Future<Place> getCurrentPlace() async {
    if (!await Geolocator.isLocationServiceEnabled()) {
      throw LocationException(
        'Location services are turned off on this device.',
      );
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied) {
      throw LocationException('Location permission was denied.');
    }
    if (permission == LocationPermission.deniedForever) {
      throw LocationException(
        'Location permission is permanently denied. Enable it in your '
        'device/browser settings to use "current location".',
      );
    }

    final position = await Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.medium,
        timeLimit: Duration(seconds: 15),
      ),
    );

    final label = await _reverseGeocode(position.latitude, position.longitude);
    return Place(
      label: label.$1,
      latitude: position.latitude,
      longitude: position.longitude,
      city: label.$2,
    );
  }

  /// Returns (shortLabel, city) for a coordinate, falling back to raw
  /// coordinates if the network lookup fails — GPS still works offline,
  /// it just can't be named.
  static Future<(String, String)> _reverseGeocode(
    double lat,
    double lon,
  ) async {
    try {
      final uri = Uri.https(_nominatimHost, '/reverse', {
        'lat': '$lat',
        'lon': '$lon',
        'format': 'json',
        'zoom': '10',
      });
      final response = await http
          .get(uri, headers: {'User-Agent': _userAgent})
          .timeout(const Duration(seconds: 8));
      if (response.statusCode != 200) return _fallback(lat, lon);

      final json = jsonDecode(response.body) as Map<String, dynamic>;
      final address = json['address'] as Map<String, dynamic>?;
      final city = (address?['city'] ??
              address?['town'] ??
              address?['village'] ??
              address?['county']) as String?;
      final display = json['display_name'] as String?;
      if (city == null) return _fallback(lat, lon);
      return (display != null ? _shorten(display) : city, city);
    } catch (_) {
      return _fallback(lat, lon);
    }
  }

  static (String, String) _fallback(double lat, double lon) {
    final label = '${lat.toStringAsFixed(4)}, ${lon.toStringAsFixed(4)}';
    return (label, label);
  }

  static String _shorten(String displayName) {
    final parts = displayName.split(',').map((p) => p.trim()).toList();
    return parts.take(2).join(', ');
  }
}
