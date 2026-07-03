import 'dart:convert';

import 'package:http/http.dart' as http;

import 'weather_models.dart';

/// Open-Meteo client.
///
/// Chosen deliberately (blueprint §1.5): free, no API key, hourly apparent
/// temperature + UV + humidity, and a separate air-quality endpoint. A
/// keyless source means the demo cannot die to a billing or quota problem.
class OpenMeteoApi {
  OpenMeteoApi({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  static const _forecastHost = 'api.open-meteo.com';
  static const _airQualityHost = 'air-quality-api.open-meteo.com';

  /// Fetches raw forecast JSON so the repository can cache it verbatim.
  Future<Map<String, dynamic>> fetchForecastJson(
    double latitude,
    double longitude,
  ) async {
    final uri = Uri.https(_forecastHost, '/v1/forecast', {
      'latitude': '$latitude',
      'longitude': '$longitude',
      'current':
          'temperature_2m,relative_humidity_2m,apparent_temperature,uv_index,weather_code,wind_speed_10m',
      'hourly':
          'temperature_2m,relative_humidity_2m,apparent_temperature,uv_index,weather_code,precipitation_probability',
      'forecast_days': '7',
      'timezone': 'auto',
    });
    return _getJson(uri);
  }

  Future<Map<String, dynamic>> fetchAirQualityJson(
    double latitude,
    double longitude,
  ) async {
    final uri = Uri.https(_airQualityHost, '/v1/air-quality', {
      'latitude': '$latitude',
      'longitude': '$longitude',
      'current': 'us_aqi',
      'timezone': 'auto',
    });
    return _getJson(uri);
  }

  Future<Map<String, dynamic>> _getJson(Uri uri) async {
    final response =
        await _client.get(uri).timeout(const Duration(seconds: 12));
    if (response.statusCode != 200) {
      throw WeatherApiException(
        'Open-Meteo returned ${response.statusCode} for ${uri.path}',
      );
    }
    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  /// Parses the two raw payloads into the app's domain model.
  static WeatherBundle parseBundle({
    required Map<String, dynamic> forecast,
    Map<String, dynamic>? airQuality,
    required DateTime fetchedAt,
  }) {
    final current = forecast['current'] as Map<String, dynamic>;
    final hourly = forecast['hourly'] as Map<String, dynamic>;

    final times = (hourly['time'] as List).cast<String>();
    double hourlyNum(String key, int i) =>
        ((hourly[key] as List)[i] as num?)?.toDouble() ?? 0;

    final points = <HourlyPoint>[
      for (var i = 0; i < times.length; i++)
        HourlyPoint(
          time: DateTime.parse(times[i]),
          tempC: hourlyNum('temperature_2m', i),
          feelsLikeC: hourlyNum('apparent_temperature', i),
          humidity: hourlyNum('relative_humidity_2m', i),
          uvIndex: hourlyNum('uv_index', i),
          weatherCode: hourlyNum('weather_code', i).round(),
          precipitationChance: hourlyNum('precipitation_probability', i).round(),
        ),
    ];

    int? aqi;
    final aqCurrent = airQuality?['current'] as Map<String, dynamic>?;
    final rawAqi = aqCurrent?['us_aqi'] as num?;
    if (rawAqi != null) aqi = rawAqi.round();

    return WeatherBundle(
      current: CurrentWeather(
        time: DateTime.parse(current['time'] as String),
        tempC: (current['temperature_2m'] as num).toDouble(),
        feelsLikeC: (current['apparent_temperature'] as num).toDouble(),
        humidity: (current['relative_humidity_2m'] as num).toDouble(),
        uvIndex: ((current['uv_index'] as num?) ?? 0).toDouble(),
        weatherCode: ((current['weather_code'] as num?) ?? 0).round(),
        windKmh: ((current['wind_speed_10m'] as num?) ?? 0).toDouble(),
      ),
      hourly: points,
      usAqi: aqi,
      fetchedAt: fetchedAt,
    );
  }
}

class WeatherApiException implements Exception {
  WeatherApiException(this.message);
  final String message;

  @override
  String toString() => message;
}
