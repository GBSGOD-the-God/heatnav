import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';

import '../domain/signal_band.dart';
import '../domain/signal_parser.dart';

/// Why a sync failed, with the plain-language message shown to the user.
/// Messages are English source strings, translated at display time.
enum SignalError {
  bluetoothOff('Bluetooth is off. Turn it on and tap Sync again.'),
  permissionDenied(
    'HeatNav needs the Nearby devices permission to read the Signal. '
    'Allow it in your phone settings, then tap Sync again.',
  ),
  locationOff(
    'Turn on Location, then tap Sync again. This phone needs it to scan '
    'for Bluetooth devices.',
  ),
  notFound(
    'No HeatNav Signal found nearby. Move closer to the Signal pole and '
    'tap Sync again.',
  ),
  badPayload(
    'A Signal was found, but its data could not be read. Wait a few '
    'seconds and tap Sync again.',
  ),
  unsupported(
    'This device can\'t scan for Bluetooth signals. Use HeatNav on an '
    'Android phone or iPhone to sync.',
  );

  const SignalError(this.message);
  final String message;
}

class SignalScanException implements Exception {
  const SignalScanException(this.error);
  final SignalError error;

  @override
  String toString() => 'SignalScanException(${error.name})';
}

/// Listens for advertisements. Implementations throw [SignalScanException]
/// for conditions the user has to fix (Bluetooth off, permission denied…).
abstract interface class SignalScanner {
  Future<List<SignalAdvert>> scan(Duration duration);
}

/// Real scanner: passive BLE scan, no pairing, no connection.
class BleSignalScanner implements SignalScanner {
  @override
  Future<List<SignalAdvert>> scan(Duration duration) async {
    // Browsers can't passively read advertisements; Web Bluetooth only
    // offers a device chooser.
    if (kIsWeb) throw const SignalScanException(SignalError.unsupported);
    try {
      if (!await FlutterBluePlus.isSupported) {
        throw const SignalScanException(SignalError.unsupported);
      }
      switch (await _adapterState()) {
        case BluetoothAdapterState.on:
          break;
        case BluetoothAdapterState.unauthorized:
          throw const SignalScanException(SignalError.permissionDenied);
        case BluetoothAdapterState.unavailable:
          throw const SignalScanException(SignalError.unsupported);
        default:
          throw const SignalScanException(SignalError.bluetoothOff);
      }

      try {
        return (await _scanOnce(duration, checkLocationServices: true)).adverts;
      } on SignalScanException catch (e) {
        if (e.error != SignalError.locationOff) rethrow;
        // The plugin insists on Location services on every Android version,
        // but Android 12+ scans without it (BLUETOOTH_SCAN is declared
        // neverForLocation). The check fails instantly, so retrying costs
        // no extra time. If the retry hears nothing at all, this phone
        // really does need Location for scanning.
        final retry = await _scanOnce(duration, checkLocationServices: false);
        if (!retry.heardAny) rethrow;
        return retry.adverts;
      }
    } on PlatformException catch (e) {
      throw SignalScanException(_classify(e.message));
    } on FlutterBluePlusException catch (e) {
      throw SignalScanException(_classify(e.description));
    }
  }

  /// On iOS the state stays unknown while the permission prompt is open,
  /// so this waits long enough for the user to answer it.
  Future<BluetoothAdapterState> _adapterState() async {
    final now = FlutterBluePlus.adapterStateNow;
    if (now != BluetoothAdapterState.unknown) return now;
    return FlutterBluePlus.adapterState
        .firstWhere((s) => s != BluetoothAdapterState.unknown)
        .timeout(
          const Duration(seconds: 15),
          onTimeout: () => BluetoothAdapterState.unknown,
        );
  }

  Future<({List<SignalAdvert> adverts, bool heardAny})> _scanOnce(
    Duration duration, {
    required bool checkLocationServices,
  }) async {
    final adverts = <SignalAdvert>[];
    var heardAny = false;
    final sub = FlutterBluePlus.onScanResults.listen((results) {
      if (results.isNotEmpty) heardAny = true;
      for (final r in results) {
        final name = r.advertisementData.advName;
        if (!SignalParser.looksLikeSignal(name)) continue;
        adverts.add(
          SignalAdvert(
            deviceId: r.device.remoteId.str,
            name: name,
            rssi: r.rssi,
          ),
        );
      }
    });
    try {
      // Runtime permissions are requested inside startScan — i.e. at the
      // moment the user taps Sync, never at app start.
      await FlutterBluePlus.startScan(
        timeout: duration,
        // The name changes every second with new data, so keep processing
        // repeat advertisements instead of only the first per device.
        continuousUpdates: true,
        androidCheckLocationServices: checkLocationServices,
      );
      await FlutterBluePlus.isScanning
          .where((scanning) => !scanning)
          .first
          .timeout(
        duration + const Duration(seconds: 1),
        onTimeout: () async {
          await FlutterBluePlus.stopScan();
          return false;
        },
      );
    } finally {
      await sub.cancel();
    }
    return (adverts: adverts, heardAny: heardAny);
  }

  /// Maps the plugin's platform error text to a typed error.
  static SignalError _classify(String? message) {
    final m = (message ?? '').toLowerCase();
    if (m.contains('permission')) return SignalError.permissionDenied;
    if (m.contains('location services')) return SignalError.locationOff;
    if (m.contains('turned on') || m.contains('adapter')) {
      return SignalError.bluetoothOff;
    }
    return SignalError.notFound;
  }
}

/// Debug-only rehearsal source: every scan returns a hotter reading than the
/// last, climbing green → flashing red, encoded exactly as a real device
/// would so the whole parse path is exercised.
class SimulatedSignalScanner implements SignalScanner {
  int _step = 0;

  /// (air, globe, wet bulb) in °C for each successive scan.
  static const _steps = [
    (31.0, 34.0, 22.0),
    (33.0, 37.0, 23.4),
    (34.0, 40.0, 26.0),
    (36.0, 36.0, 29.4),
    (38.0, 44.0, 29.0),
  ];

  @override
  Future<List<SignalAdvert>> scan(Duration duration) async {
    // Short pause so the syncing state is visible during rehearsal.
    await Future<void>.delayed(const Duration(milliseconds: 1200));
    final (air, globe, wet) = _steps[math.min(_step, _steps.length - 1)];
    _step++;
    final wbgtTenths = ((0.7 * wet + 0.2 * globe + 0.1 * air) * 10).round();
    final band = SignalBand.forWbgt(wbgtTenths / 10);
    int tenths(double v) => (v * 10).round();
    return [
      SignalAdvert(
        deviceId: 'simulated',
        name: 'HNS-$wbgtTenths-${tenths(globe)}-${tenths(wet)}-'
            '${tenths(air)}-${band.code}',
        rssi: -58,
      ),
    ];
  }
}
