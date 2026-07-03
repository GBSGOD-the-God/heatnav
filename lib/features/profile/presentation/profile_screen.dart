import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/app_constants.dart';
import '../../../core/domain/profile/user_profile.dart';
import '../../../core/i18n/app_language.dart';
import '../../../core/i18n/app_localizations.dart';
import '../../../core/i18n/locale_controller.dart';
import '../../../core/widgets/choice_chip_group.dart';
import '../../../core/widgets/section_header.dart';
import '../../onboarding/presentation/location_picker.dart';
import 'profile_controller.dart';
import 'settings_controller.dart';

/// Profile + settings: everything from onboarding, editable in place.
class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final profile = ref.watch(profileControllerProvider);
    final settings = ref.watch(settingsControllerProvider);
    if (profile == null) return const SizedBox.shrink();

    final notifier = ref.read(profileControllerProvider.notifier);
    final settingsNotifier = ref.read(settingsControllerProvider.notifier);

    return Scaffold(
      appBar: AppBar(title: Text(context.tr('Profile'))),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
        children: [
          Card(
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: theme.colorScheme.primaryContainer,
                child: Text(
                  profile.name.isEmpty
                      ? '☀'
                      : profile.name.characters.first.toUpperCase(),
                  style: theme.textTheme.titleMedium,
                ),
              ),
              title: Text(profile.name.isEmpty ? 'HeatNav user' : profile.name),
              subtitle: Text(
                '${context.tr(profile.occupation.label)} · ${profile.home.city}',
              ),
            ),
          ),
          const SectionHeader('Your heat profile'),
          _EditableRow(
            icon: Icons.location_on_outlined,
            label: 'Home location',
            value: profile.home.label,
            onTap: () async {
              final place = await showLocationPicker(
                context,
                initial: profile.home,
              );
              if (place != null) {
                notifier.update((p) => p.copyWith(home: place));
              }
            },
          ),
          _EditableRow(
            icon: Icons.cake_outlined,
            label: 'Age group',
            value: profile.ageGroup.label,
            onTap: () => _pick<AgeGroup>(
              context,
              title: 'Age group',
              options: AgeGroup.values,
              labelOf: (v) => v.label,
              selected: profile.ageGroup,
              onSelected: (v) => notifier.update((p) => p.copyWith(ageGroup: v)),
            ),
          ),
          _EditableRow(
            icon: Icons.work_outline,
            label: 'Occupation',
            value: profile.occupation.label,
            onTap: () => _pick<Occupation>(
              context,
              title: 'Occupation',
              options: Occupation.values,
              labelOf: (v) => v.label,
              selected: profile.occupation,
              onSelected: (v) =>
                  notifier.update((p) => p.copyWith(occupation: v)),
            ),
          ),
          _EditableRow(
            icon: Icons.timer_outlined,
            label: 'Hours outdoors daily',
            value: profile.outdoorHours.label,
            onTap: () => _pick<OutdoorHours>(
              context,
              title: 'Hours outdoors',
              options: OutdoorHours.values,
              labelOf: (v) => v.label,
              selected: profile.outdoorHours,
              onSelected: (v) =>
                  notifier.update((p) => p.copyWith(outdoorHours: v)),
            ),
          ),
          _EditableRow(
            icon: Icons.directions_bus_outlined,
            label: 'Usual transport',
            value: profile.transport.label,
            onTap: () => _pick<TransportMode>(
              context,
              title: 'Transport',
              options: TransportMode.values,
              labelOf: (v) => v.label,
              selected: profile.transport,
              onSelected: (v) =>
                  notifier.update((p) => p.copyWith(transport: v)),
            ),
          ),
          _EditableRow(
            icon: Icons.favorite_outline,
            label: 'Health factors',
            value: profile.healthConditions.isEmpty
                ? 'None listed'
                : profile.healthConditions.map((c) => c.label).join(', '),
            onTap: () => _pickHealth(context, ref),
          ),
          _EditableRow(
            icon: Icons.home_outlined,
            label: 'Home & cooling',
            value:
                '${profile.homeType.label} · ${profile.cooling.label} · '
                '${profile.powerCuts.label.toLowerCase()} power cuts',
            onTap: () => _pick<CoolingType>(
              context,
              title: 'Cooling at home',
              options: CoolingType.values,
              labelOf: (v) => v.label,
              selected: profile.cooling,
              onSelected: (v) => notifier.update((p) => p.copyWith(cooling: v)),
            ),
          ),
          const SectionHeader('Language'),
          Card(
            child: Column(
              children: [
                for (final language in AppLanguage.values)
                  RadioListTile<AppLanguage>(
                    value: language,
                    groupValue: ref.watch(localeControllerProvider),
                    onChanged: (v) {
                      if (v != null) {
                        ref.read(localeControllerProvider.notifier).set(v);
                      }
                    },
                    title: Text(language.nativeName),
                    subtitle: language.englishName != language.nativeName
                        ? Text(language.englishName)
                        : null,
                  ),
              ],
            ),
          ),
          const SectionHeader('Appearance'),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: SegmentedButton<ThemeMode>(
                segments: [
                  ButtonSegment(
                    value: ThemeMode.light,
                    icon: const Icon(Icons.light_mode_outlined),
                    label: Text(context.tr('Light')),
                  ),
                  ButtonSegment(
                    value: ThemeMode.system,
                    icon: const Icon(Icons.brightness_auto_outlined),
                    label: Text(context.tr('Auto')),
                  ),
                  ButtonSegment(
                    value: ThemeMode.dark,
                    icon: const Icon(Icons.dark_mode_outlined),
                    label: Text(context.tr('Dark')),
                  ),
                ],
                selected: {settings.themeMode},
                onSelectionChanged: (selection) => settingsNotifier
                    .update((s) => s.copyWith(themeMode: selection.first)),
              ),
            ),
          ),
          const SectionHeader('Smart notifications'),
          Card(
            child: Column(
              children: [
                SwitchListTile(
                  value: settings.notifyRiskChanges,
                  onChanged: (v) => settingsNotifier
                      .update((s) => s.copyWith(notifyRiskChanges: v)),
                  title: const Text('Risk level changes'),
                  subtitle: const Text('Only when today\'s band shifts'),
                ),
                SwitchListTile(
                  value: settings.notifyPlanWarnings,
                  onChanged: (v) => settingsNotifier
                      .update((s) => s.copyWith(notifyPlanWarnings: v)),
                  title: const Text('Plan warnings'),
                  subtitle:
                      const Text('If an upcoming plan becomes dangerous'),
                ),
                SwitchListTile(
                  value: settings.notifyCommunityDanger,
                  onChanged: (v) => settingsNotifier
                      .update((s) => s.copyWith(notifyCommunityDanger: v)),
                  title: const Text('Nearby danger reports'),
                  subtitle: const Text('Verified hazards near your places'),
                ),
              ],
            ),
          ),
          const SectionHeader('About'),
          Card(
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.science_outlined),
                  title: const Text('The science we use'),
                  subtitle: const Text(
                    'NWS heat index · WHO UV bands · EPA AQI · WHO/CDC '
                    'heat-health guidance. If we can\'t cite it, we don\'t '
                    'compute it.',
                  ),
                ),
                ListTile(
                  leading: const Icon(Icons.lock_outline),
                  title: const Text('Privacy'),
                  subtitle: const Text(
                    'Your profile and health answers are stored only on this '
                    'device.',
                  ),
                ),
                ListTile(
                  leading: const Icon(Icons.info_outline),
                  title: Text(AppConstants.appName),
                  subtitle: Text(AppConstants.tagline),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          OutlinedButton.icon(
            style: OutlinedButton.styleFrom(
              foregroundColor: theme.colorScheme.error,
            ),
            onPressed: () => _confirmReset(context, ref),
            icon: const Icon(Icons.restart_alt),
            label: const Text('Reset profile & start over'),
          ),
        ],
      ),
    );
  }

  static Future<void> _pick<T>(
    BuildContext context, {
    required String title,
    required List<T> options,
    required String Function(T) labelOf,
    required T selected,
    required ValueChanged<T> onSelected,
  }) {
    return showModalBottomSheet<void>(
      context: context,
      builder: (context) => Padding(
        padding: const EdgeInsets.fromLTRB(24, 0, 24, 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 16),
            ChoiceChipGroup<T>(
              options: options,
              labelOf: labelOf,
              selected: selected,
              onSelected: (v) {
                onSelected(v);
                Navigator.pop(context);
              },
            ),
          ],
        ),
      ),
    );
  }

  static Future<void> _pickHealth(BuildContext context, WidgetRef ref) {
    return showModalBottomSheet<void>(
      context: context,
      builder: (context) {
        return Consumer(
          builder: (context, ref, _) {
            final selected = ref.watch(
                  profileControllerProvider.select((p) => p?.healthConditions),
                ) ??
                const <HealthCondition>{};
            return Padding(
              padding: const EdgeInsets.fromLTRB(24, 0, 24, 32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Health factors',
                      style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 16),
                  MultiChoiceChipGroup<HealthCondition>(
                    options: HealthCondition.values,
                    labelOf: (c) => c.label,
                    selected: selected,
                    onChanged: (set) => ref
                        .read(profileControllerProvider.notifier)
                        .update((p) => p.copyWith(healthConditions: set)),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  static Future<void> _confirmReset(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Reset everything?'),
        content: const Text(
          'Your profile, plans and check-ins on this device will be erased.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Reset'),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      await ref.read(profileControllerProvider.notifier).reset();
    }
  }
}

class _EditableRow extends StatelessWidget {
  const _EditableRow({
    required this.icon,
    required this.label,
    required this.value,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final String value;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        tileColor: theme.colorScheme.surfaceContainer,
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        leading: Icon(icon),
        title: Text(context.tr(label), style: theme.textTheme.labelMedium),
        subtitle: Text(context.tr(value), style: theme.textTheme.bodyMedium),
        trailing: const Icon(Icons.edit_outlined, size: 18),
        onTap: onTap,
      ),
    );
  }
}
