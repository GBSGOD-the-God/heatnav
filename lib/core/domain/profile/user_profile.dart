import '../place.dart';

/// The user's heat profile — the single most important input to
/// personalization. Lives in core because nearly every feature reads it.
/// Stored locally only; health data never leaves the device in this build.
class UserProfile {
  const UserProfile({
    required this.name,
    required this.ageGroup,
    required this.occupation,
    required this.outdoorHours,
    required this.transport,
    required this.healthConditions,
    required this.homeType,
    required this.cooling,
    required this.powerCuts,
    required this.home,
    this.savedPlaces = const [],
  });

  final String name;
  final AgeGroup ageGroup;
  final Occupation occupation;
  final OutdoorHours outdoorHours;
  final TransportMode transport;
  final Set<HealthCondition> healthConditions;
  final HomeType homeType;
  final CoolingType cooling;
  final PowerCutFrequency powerCuts;
  final Place home;
  final List<Place> savedPlaces;

  UserProfile copyWith({
    String? name,
    AgeGroup? ageGroup,
    Occupation? occupation,
    OutdoorHours? outdoorHours,
    TransportMode? transport,
    Set<HealthCondition>? healthConditions,
    HomeType? homeType,
    CoolingType? cooling,
    PowerCutFrequency? powerCuts,
    Place? home,
    List<Place>? savedPlaces,
  }) {
    return UserProfile(
      name: name ?? this.name,
      ageGroup: ageGroup ?? this.ageGroup,
      occupation: occupation ?? this.occupation,
      outdoorHours: outdoorHours ?? this.outdoorHours,
      transport: transport ?? this.transport,
      healthConditions: healthConditions ?? this.healthConditions,
      homeType: homeType ?? this.homeType,
      cooling: cooling ?? this.cooling,
      powerCuts: powerCuts ?? this.powerCuts,
      home: home ?? this.home,
      savedPlaces: savedPlaces ?? this.savedPlaces,
    );
  }

  Map<String, dynamic> toJson() => {
        'name': name,
        'ageGroup': ageGroup.name,
        'occupation': occupation.name,
        'outdoorHours': outdoorHours.name,
        'transport': transport.name,
        'healthConditions': healthConditions.map((c) => c.name).toList(),
        'homeType': homeType.name,
        'cooling': cooling.name,
        'powerCuts': powerCuts.name,
        'home': home.toJson(),
        'savedPlaces': savedPlaces.map((p) => p.toJson()).toList(),
      };

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      name: json['name'] as String? ?? '',
      ageGroup: AgeGroup.values.byName(json['ageGroup'] as String),
      occupation: Occupation.values.byName(json['occupation'] as String),
      outdoorHours: OutdoorHours.values.byName(json['outdoorHours'] as String),
      transport: TransportMode.values.byName(json['transport'] as String),
      healthConditions: ((json['healthConditions'] as List?) ?? const [])
          .map((n) => HealthCondition.values.byName(n as String))
          .toSet(),
      homeType: HomeType.values.byName(json['homeType'] as String),
      cooling: CoolingType.values.byName(json['cooling'] as String),
      powerCuts: PowerCutFrequency.values.byName(json['powerCuts'] as String),
      home: Place.fromJson(json['home'] as Map<String, dynamic>),
      savedPlaces: ((json['savedPlaces'] as List?) ?? const [])
          .map((p) => Place.fromJson(p as Map<String, dynamic>))
          .toList(),
    );
  }
}

enum AgeGroup {
  child('Under 13'),
  teen('13–17'),
  adult('18–39'),
  middleAged('40–64'),
  senior('65+');

  const AgeGroup(this.label);
  final String label;
}

enum Occupation {
  student('Student', isOutdoor: false),
  officeWorker('Office worker', isOutdoor: false),
  deliveryRider('Delivery rider', isOutdoor: true),
  constructionWorker('Construction worker', isOutdoor: true),
  farmer('Farmer', isOutdoor: true),
  trafficPolice('Traffic police', isOutdoor: true),
  streetVendor('Street vendor', isOutdoor: true),
  homemaker('Homemaker', isOutdoor: false),
  retired('Retired', isOutdoor: false),
  other('Other', isOutdoor: false);

  const Occupation(this.label, {required this.isOutdoor});
  final String label;
  final bool isOutdoor;
}

enum OutdoorHours {
  underOne('Under 1 hour'),
  oneToThree('1–3 hours'),
  threeToSix('3–6 hours'),
  moreThanSix('6+ hours');

  const OutdoorHours(this.label);
  final String label;
}

enum TransportMode {
  walking('Walking'),
  bicycle('Bicycle'),
  motorbike('Motorbike'),
  car('Car'),
  publicTransport('Public transport');

  const TransportMode(this.label);
  final String label;
}

enum HealthCondition {
  asthma('Asthma'),
  heartDisease('Heart disease'),
  diabetes('Diabetes'),
  hypertension('Hypertension'),
  kidneyDisease('Kidney disease'),
  pregnancy('Pregnancy');

  const HealthCondition(this.label);
  final String label;
}

enum HomeType {
  apartment('Apartment'),
  independentHouse('Independent house'),
  tinRoof('Tin-roof house'),
  concreteRoof('Concrete-roof house');

  const HomeType(this.label);
  final String label;
}

enum CoolingType {
  none('No cooling'),
  fan('Fan'),
  cooler('Air cooler'),
  ac('Air conditioner');

  const CoolingType(this.label);
  final String label;
}

enum PowerCutFrequency {
  frequent('Frequent'),
  occasional('Occasional'),
  rare('Rare / never');

  const PowerCutFrequency(this.label);
  final String label;
}
