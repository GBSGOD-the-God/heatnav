import 'package:flutter/material.dart';

/// Structured report categories — deliberately NOT free-form posts
/// (blueprint: "do not create Reddit"). Each category carries its own
/// expiry: a power cut report is stale in hours, a water station is not.
enum ReportCategory {
  extremeHeat('Extreme heat', Icons.local_fire_department,
      ttl: Duration(hours: 6), isHazard: true),
  powerCut('Power cut', Icons.power_off,
      ttl: Duration(hours: 8), isHazard: true),
  waterStation('Water station', Icons.water_drop,
      ttl: Duration(days: 30), isHazard: false),
  coolingCentre('Cooling centre', Icons.ac_unit,
      ttl: Duration(days: 30), isHazard: false),
  shade('Good shade', Icons.park,
      ttl: Duration(days: 60), isHazard: false),
  noShade('No shade', Icons.wb_sunny,
      ttl: Duration(days: 60), isHazard: true),
  roadClosed('Road closed', Icons.block,
      ttl: Duration(hours: 24), isHazard: true),
  medicalEmergency('Medical emergency', Icons.medical_services,
      ttl: Duration(hours: 3), isHazard: true),
  brokenWaterSupply('Broken water supply', Icons.format_color_reset,
      ttl: Duration(hours: 24), isHazard: true);

  const ReportCategory(
    this.label,
    this.icon, {
    required this.ttl,
    required this.isHazard,
  });

  final String label;
  final IconData icon;

  /// How long a report of this kind stays visible before expiring.
  final Duration ttl;

  /// Hazards raise alerts; non-hazards are resources shown on the map.
  final bool isHazard;
}

class CommunityReport {
  const CommunityReport({
    required this.id,
    required this.category,
    required this.description,
    required this.latitude,
    required this.longitude,
    required this.createdAt,
    required this.authorName,
    this.upvotes = 0,
    this.downvotes = 0,
    this.isSample = false,
    this.isMine = false,
  });

  final String id;
  final ReportCategory category;
  final String description;
  final double latitude;
  final double longitude;
  final DateTime createdAt;
  final String authorName;
  final int upvotes;
  final int downvotes;

  /// True for the labelled demo dataset — always disclosed in the UI.
  final bool isSample;
  final bool isMine;

  /// Simple, honest verification: three net community confirmations.
  bool get isVerified => (upvotes - downvotes) >= 3;

  bool isExpired(DateTime now) => now.difference(createdAt) > category.ttl;

  CommunityReport copyWith({int? upvotes, int? downvotes}) => CommunityReport(
        id: id,
        category: category,
        description: description,
        latitude: latitude,
        longitude: longitude,
        createdAt: createdAt,
        authorName: authorName,
        upvotes: upvotes ?? this.upvotes,
        downvotes: downvotes ?? this.downvotes,
        isSample: isSample,
        isMine: isMine,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'category': category.name,
        'description': description,
        'latitude': latitude,
        'longitude': longitude,
        'createdAt': createdAt.toIso8601String(),
        'authorName': authorName,
        'upvotes': upvotes,
        'downvotes': downvotes,
        'isSample': isSample,
        'isMine': isMine,
      };

  factory CommunityReport.fromJson(Map<String, dynamic> json) =>
      CommunityReport(
        id: json['id'] as String,
        category: ReportCategory.values.byName(json['category'] as String),
        description: json['description'] as String,
        latitude: (json['latitude'] as num).toDouble(),
        longitude: (json['longitude'] as num).toDouble(),
        createdAt: DateTime.parse(json['createdAt'] as String),
        authorName: json['authorName'] as String,
        upvotes: json['upvotes'] as int? ?? 0,
        downvotes: json['downvotes'] as int? ?? 0,
        isSample: json['isSample'] as bool? ?? false,
        isMine: json['isMine'] as bool? ?? false,
      );
}
