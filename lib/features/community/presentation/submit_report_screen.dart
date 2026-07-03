import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';

import '../../map/presentation/map_tiles.dart';
import '../../profile/presentation/profile_controller.dart';
import '../data/report_model.dart';
import 'community_providers.dart';

/// Structured report submission: category → pin the spot → describe.
class SubmitReportScreen extends ConsumerStatefulWidget {
  const SubmitReportScreen({super.key});

  @override
  ConsumerState<SubmitReportScreen> createState() =>
      _SubmitReportScreenState();
}

class _SubmitReportScreenState extends ConsumerState<SubmitReportScreen> {
  ReportCategory? _category;
  LatLng? _pin;
  final _descriptionController = TextEditingController();
  bool _submitting = false;

  @override
  void dispose() {
    _descriptionController.dispose();
    super.dispose();
  }

  bool get _canSubmit =>
      _category != null &&
      _pin != null &&
      _descriptionController.text.trim().length >= 10 &&
      !_submitting;

  Future<void> _submit() async {
    setState(() => _submitting = true);
    await ref.read(communityReportsProvider.notifier).submit(
          category: _category!,
          description: _descriptionController.text.trim(),
          latitude: _pin!.latitude,
          longitude: _pin!.longitude,
        );
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Report published. It will expire automatically.'),
        ),
      );
      context.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final home = ref.watch(profileControllerProvider)!.home;
    final center = LatLng(home.latitude, home.longitude);

    return Scaffold(
      appBar: AppBar(title: const Text('Report something')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text('What did you find?', style: theme.textTheme.titleSmall),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final category in ReportCategory.values)
                ChoiceChip(
                  avatar: Icon(category.icon, size: 16),
                  label: Text(category.label),
                  selected: _category == category,
                  onSelected: (_) => setState(() => _category = category),
                ),
            ],
          ),
          const SizedBox(height: 20),
          Text('Tap the exact spot', style: theme.textTheme.titleSmall),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: SizedBox(
              height: 220,
              child: FlutterMap(
                options: MapOptions(
                  initialCenter: center,
                  initialZoom: 13,
                  onTap: (tapPosition, point) =>
                      setState(() => _pin = point),
                ),
                children: [
                  osmTileLayer(),
                  if (_pin != null)
                    MarkerLayer(markers: [
                      Marker(
                        point: _pin!,
                        width: 40,
                        height: 40,
                        child: Icon(
                          Icons.location_pin,
                          size: 40,
                          color: theme.colorScheme.error,
                        ),
                      ),
                    ]),
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _pin == null
                ? 'No spot pinned yet.'
                : 'Pinned at ${_pin!.latitude.toStringAsFixed(4)}, '
                    '${_pin!.longitude.toStringAsFixed(4)}',
            style: theme.textTheme.labelSmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 20),
          Text('Describe it (min 10 characters)',
              style: theme.textTheme.titleSmall),
          const SizedBox(height: 10),
          TextField(
            controller: _descriptionController,
            maxLines: 3,
            maxLength: 200,
            textCapitalization: TextCapitalization.sentences,
            onChanged: (_) => setState(() {}),
            decoration: const InputDecoration(
              hintText: 'e.g. Water cooler outside the temple, open till 8 PM',
            ),
          ),
          if (_category != null)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                'A "${_category!.label}" report stays visible for '
                '${_category!.ttl.inHours >= 48 ? '${_category!.ttl.inDays} days' : '${_category!.ttl.inHours} hours'}, '
                'then expires automatically.',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: _canSubmit ? _submit : null,
            icon: const Icon(Icons.publish),
            label: const Text('Publish report'),
          ),
        ],
      ),
    );
  }
}
