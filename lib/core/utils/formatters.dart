import 'package:intl/intl.dart';

/// Central formatting so every screen renders values identically.
abstract final class Formatters {
  static String temp(double celsius) => '${celsius.round()}°';

  static String tempFull(double celsius) => '${celsius.round()}°C';

  static String hour(DateTime t) => DateFormat('h a').format(t);

  static String time(DateTime t) => DateFormat('h:mm a').format(t);

  static String weekday(DateTime t) => DateFormat('EEEE').format(t);

  static String dayShort(DateTime t) => DateFormat('EEE d').format(t);

  static String dateLong(DateTime t) => DateFormat('EEEE, d MMMM').format(t);

  /// "Just now", "25 min ago", "3 h ago", "2 d ago" — for community reports.
  static String relative(DateTime t, {DateTime? now}) {
    final diff = (now ?? DateTime.now()).difference(t);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes} min ago';
    if (diff.inHours < 24) return '${diff.inHours} h ago';
    return '${diff.inDays} d ago';
  }

  static String distanceKm(double km) =>
      km < 1 ? '${(km * 1000).round()} m' : '${km.toStringAsFixed(1)} km';

  static String duration(int minutes) {
    if (minutes < 60) return '$minutes min';
    final h = minutes ~/ 60;
    final m = minutes % 60;
    return m == 0 ? '$h h' : '$h h $m min';
  }
}
