import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/domain/place.dart';
import '../../../core/domain/profile/user_profile.dart';
import '../../../core/i18n/app_localizations.dart';
import '../../../core/router/app_router.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/choice_chip_group.dart';
import '../../profile/presentation/profile_controller.dart';
import '../data/plan_model.dart';
import 'plan_providers.dart';

/// Three-step plan creation: what → when → review. Chips over typing, so a
/// plan takes ~20 seconds to enter.
class PlanWizardScreen extends ConsumerStatefulWidget {
  const PlanWizardScreen({super.key});

  @override
  ConsumerState<PlanWizardScreen> createState() => _PlanWizardScreenState();
}

class _PlanWizardScreenState extends ConsumerState<PlanWizardScreen> {
  int _step = 0;

  final _titleController = TextEditingController();
  final _notesController = TextEditingController();
  ActivityType? _activity;
  bool? _isOutdoorOverride;
  Place? _destination;
  DateTime _date = DateTime.now();
  TimeOfDay _leaveTime = const TimeOfDay(hour: 9, minute: 0);
  TimeOfDay _returnTime = const TimeOfDay(hour: 11, minute: 0);
  TransportMode? _transport;

  @override
  void initState() {
    super.initState();
    _transport = ref.read(profileControllerProvider)?.transport;
  }

