/// Weather domain models, deserialized from Open-Meteo responses and cached
/// as raw JSON for offline use.
class HourlyPoint {
  const HourlyPoint({
    required this.time,
    required this.tempC,
    required this.feelsLikeC,
    required this.humidity,
    required this.uvIndex,
    required this.weatherCode,
    required this.precipitationChance,
  });

  final DateTime time;
  final double tempC;
  final double feelsLikeC;
  final double humidity;
  final double uvIndex;
  final int weatherCode;
  final int precipitationChance;
}

class CurrentWeather {
  const CurrentWeather({
    required this.time,
    required this.tempC,
    required this.feelsLikeC,
    required this.humidity,
    required this.uvIndex,
    required this.weatherCode,
    required this.windKmh,
  });

  final DateTime time;
  final double tempC;
  final double feelsLikeC;
  final double humidity;
  final double uvIndex;
  final int weatherCode;
  final double windKmh;
}

/// Everything the app needs about weather at one location.
class WeatherBundle {
  const WeatherBundle({
    required this.current,
    required this.hourly,
    required this.usAqi,
    required this.fetchedAt,
    this.isFromCache = false,
  });

  final CurrentWeather current;

  /// 7 days of hourly points, starting today at 00:00 local time.
  final List<HourlyPoint> hourly;

  /// Current US AQI; null when the air-quality endpoint was unavailable.
  final int? usAqi;

  final DateTime fetchedAt;
  final bool isFromCache;

  /// Hourly points for a given calendar day.
  List<HourlyPoint> hoursOf(DateTime day) => hourly
      .where((h) =>
          h.time.year == day.year &&
          h.time.month == day.month &&
          h.time.day == day.day)
      .toList();

  /// Nearest hourly point to [time] (for plan analysis).
  HourlyPoint? nearestTo(DateTime time) {
    if (hourly.isEmpty) return null;
    HourlyPoint best = hourly.first;
    var bestDiff = (best.time.difference(time)).abs();
    for (final h in hourly) {
      final diff = (h.time.difference(time)).abs();
      if (diff < bestDiff) {
        best = h;
        bestDiff = diff;
      }
    }
    return best;
  }

  WeatherBundle copyWith({bool? isFromCache}) => WeatherBundle(
        current: current,
        hourly: hourly,
        usAqi: usAqi,
        fetchedAt: fetchedAt,
        isFromCache: isFromCache ?? this.isFromCache,
      );
}

/// WMO weather interpretation codes used by Open-Meteo.
abstract final class WeatherCodes {
  static String describe(int code) => switch (code) {
        0 => 'Clear sky',
        1 => 'Mostly clear',
        2 => 'Partly cloudy',
        3 => 'Overcast',
        45 || 48 => 'Fog',
        51 || 53 || 55 => 'Drizzle',
        61 || 63 || 65 => 'Rain',
        66 || 67 => 'Freezing rain',
        71 || 73 || 75 || 77 => 'Snow',
        80 || 81 || 82 => 'Rain showers',
        85 || 86 => 'Snow showers',
        95 => 'Thunderstorm',
        96 || 99 => 'Thunderstorm with hail',
        _ => 'Unknown',
      };

  static bool isSunny(int code) => code <= 1;
}
