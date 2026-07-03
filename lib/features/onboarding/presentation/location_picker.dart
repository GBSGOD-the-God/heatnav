import 'dart:async';

import 'package:flutter/material.dart';

import '../../../core/domain/place.dart';
import '../../../core/services/location_service.dart';
import '../data/place_search_api.dart';

/// Shared "where are you" picker: GPS current-location, worldwide search by
/// name, or a quick-pick shortcut list. Used inline during onboarding and as
/// a bottom sheet when editing home location later from Profile.
class LocationPickerBody extends StatefulWidget {
  const LocationPickerBody({
    super.key,
    required this.onSelected,
    this.selected,
  });

  final ValueChanged<Place> onSelected;
  final Place? selected;

  @override
  State<LocationPickerBody> createState() => _LocationPickerBodyState();
}

class _LocationPickerBodyState extends State<LocationPickerBody> {
  final _searchController = TextEditingController();
  Timer? _debounce;
  List<Place> _results = const [];
  bool _searching = false;
  bool _locating = false;
  String? _locationError;

  @override
  void dispose() {
    _debounce?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  void _onQueryChanged(String query) {
    _debounce?.cancel();
    if (query.trim().length < 3) {
      setState(() => _results = const []);
      return;
    }
    _debounce = Timer(const Duration(milliseconds: 450), () async {
      setState(() => _searching = true);
      final results = await PlaceSearchApi.search(query);
      if (!mounted) return;
      setState(() {
        _results = results;
        _searching = false;
      });
    });
  }

  Future<void> _useCurrentLocation() async {
    setState(() {
      _locating = true;
      _locationError = null;
    });
    try {
      final place = await LocationService.getCurrentPlace();
      if (!mounted) return;
      widget.onSelected(place);
    } on LocationException catch (e) {
      setState(() => _locationError = e.message);
    } catch (_) {
      setState(() => _locationError = 'Couldn\'t get your location. Try search instead.');
    } finally {
      if (mounted) setState(() => _locating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          width: double.infinity,
          child: FilledButton.icon(
            onPressed: _locating ? null : _useCurrentLocation,
            icon: _locating
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.my_location),
            label: Text(_locating ? 'Locating…' : 'Use my current location'),
          ),
        ),
        if (_locationError != null)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(
              _locationError!,
              style: theme.textTheme.bodySmall
                  ?.copyWith(color: theme.colorScheme.error),
            ),
          ),
        const SizedBox(height: 14),
        TextField(
          controller: _searchController,
          onChanged: _onQueryChanged,
          decoration: InputDecoration(
            hintText: 'Search any city, area or address',
            prefixIcon: const Icon(Icons.search),
            suffixIcon: _searching
                ? const Padding(
                    padding: EdgeInsets.all(14),
                    child: SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  )
                : null,
          ),
        ),
        if (_results.isNotEmpty) ...[
          const SizedBox(height: 8),
          ConstrainedBox(
            constraints: const BoxConstraints(maxHeight: 260),
            child: ListView.builder(
              shrinkWrap: true,
              itemCount: _results.length,
              itemBuilder: (context, i) {
                final place = _results[i];
                return ListTile(
                  leading: const Icon(Icons.place_outlined),
                  title: Text(place.label),
                  onTap: () => widget.onSelected(place),
                );
              },
            ),
          ),
        ],
        const SizedBox(height: 20),
        Text('Quick picks', style: theme.textTheme.titleSmall),
        const SizedBox(height: 10),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final city in PilotCities.all)
              ChoiceChip(
                label: Text(city.label),
                selected: widget.selected?.city == city.city,
                onSelected: (_) => widget.onSelected(city),
              ),
          ],
        ),
      ],
    );
  }
}

/// Presents [LocationPickerBody] as a modal sheet and resolves with the
/// chosen [Place], or null if dismissed without a choice.
Future<Place?> showLocationPicker(BuildContext context, {Place? initial}) {
  return showModalBottomSheet<Place>(
    context: context,
    isScrollControlled: true,
    builder: (context) => Padding(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 8,
        bottom: 24 + MediaQuery.of(context).viewInsets.bottom,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Set location', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 16),
            LocationPickerBody(
              selected: initial,
              onSelected: (place) => Navigator.pop(context, place),
            ),
          ],
        ),
      ),
    ),
  );
}