  @override
  void dispose() {
    _titleController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  bool get _canContinue => switch (_step) {
        0 => _activity != null && _destination != null,
        1 => _transport != null && _returnMinutes > _leaveMinutes,
        _ => true,
      };

  int get _leaveMinutes => _leaveTime.hour * 60 + _leaveTime.minute;
  int get _returnMinutes => _returnTime.hour * 60 + _returnTime.minute;

  DateTime get _leaveAt => DateTime(
      _date.year, _date.month, _date.day, _leaveTime.hour, _leaveTime.minute);
  DateTime get _returnAt => DateTime(_date.year, _date.month, _date.day,
      _returnTime.hour, _returnTime.minute);

  Future<void> _save() async {
    final activity = _activity!;
    final plan = Plan(
      id: 'plan-${DateTime.now().microsecondsSinceEpoch}',
      title: _titleController.text.trim().isEmpty
          ? activity.label
          : _titleController.text.trim(),
      activity: activity,
      destination: _destination!,
      leaveAt: _leaveAt,
      returnAt: _returnAt,
      transport: _transport!,
      isOutdoor: _isOutdoorOverride ?? activity.isOutdoor,
      notes: _notesController.text.trim(),
    );
    await ref.read(plansProvider.notifier).add(plan);
    if (mounted) context.pushReplacement(AppRoutes.planDetail(plan.id));
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text(context.tr('Plan my day')),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => context.pop(),
        ),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                for (var i = 0; i < 3; i++)
                  Expanded(
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 250),
                      margin: const EdgeInsets.symmetric(horizontal: 3),
                      height: 4,
                      decoration: BoxDecoration(
                        color: i <= _step
                            ? theme.colorScheme.primary
                            : theme.colorScheme.surfaceContainerHighest,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          Expanded(
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 250),
              child: switch (_step) {
                0 => _buildWhatStep(theme),
                1 => _buildWhenStep(theme),
                _ => _buildReviewStep(theme),
              },
            ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  if (_step > 0)
                    OutlinedButton(
                      onPressed: () => setState(() => _step--),
                      child: Text(context.tr('Back')),
                    ),
                  if (_step > 0) const SizedBox(width: 12),
                  Expanded(
                    child: FilledButton(
                      onPressed: _canContinue
                          ? () =>
                              _step < 2 ? setState(() => _step++) : _save()
                          : null,
                      child: Text(context.tr(_step < 2 ? 'Continue' : 'Analyze my plan')),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _label(ThemeData theme, String text) => Padding(
        padding: const EdgeInsets.only(top: 20, bottom: 10),
        child: Text(context.tr(text), style: theme.textTheme.titleSmall),
      );

  Widget _buildWhatStep(ThemeData theme) {
    final profile = ref.watch(profileControllerProvider);
    final places = [
      if (profile != null) profile.home,
      ...?profile?.savedPlaces,
    ];
    return ListView(
      key: const ValueKey(0),
      padding: const EdgeInsets.all(20),
      children: [
        Text(context.tr('What are you doing?'), style: theme.textTheme.headlineMedium),
        _label(theme, 'Activity'),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final a in ActivityType.values)
              ChoiceChip(
                avatar: Icon(a.icon, size: 18),
                label: Text(context.tr(a.label)),
                selected: _activity == a,
                onSelected: (_) => setState(() {
                  _activity = a;
                  _isOutdoorOverride = null;
                }),
              ),
          ],
        ),
        _label(theme, 'Where?'),
        ChoiceChipGroup(
          options: places,
          labelOf: (p) => p.label == 'Home' ? 'Around ${p.city}' : p.label,
          selected: _destination,
          onSelected: (p) => setState(() => _destination = p),
        ),
        _label(theme, 'Name it (optional)'),
        TextField(
          controller: _titleController,
          textCapitalization: TextCapitalization.sentences,
          decoration: InputDecoration(
            hintText: _activity?.label ?? 'e.g. Cricket practice',
          ),
        ),
        if (_activity != null) ...[
          _label(theme, 'Mostly indoors or outdoors?'),
          SegmentedButton<bool>(
            segments: const [
              ButtonSegment(
                value: true,
                label: Text('Outdoors'),
                icon: Icon(Icons.wb_sunny_outlined),
              ),
              ButtonSegment(
                value: false,
                label: Text('Indoors'),
                icon: Icon(Icons.home_outlined),
              ),
            ],
            selected: {_isOutdoorOverride ?? _activity!.isOutdoor},
            onSelectionChanged: (selection) =>
                setState(() => _isOutdoorOverride = selection.first),
          ),
        ],
      ],
    );
  }

  Widget _buildWhenStep(ThemeData theme) {
    final today = DateTime.now();
    final days = [
      for (var i = 0; i < 7; i++)
        DateTime(today.year, today.month, today.day + i),
    ];
    return ListView(
      key: const ValueKey(1),
      padding: const EdgeInsets.all(20),
      children: [
        Text(context.tr('When?'), style: theme.textTheme.headlineMedium),
        _label(theme, 'Day'),
        SizedBox(
          height: 76,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: days.length,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (context, i) {
              final day = days[i];
              final selected = day.day == _date.day && day.month == _date.month;
              return GestureDetector(
                onTap: () => setState(() => _date = day),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: 64,
                  decoration: BoxDecoration(
                    color: selected
                        ? theme.colorScheme.primaryContainer
                        : theme.colorScheme.surfaceContainer,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: selected
                          ? theme.colorScheme.primary
                          : Colors.transparent,
                    ),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        i == 0 ? 'Today' : Formatters.dayShort(day).split(' ')[0],
                        style: theme.textTheme.labelSmall,
                      ),
                      Text('${day.day}', style: theme.textTheme.titleLarge),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        _label(theme, 'Leaving at'),
        _TimeField(
          time: _leaveTime,
          onChanged: (t) => setState(() => _leaveTime = t),
        ),
        _label(theme, 'Back by'),
        _TimeField(
          time: _returnTime,
          onChanged: (t) => setState(() => _returnTime = t),
        ),
        if (_returnMinutes <= _leaveMinutes)
          Padding(
            padding: const EdgeInsets.only(top: 12),
            child: Text(
              'Return time must be after the leaving time.',
              style: theme.textTheme.bodySmall
                  ?.copyWith(color: theme.colorScheme.error),
            ),
          ),
        _label(theme, 'Getting there by'),
        ChoiceChipGroup(
          options: TransportMode.values,
          labelOf: (t) => t.label,
          selected: _transport,
          onSelected: (t) => setState(() => _transport = t),
        ),
        _label(theme, 'Notes (optional)'),
        TextField(
          controller: _notesController,
          maxLines: 2,
          textCapitalization: TextCapitalization.sentences,
          decoration:
              const InputDecoration(hintText: 'e.g. carrying kit bag, match day'),
        ),
      ],
    );
  }

  Widget _buildReviewStep(ThemeData theme) {
    final activity = _activity!;
    final rows = <(IconData, String)>[
      (activity.icon,
          _titleController.text.trim().isEmpty
              ? activity.label
              : _titleController.text.trim()),
      (Icons.place_outlined, _destination!.label),
      (Icons.today, Formatters.dateLong(_date)),
      (
        Icons.schedule,
        '${Formatters.time(_leaveAt)} → ${Formatters.time(_returnAt)} '
            '(${Formatters.duration(_returnAt.difference(_leaveAt).inMinutes)})'
      ),
      (Icons.directions, _transport!.label),
      (
        (_isOutdoorOverride ?? activity.isOutdoor)
            ? Icons.wb_sunny_outlined
            : Icons.home_outlined,
        (_isOutdoorOverride ?? activity.isOutdoor)
            ? 'Mostly outdoors · ${activity.exertion.label} effort'
            : 'Mostly indoors · ${activity.exertion.label} effort'
      ),
    ];
    return ListView(
      key: const ValueKey(2),
      padding: const EdgeInsets.all(20),
      children: [
        Text(context.tr('Ready to analyze'), style: theme.textTheme.headlineMedium),
        const SizedBox(height: 8),
        Text(
          'HeatNav will check every hour of this window against the forecast, '
          'your profile and nearby community reports.',
          style: theme.textTheme.bodyMedium
              ?.copyWith(color: theme.colorScheme.onSurfaceVariant),
        ),
        const SizedBox(height: 20),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(8),
            child: Column(
              children: [
                for (final (icon, text) in rows)
                  ListTile(
                    dense: true,
                    leading: Icon(icon),
                    title: Text(text),
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _TimeField extends StatelessWidget {
  const _TimeField({required this.time, required this.onChanged});

  final TimeOfDay time;
  final ValueChanged<TimeOfDay> onChanged;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: () async {
        final picked = await showTimePicker(context: context, initialTime: time);
        if (picked != null) onChanged(picked);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        decoration: BoxDecoration(
          color: theme.colorScheme.surfaceContainerHigh,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            const Icon(Icons.access_time),
            const SizedBox(width: 12),
            Text(time.format(context), style: theme.textTheme.titleMedium),
          ],
        ),
      ),
    );
  }
}
