import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/i18n/app_localizations.dart';
import '../../../core/router/app_router.dart';
import '../data/checkin_model.dart';

/// The check-in nobody expects: how do you feel *after* the heat?
class RecoveryScreen extends ConsumerStatefulWidget {
  const RecoveryScreen({super.key});

  @override
  ConsumerState<RecoveryScreen> createState() => _RecoveryScreenState();
}

class _RecoveryScreenState extends ConsumerState<RecoveryScreen> {
  RecoveryFeeling? _selected;
  bool _saved = false;

  Future<void> _save(RecoveryFeeling feeling) async {
    setState(() {
      _selected = feeling;
      _saved = true;
    });
    await ref.read(checkinsProvider.notifier).add(feeling);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: Text(context.tr('How do you feel?'))),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text(
            context.tr('Back from the heat?'),
            style: theme.textTheme.headlineMedium,
          ),
          const SizedBox(height: 8),
          Text(
            'A 5-second check-in. Heat illness often shows up *after* '
            'exposure — catching it early is the whole point.',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 24),
          for (final feeling in RecoveryFeeling.values)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: _FeelingTile(
                feeling: feeling,
                isSelected: _selected == feeling,
                enabled: !_saved,
                onTap: () => _save(feeling),
              ),
            ),
          if (_saved && _selected != null) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: _selected!.isWarning
                    ? theme.colorScheme.errorContainer.withValues(alpha: 0.6)
                    : theme.colorScheme.primaryContainer.withValues(alpha: 0.6),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        _selected!.isWarning
                            ? Icons.medical_information_outlined
                            : Icons.tips_and_updates_outlined,
                      ),
                      const SizedBox(width: 10),
                      Text(context.tr('What to do now'),
                          style: theme.textTheme.titleSmall),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(_selected!.advice, style: theme.textTheme.bodyMedium),
                  const SizedBox(height: 6),
                  Text(
                    'Based on WHO / Red Cross heat first-aid guidance.',
                    style: theme.textTheme.labelSmall?.copyWith(
                      fontStyle: FontStyle.italic,
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                  if (_selected!.isWarning) ...[
                    const SizedBox(height: 14),
                    FilledButton.icon(
                      style: FilledButton.styleFrom(
                        backgroundColor: theme.colorScheme.error,
                        foregroundColor: theme.colorScheme.onError,
                      ),
                      onPressed: () => context.push(AppRoutes.emergency),
                      icon: const Icon(Icons.emergency_outlined),
                      label: const Text('It\'s getting worse — emergency'),
                    ),
                  ],
                ],
              ),
            ).animate().fadeIn(duration: 350.ms).slideY(begin: 0.05),
          ],
        ],
      ),
    );
  }
}

class _FeelingTile extends StatelessWidget {
  const _FeelingTile({
    required this.feeling,
    required this.isSelected,
    required this.enabled,
    required this.onTap,
  });

  final RecoveryFeeling feeling;
  final bool isSelected;
  final bool enabled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return AnimatedOpacity(
      duration: const Duration(milliseconds: 250),
      opacity: !enabled && !isSelected ? 0.4 : 1,
      child: Container(
        decoration: BoxDecoration(
          color: isSelected
              ? theme.colorScheme.primaryContainer
              : theme.colorScheme.surfaceContainer,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color:
                isSelected ? theme.colorScheme.primary : Colors.transparent,
          ),
        ),
        child: ListTile(
          enabled: enabled || isSelected,
          onTap: enabled ? onTap : null,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
          leading: Icon(feeling.icon),
          title: Text(context.tr(feeling.label)),
          trailing: isSelected
              ? Icon(Icons.check_circle, color: theme.colorScheme.primary)
              : null,
        ),
      ),
    );
  }
}
