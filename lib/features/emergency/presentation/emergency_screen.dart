import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/constants/app_constants.dart';
import '../../profile/presentation/profile_controller.dart';

/// Full-screen heat-emergency helper: recognise heat stroke, act, call.
/// Content follows WHO / Red Cross first-aid guidance.
class EmergencyScreen extends ConsumerWidget {
  const EmergencyScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final home = ref.watch(profileControllerProvider)?.home;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Emergency'),
        backgroundColor: theme.colorScheme.errorContainer,
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: theme.colorScheme.errorContainer,
              borderRadius: BorderRadius.circular(24),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Heat stroke is a medical emergency',
                  style: theme.textTheme.titleLarge?.copyWith(
                    color: theme.colorScheme.onErrorContainer,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Call for help if someone has: very hot dry or heavily '
                  'sweating skin · confusion or slurred speech · fainting · '
                  'seizure · body temperature that feels burning hot.',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onErrorContainer,
                  ),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    style: FilledButton.styleFrom(
                      backgroundColor: theme.colorScheme.error,
                      foregroundColor: theme.colorScheme.onError,
                      minimumSize: const Size(64, 56),
                    ),
                    onPressed: () => launchUrl(
                      Uri.parse('tel:${AppConstants.emergencyNumber}'),
                    ),
                    icon: const Icon(Icons.call),
                    label: Text(
                      'Call ambulance (${AppConstants.emergencyNumber})',
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          Text('While help arrives', style: theme.textTheme.titleMedium),
          const SizedBox(height: 10),
          const _Step(
            number: 1,
            text: 'Move the person to shade or the coolest room available.',
          ),
          const _Step(
            number: 2,
            text: 'Remove excess clothing. Cool aggressively: wet cloths or '
                'water on skin, fan them, ice packs to neck, armpits, groin.',
          ),
          const _Step(
            number: 3,
            text: 'If fully conscious, give small sips of water or ORS. '
                'Nothing by mouth if drowsy, confused or vomiting.',
          ),
          const _Step(
            number: 4,
            text: 'Do NOT give paracetamol/aspirin for heat stroke — it '
                'doesn\'t lower heat-stroke temperature and can add harm.',
          ),
          const _Step(
            number: 5,
            text: 'Stay with them. If unconscious, place on their side and '
                'watch breathing.',
          ),
          const SizedBox(height: 8),
          Text(
            'First-aid steps per WHO and Red Cross heat emergency guidance.',
            style: theme.textTheme.labelSmall?.copyWith(
              fontStyle: FontStyle.italic,
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 20),
          if (home != null)
            Card(
              child: ListTile(
                leading: const Icon(Icons.share_location),
                title: const Text('Share my location'),
                subtitle: const Text('Send coordinates via any messaging app'),
                onTap: () {
                  final uri = Uri.parse(
                    'sms:?body=Emergency - I need help. My location: '
                    'https://maps.google.com/?q=${home.latitude},${home.longitude}',
                  );
                  launchUrl(uri);
                },
              ),
            ),
        ],
      ),
    );
  }
}

class _Step extends StatelessWidget {
  const _Step({required this.number, required this.text});

  final int number;
  final String text;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 28,
            height: 28,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: theme.colorScheme.primaryContainer,
              shape: BoxShape.circle,
            ),
            child: Text('$number', style: theme.textTheme.labelLarge),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(top: 3),
              child: Text(text, style: theme.textTheme.bodyMedium),
            ),
          ),
        ],
      ),
    );
  }
}
