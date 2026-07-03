/// App-wide constants. The display name lives here so a rename before the
/// competition is a one-line change.
abstract final class AppConstants {
  static const String appName = 'HeatNav';
  static const String tagline = 'Navigate your day, not just the weather.';

  /// Hours (local time) treated as the default peak-heat window when no
  /// forecast is available. The risk engine always prefers real forecast data.
  static const int defaultPeakStartHour = 12;
  static const int defaultPeakEndHour = 16;

  /// India's national ambulance number. Shown on the emergency screen.
  static const String emergencyNumber = '108';

  /// How long cached weather stays acceptable before the UI flags it as stale.
  static const Duration weatherStaleAfter = Duration(hours: 3);
}
