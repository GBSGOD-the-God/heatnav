import 'package:flutter/material.dart';

import '../../../core/domain/place.dart';
import '../../../core/domain/profile/user_profile.dart';
import '../../../core/domain/risk/risk_engine.dart';

/// Activity presets so creating a plan is chips, not typing. Each preset
/// carries honest defaults for exertion and exposure.
enum ActivityType {
  sport('Sport / exercise', Icons.sports_cricket,
      exertion: ExertionLevel.heavy, isOutdoor: true),
  school('School / college', Icons.school,
      exertion: ExertionLevel.light, isOutdoor: false),
  officeWork('Office work', Icons.business_center,
      exertion: ExertionLevel.light, isOutdoor: false),
  siteWork('Construction / site work', Icons.construction,
      exertion: ExertionLevel.heavy, isOutdoor: true),
  delivery('Delivery round', Icons.delivery_dining,
      exertion: ExertionLevel.moderate, isOutdoor: true),
  farmWork('Farm work', Icons.agriculture,
      exertion: ExertionLevel.heavy, isOutdoor: true),
  shopping('Market / shopping', Icons.shopping_bag,
      exertion: ExertionLevel.moderate, isOutdoor: true),
  hospital('Hospital / clinic visit', Icons.local_hospital,
      exertion: ExertionLevel.light, isOutdoor: false),
  event('Outdoor event', Icons.festival,
      exertion: ExertionLevel.moderate, isOutdoor: true),
  other('Something else', Icons.more_horiz,
      exertion: ExertionLevel.moderate, isOutdoor: true);

  const ActivityType(
    this.label,
    this.icon, {
    required this.exertion,
    required this.isOutdoor,
  });

  final String label;
  final IconData icon;
  final ExertionLevel exertion;
  final bool isOutdoor;
}

class Plan {
  const Plan({
    required this.id,
    required this.title,
    required this.activity,
    required this.destination,
    required this.leaveAt,
    required this.returnAt,
    required this.transport,
    required this.isOutdoor,
    this.notes = '',
    this.checkedItems = const {},
  });

  final String id;
  final String title;
  final ActivityType activity;
  final Place destination;
  final DateTime leaveAt;
  final DateTime returnAt;
  final TransportMode transport;

  /// User can override the preset (e.g. indoor cricket nets).
  final bool isOutdoor;
  final String notes;

  /// Labels of preparation-checklist items already ticked off.
  final Set<String> checkedItems;

  int get durationMinutes => returnAt.difference(leaveAt).inMinutes;

  bool get isPast => returnAt.isBefore(DateTime.now());

  Plan copyWith({Set<String>? checkedItems}) => Plan(
        id: id,
        title: title,
        activity: activity,
        destination: destination,
        leaveAt: leaveAt,
        returnAt: returnAt,
        transport: transport,
        isOutdoor: isOutdoor,
        notes: notes,
        checkedItems: checkedItems ?? this.checkedItems,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'activity': activity.name,
        'destination': destination.toJson(),
        'leaveAt': leaveAt.toIso8601String(),
        'returnAt': returnAt.toIso8601String(),
        'transport': transport.name,
        'isOutdoor': isOutdoor,
        'notes': notes,
        'checkedItems': checkedItems.toList(),
      };

  factory Plan.fromJson(Map<String, dynamic> json) => Plan(
        id: json['id'] as String,
        title: json['title'] as String,
        activity: ActivityType.values.byName(json['activity'] as String),
        destination:
            Place.fromJson(json['destination'] as Map<String, dynamic>),
        leaveAt: DateTime.parse(json['leaveAt'] as String),
        returnAt: DateTime.parse(json['returnAt'] as String),
        transport: TransportMode.values.byName(json['transport'] as String),
        isOutdoor: json['isOutdoor'] as bool,
        notes: json['notes'] as String? ?? '',
        checkedItems: ((json['checkedItems'] as List?) ?? const [])
            .cast<String>()
            .toSet(),
      );
}
