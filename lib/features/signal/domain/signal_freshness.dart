import 'signal_reading.dart';

enum SignalFreshness {
  /// Under 30 minutes old: drives Today and Plan My Day ratings.
  fresh,

  /// 30–60 minutes: still shown on the card, greyed, but no longer rates.
  stale,

  /// Over 60 minutes (or timestamped in the future): history only.
  expired,
}

abstract final class SignalFreshnessRules {
  static const staleAfter = Duration(minutes: 30);
  static const expireAfter = Duration(minutes: 60);

  /// A reading from the future means the phone's clock was changed; it
  /// can't be trusted as "current", so it's treated as expired. The small
  /// grace absorbs ordinary clock jitter.
  static const _futureGrace = Duration(minutes: 2);

  static SignalFreshness of(SignalReading reading, DateTime now) {
    final age = now.difference(reading.at);
    if (age < -_futureGrace) return SignalFreshness.expired;
    if (age < staleAfter) return SignalFreshness.fresh;
    if (age < expireAfter) return SignalFreshness.stale;
    return SignalFreshness.expired;
  }

  static bool usableForRating(SignalReading reading, DateTime now) =>
      of(reading, now) == SignalFreshness.fresh;

  /// A current measurement only describes the present, so it applies to a
  /// plan that is underway or starts before the reading would go stale —
  /// never to a plan later today or on another day.
  static bool appliesToPlan({
    required DateTime leaveAt,
    required DateTime returnAt,
    required DateTime now,
  }) =>
      !leaveAt.isAfter(now.add(staleAfter)) && !returnAt.isBefore(now);
}
