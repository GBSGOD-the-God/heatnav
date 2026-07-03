import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/storage/local_store.dart';

/// Post-exposure symptoms. The advice per symptom follows WHO / Red Cross /
/// CDC first-aid guidance for heat illness — evidence-based, or absent.
enum RecoveryFeeling {
  normal('Normal', Icons.sentiment_satisfied_alt,
      advice: 'Good sign. Rehydrate anyway — recovery water counts double '
          'in a heatwave — and rest 10 minutes before the next task.',
      isWarning: false),
  tired('Tired / drained', Icons.battery_2_bar,
      advice: 'Sit in the coolest room, drink water slowly, and eat '
          'something salty. Fatigue is the body\'s first heat signal — '
          'don\'t head out again for at least an hour.',
      isWarning: false),
  headache('Headache', Icons.sick_outlined,
      advice: 'Classic early heat-exhaustion sign. Cool, dark room; water '
          'or ORS; a wet cloth on the neck. If it worsens or vomiting '
          'starts, seek medical help.',
      isWarning: true),
  dizzy('Dizzy / faint', Icons.blur_on,
      advice: 'Lie down with legs slightly raised, in the coolest spot '
          'available. Sip ORS. If dizziness doesn\'t ease within 30 '
          'minutes — or confusion appears — get medical help now.',
      isWarning: true),
  cramps('Muscle cramps', Icons.sports_martial_arts,
      advice: 'Heat cramps mean salt loss. Stop activity, stretch gently, '
          'take ORS or salted water. No strenuous work for a few hours.',
      isWarning: true);

  const RecoveryFeeling(
    this.label,
    this.icon, {
    required this.advice,
    required this.isWarning,
  });

  final String label;
  final IconData icon;
  final String advice;
  final bool isWarning;
}

class RecoveryCheckin {
  const RecoveryCheckin({required this.time, required this.feeling});

  final DateTime time;
  final RecoveryFeeling feeling;

  Map<String, dynamic> toJson() =>
      {'time': time.toIso8601String(), 'feeling': feeling.name};

  factory RecoveryCheckin.fromJson(Map<String, dynamic> json) =>
      RecoveryCheckin(
        time: DateTime.parse(json['time'] as String),
        feeling: RecoveryFeeling.values.byName(json['feeling'] as String),
      );
}

class CheckinsController extends Notifier<List<RecoveryCheckin>> {
  static const _key = 'recovery_checkins';

  @override
  List<RecoveryCheckin> build() => ref
      .read(localStoreProvider)
      .readList(_key)
      .map(RecoveryCheckin.fromJson)
      .toList();

  Future<void> add(RecoveryFeeling feeling) async {
    state = [
      ...state,
      RecoveryCheckin(time: DateTime.now(), feeling: feeling),
    ];
    await ref
        .read(localStoreProvider)
        .writeList(_key, state.map((c) => c.toJson()).toList());
  }
}

final checkinsProvider =
    NotifierProvider<CheckinsController, List<RecoveryCheckin>>(
  CheckinsController.new,
);
