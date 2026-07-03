import 'dart:convert';

import 'package:http/http.dart' as http;

import '../../../core/domain/place.dart';

/// Worldwide place search (forward geocoding) via OpenStreetMap Nominatim —
/// keyless, consistent with the rest of the mapping stack. Lets a user type
/// their exact address, locality or landmark instead of picking from a
/// fixed city list.
abstract final class PlaceSearchApi {
  static const _host = 'nominatim.openstreetmap.org';
  static const _userAgent = 'HeatNav/1.0 (heat-safety competition app)';

  static Future<List<Place>> search(String query) async {
    final trimmed = query.trim();
    if (trimmed.length < 3) return const [];

    final uri = Uri.https(_host, '/search', {
      'q': trimmed,
      'format': 'jsonv2',
      'addressdetails': '1',
      'limit': '8',
    });

    final response = await http
        .get(uri, headers: {'User-Agent': _userAgent})
        .timeout(const Duration(seconds: 8));
    if (response.statusCode != 200) return const [];

    final results = jsonDecode(response.body) as List;
    return results.map((entry) {
      final e = entry as Map<String, dynamic>;
      final address = e['address'] as Map<String, dynamic>?;
      final city = (address?['city'] ??
              address?['town'] ??
              address?['village'] ??
              address?['county'] ??
              address?['state']) as String? ??
          (e['display_name'] as String).split(',').first.trim();
      final display = e['display_name'] as String;
      return Place(
        label: display.split(',').take(2).map((p) => p.trim()).join(', '),
        latitude: double.parse(e['lat'] as String),
        longitude: double.parse(e['lon'] as String),
        city: city,
      );
    }).toList();
  }
}
