import 'dart:math' as math;

/// Heat index (apparent temperature from air temperature + relative humidity)
/// using the US National Weather Service procedure.
///
/// Source: Rothfusz, L.P. (1990), "The Heat Index Equation", NWS Technical
/// Attachment SR 90-23, as operationally applied by the NWS
/// (https://www.wpc.ncep.noaa.gov/html/heatindex_equation.shtml).
///
/// This is published, citable science — HeatNav's rule: if we can't cite it,
/// we don't compute it.
abstract final class HeatIndex {
  /// Computes the heat index in °C from [tempC] (air temperature, °C) and
  /// [relativeHumidity] (0–100 %).
  static double celsius(double tempC, double relativeHumidity) {
    final tF = tempC * 9 / 5 + 32;
    final hiF = _fahrenheit(tF, relativeHumidity.clamp(0, 100).toDouble());
    return (hiF - 32) * 5 / 9;
  }

  static double _fahrenheit(double t, double rh) {
    // NWS procedure: start with the simple Steadman formula averaged with the
    // air temperature; only if that result is >= 80°F is the full Rothfusz
    // regression (with its adjustments) applied.
    final simple = 0.5 * (t + 61.0 + ((t - 68.0) * 1.2) + (rh * 0.094));
    final averaged = (simple + t) / 2;
    if (averaged < 80.0) return averaged;

    var hi = -42.379 +
        2.04901523 * t +
        10.14333127 * rh -
        0.22475541 * t * rh -
        6.83783e-3 * t * t -
        5.481717e-2 * rh * rh +
        1.22874e-3 * t * t * rh +
        8.5282e-4 * t * rh * rh -
        1.99e-6 * t * t * rh * rh;

    if (rh < 13 && t >= 80 && t <= 112) {
      hi -= ((13 - rh) / 4) * math.sqrt((17 - (t - 95.0).abs()) / 17);
    } else if (rh > 85 && t >= 80 && t <= 87) {
      hi += ((rh - 85) / 10) * ((87 - t) / 5);
    }
    return hi;
  }
}
