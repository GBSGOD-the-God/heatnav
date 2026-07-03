/// A named location. Used for home, saved places and plan destinations.
class Place {
  const Place({
    required this.label,
    required this.latitude,
    required this.longitude,
    this.city = '',
  });

  final String label;
  final double latitude;
  final double longitude;
  final String city;

  Map<String, dynamic> toJson() => {
        'label': label,
        'latitude': latitude,
        'longitude': longitude,
        'city': city,
      };

  factory Place.fromJson(Map<String, dynamic> json) => Place(
        label: json['label'] as String,
        latitude: (json['latitude'] as num).toDouble(),
        longitude: (json['longitude'] as num).toDouble(),
        city: json['city'] as String? ?? '',
      );
}

/// Curated pilot cities for manual location selection — keyless and
/// offline-friendly. GPS lookup layers on top of this (see blueprint §1.4).
abstract final class PilotCities {
  static const List<Place> all = [
    Place(label: 'Nagpur', latitude: 21.1458, longitude: 79.0882, city: 'Nagpur'),
    Place(label: 'Delhi', latitude: 28.6139, longitude: 77.2090, city: 'Delhi'),
    Place(label: 'Ahmedabad', latitude: 23.0225, longitude: 72.5714, city: 'Ahmedabad'),
    Place(label: 'Chennai', latitude: 13.0827, longitude: 80.2707, city: 'Chennai'),
    Place(label: 'Hyderabad', latitude: 17.3850, longitude: 78.4867, city: 'Hyderabad'),
    Place(label: 'Mumbai', latitude: 19.0760, longitude: 72.8777, city: 'Mumbai'),
    Place(label: 'Kolkata', latitude: 22.5726, longitude: 88.3639, city: 'Kolkata'),
    Place(label: 'Jaipur', latitude: 26.9124, longitude: 75.7873, city: 'Jaipur'),
    Place(label: 'Lucknow', latitude: 26.8467, longitude: 80.9462, city: 'Lucknow'),
    Place(label: 'Bengaluru', latitude: 12.9716, longitude: 77.5946, city: 'Bengaluru'),
  ];
}
