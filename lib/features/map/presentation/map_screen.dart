import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:latlong2/latlong.dart';

import '../../../core/utils/formatters.dart';
import '../../community/data/report_model.dart';
import '../../community/presentation/community_providers.dart';
import '../../profile/presentation/profile_controller.dart';
import 'map_tiles.dart';

/// Layered city map: hazards and resources from community intelligence,
/// filterable by kind. Every pin opens a detail sheet.
class MapScreen extends ConsumerStatefulWidget {
  const MapScreen({super.key});

  @override
  ConsumerState<MapScreen> createState() => _MapScreenState();
}

enum _MapFilter {
  all('All', Icons.layers_outlined),
  hazards('Hazards', Icons.warning_amber_outlined),
  water('Water', Icons.water_drop_outlined),
  cool('Cool spots', Icons.park_outlined);

  const _MapFilter(this.label, this.icon);
  final String label;
  final IconData icon;
}

class _MapScreenState extends ConsumerState<MapScreen> {
  _MapFilter _filter = _MapFilter.all;

  bool _matches(CommunityReport report) => switch (_filter) {
        _MapFilter.all => true,
        _MapFilter.hazards => report.category.isHazard,
        _MapFilter.water => report.category == ReportCategory.waterStation ||
            report.category == ReportCategory.brokenWaterSupply,
        _MapFilter.cool => report.category == ReportCategory.shade ||
            report.category == ReportCategory.coolingCentre,
      };

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final home = ref.watch(profileControllerProvider)!.home;
    final reports =
        ref.watch(communityReportsProvider).where(_matches).toList();

    return Scaffold(
      body: Stack(
        children: [
          FlutterMap(
            options: MapOptions(
              initialCenter: LatLng(home.latitude, home.longitude),
              initialZoom: 12.5,
            ),
            children: [
              osmTileLayer(),
              MarkerLayer(
                markers: [
                  Marker(
                    point: LatLng(home.latitude, home.longitude),
                    width: 44,
                    height: 44,
                    child: Container(
                      decoration: BoxDecoration(
                        color: theme.colorScheme.primaryContainer,
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: theme.colorScheme.primary,
                          width: 2,
                        ),
                      ),
                      child: Icon(
                        Icons.home,
                        size: 22,
                        color: theme.colorScheme.onPrimaryContainer,
                      ),
                    ),
                  ),
                  for (final report in reports)
                    Marker(
                      point: LatLng(report.latitude, report.longitude),
                      width: 40,
                      height: 40,
                      child: GestureDetector(
                        onTap: () => _showReportSheet(report),
                        child: Container(
                          decoration: BoxDecoration(
                            color: report.category.isHazard
                                ? theme.colorScheme.errorContainer
                                : theme.colorScheme.primaryContainer,
                            shape: BoxShape.circle,
                            boxShadow: const [
                              BoxShadow(blurRadius: 6, color: Colors.black26),
                            ],
                          ),
                          child: Icon(
                            report.category.icon,
                            size: 20,
                            color: report.category.isHazard
                                ? theme.colorScheme.onErrorContainer
                                : theme.colorScheme.onPrimaryContainer,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
              const SimpleAttributionWidget(
                source: Text('© OpenStreetMap contributors'),
              ),
            ],
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: SizedBox(
                height: 44,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  children: [
                    for (final filter in _MapFilter.values)
                      Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: FilterChip(
                          avatar: Icon(filter.icon, size: 16),
                          label: Text(filter.label),
                          selected: _filter == filter,
                          backgroundColor: theme.colorScheme.surface,
                          onSelected: (_) =>
                              setState(() => _filter = filter),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showReportSheet(CommunityReport report) {
    showModalBottomSheet<void>(
      context: context,
      builder: (context) {
        final theme = Theme.of(context);
        return Padding(
          padding: const EdgeInsets.fromLTRB(24, 0, 24, 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(report.category.icon,
                      color: report.category.isHazard
                          ? theme.colorScheme.error
                          : theme.colorScheme.primary),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(report.category.label,
                        style: theme.textTheme.titleLarge),
                  ),
                  if (report.isVerified)
                    Icon(Icons.verified, color: theme.colorScheme.primary),
                ],
              ),
              const SizedBox(height: 12),
              Text(report.description, style: theme.textTheme.bodyLarge),
              const SizedBox(height: 12),
              Text(
                '${report.authorName} · ${Formatters.relative(report.createdAt)}'
                '${report.isSample ? ' · sample data' : ''}',
                style: theme.textTheme.labelMedium?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
