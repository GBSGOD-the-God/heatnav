import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/storage/local_store.dart';
import 'open_meteo_api.dart';
import 'weather_models.dart';

/// Network-first, cache-fallback weather repository.
///
/// The offline contract: the app never shows an infinite spinner. If the
/// network fails and a cached payload exists, we serve it flagged
/// `isFromCache` so the UI can show "last updated …" honestly.
class WeatherRepository {
  WeatherRepository(this._api, this._store);

  final OpenMeteoApi _api;
  final LocalStore _store;

  static const _cacheKey = 'weather_cache';

  Future<WeatherBundle> load(double latitude, double longitude) async {
    try {
      final forecast = await _api.fetchForecastJson(latitude, longitude);
      Map<String, dynamic>? airQuality;
      try {
        airQuality = await _api.fetchAirQualityJson(latitude, longitude);
      } catch (_) {
        // AQI is enrichment, not a hard dependency — degrade to null.
      }
      final fetchedAt = DateTime.now();
      await _store.writeObject(_cacheKey, {
        'forecast': forecast,
        'airQuality': airQuality,
        'fetchedAt': fetchedAt.toIso8601String(),
        'latitude': latitude,
        'longitude': longitude,
      });
      return OpenMeteoApi.parseBundle(
        forecast: forecast,
        airQuality: airQuality,
        fetchedAt: fetchedAt,
      );
    } catch (_) {
      final cached = loadCached();
      if (cached != null) return cached;
      rethrow;
    }
  }

  WeatherBundle? loadCached() {
    final json = _store.readObject(_cacheKey);
    if (json == null) return null;
    try {
      return OpenMeteoApi.parseBundle(
        forecast: json['forecast'] as Map<String, dynamic>,
        airQuality: json['airQuality'] as Map<String, dynamic>?,
        fetchedAt: DateTime.parse(json['fetchedAt'] as String),
      ).copyWith(isFromCache: true);
    } catch (_) {
      return null;
    }
  }
}

final weatherRepositoryProvider = Provider<WeatherRepository>(
  (ref) => WeatherRepository(OpenMeteoApi(), ref.watch(localStoreProvider)),
);
