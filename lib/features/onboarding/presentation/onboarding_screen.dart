import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/app_constants.dart';
import '../../../core/domain/place.dart';
import '../../../core/domain/profile/user_profile.dart';
import '../../../core/widgets/choice_chip_group.dart';
import '../../profile/presentation/profile_controller.dart';

/// Five-step onboarding: story → location → about you → health (optional) →
/// home & cooling. Target: under 90 seconds, everything editable later.
class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final _pageController = PageController();
  int _step = 0;
  static const _stepCount = 5;

  // Collected answers.
  final _nameController = TextEditingController();
  Place? _city;
  AgeGroup? _ageGroup;
  Occupation? _occupation;
  OutdoorHours? _outdoorHours;
  TransportMode? _transport;
  Set<HealthCondition> _health = {};
  HomeType? _homeType;
  CoolingType? _cooling;
  PowerCutFrequency? _powerCuts;

  @override
  void dispose() {
    _pageController.dispose();
    _nameController.dispose();
    super.dispose();
  }

  bool get _canContinue => switch (_step) {
        0 => true,
        1 => _city != null,
        2 => _ageGroup != null &&
            _occupation != null &&
            _outdoorHours != null &&
            _transport != null,
        3 => true, // Health is always optional.
        _ => _homeType != null && _cooling != null && _powerCuts != null,
      };

  void _next() {
    if (_step < _stepCount - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 350),
        curve: Curves.easeOutCubic,
      );
    } else {
      _finish();
    }
  }

  void _back() {
    if (_step > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 350),
        curve: Curves.easeOutCubic,
      );
    }
  }

  Future<void> _finish() async {
    final city = _city!;
    final profile = UserProfile(
      name: _nameController.text.trim(),
      ageGroup: _ageGroup!,
      occupation: _occupation!,
      outdoorHours: _outdoorHours!,
      transport: _transport!,
      healthConditions: _health,
      homeType: _homeType!,
      cooling: _cooling!,
      powerCuts: _powerCuts!,
      home: Place(
        label: 'Home',
        latitude: city.latitude,
        longitude: city.longitude,
        city: city.city,
      ),
    );
    // Saving flips the router redirect — navigation to Home is automatic.
    await ref.read(profileControllerProvider.notifier).save(profile);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
              child: Row(
                children: [
                  AnimatedOpacity(
                    duration: const Duration(milliseconds: 200),
                    opacity: _step > 0 ? 1 : 0,
                    child: IconButton(
                      onPressed: _step > 0 ? _back : null,
                      icon: const Icon(Icons.arrow_back),
                    ),
                  ),
                  const Spacer(),
                  for (var i = 0; i < _stepCount; i++)
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 250),
                      margin: const EdgeInsets.symmetric(horizontal: 3),
                      height: 6,
                      width: i == _step ? 24 : 6,
                      decoration: BoxDecoration(
                        color: i <= _step
                            ? theme.colorScheme.primary
                            : theme.colorScheme.surfaceContainerHighest,
                        borderRadius: BorderRadius.circular(3),
                      ),
                    ),
                  const Spacer(),
                  const SizedBox(width: 48),
                ],
              ),
            ),
            Expanded(
              child: PageView(
                controller: _pageController,
                physics: const NeverScrollableScrollPhysics(),
                onPageChanged: (page) => setState(() => _step = page),
                children: [
                  const _WelcomeStep(),
                  _LocationStep(
                    selected: _city,
                    onSelected: (c) => setState(() => _city = c),
                  ),
                  _AboutYouStep(
                    nameController: _nameController,
                    ageGroup: _ageGroup,
                    occupation: _occupation,
                    outdoorHours: _outdoorHours,
                    transport: _transport,
                    onChanged: (age, occ, hours, transport) => setState(() {
                      _ageGroup = age;
                      _occupation = occ;
                      _outdoorHours = hours;
                      _transport = transport;
                    }),
                  ),
                  _HealthStep(
                    selected: _health,
                    onChanged: (set) => setState(() => _health = set),
                  ),
                  _HomeStep(
                    homeType: _homeType,
                    cooling: _cooling,
                    powerCuts: _powerCuts,
                    onChanged: (home, cooling, power) => setState(() {
                      _homeType = home;
                      _cooling = cooling;
                      _powerCuts = power;
                    }),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(20),
              child: SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _canContinue ? _next : null,
                  child: Text(switch (_step) {
                    0 => 'Get started',
                    3 => _health.isEmpty ? 'Skip for now' : 'Continue',
                    4 => 'Build my heat profile',
                    _ => 'Continue',
                  }),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StepScaffold extends StatelessWidget {
  const _StepScaffold({
    required this.title,
    required this.subtitle,
    required this.children,
  });

  final String title;
  final String subtitle;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return ListView(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 8),
      children: [
        Text(title, style: theme.textTheme.headlineMedium)
            .animate()
            .fadeIn(duration: 350.ms)
            .slideY(begin: 0.1, curve: Curves.easeOutCubic),
        const SizedBox(height: 8),
        Text(
          subtitle,
          style: theme.textTheme.bodyLarge?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ).animate().fadeIn(delay: 100.ms, duration: 350.ms),
        const SizedBox(height: 24),
        ...children,
      ],
    );
  }
}

class _WelcomeStep extends StatelessWidget {
  const _WelcomeStep();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return _StepScaffold(
      title: 'Heat is the deadliest\nweather there is.',
      subtitle:
          'Heatwaves kill more people than floods, cyclones and lightning '
          'combined — and the same afternoon is safe for one person and '
          'dangerous for another.',
      children: [
        _WelcomePoint(
          icon: Icons.thermostat,
          title: 'Weather apps report conditions',
          body: '"It\'s 43°C" tells everyone the same thing.',
          delay: 200,
        ),
        _WelcomePoint(
          icon: Icons.event_available,
          title: '${AppConstants.appName} evaluates your plans',
          body: '"Is cricket at 4 PM safe for me?" — that\'s the question '
              'that keeps you safe.',
          delay: 320,
        ),
        _WelcomePoint(
          icon: Icons.psychology_alt_outlined,
          title: 'Every answer is explainable',
          body: 'No black boxes, no invented percentages. Tap "Why this '
              'rating?" on anything we tell you.',
          delay: 440,
        ),
        const SizedBox(height: 16),
        Text(
          'A few quick questions build your personal heat profile. '
          'Health answers are optional and never leave this device.',
          style: theme.textTheme.bodySmall?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ).animate().fadeIn(delay: 560.ms),
      ],
    );
  }
}

class _WelcomePoint extends StatelessWidget {
  const _WelcomePoint({
    required this.icon,
    required this.title,
    required this.body,
    required this.delay,
  });

  final IconData icon;
  final String title;
  final String body;
  final int delay;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: theme.colorScheme.primaryContainer,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(icon, color: theme.colorScheme.onPrimaryContainer),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: theme.textTheme.titleSmall),
                const SizedBox(height: 2),
                Text(body, style: theme.textTheme.bodyMedium),
              ],
            ),
          ),
        ],
      ),
    ).animate().fadeIn(delay: delay.ms, duration: 400.ms).slideX(begin: 0.05);
  }
}

class _LocationStep extends StatelessWidget {
  const _LocationStep({required this.selected, required this.onSelected});

  final Place? selected;
  final ValueChanged<Place> onSelected;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return _StepScaffold(
      title: 'Where do you live?',
      subtitle: 'Forecasts, community reports and routes are built around '
          'your home city.',
      children: [
        for (final city in PilotCities.all)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: _SelectableTile(
              selected: city == selected,
              leading: Icons.location_city,
              title: city.label,
              onTap: () => onSelected(city),
            ),
          ),
        const SizedBox(height: 8),
        Text(
          'GPS detection and exact-address pinning arrive with the map '
          'release; the pilot launches city-by-city.',
          style: theme.textTheme.bodySmall?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }
}

class _SelectableTile extends StatelessWidget {
  const _SelectableTile({
    required this.selected,
    required this.leading,
    required this.title,
    required this.onTap,
  });

  final bool selected;
  final IconData leading;
  final String title;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      decoration: BoxDecoration(
        color: selected
            ? theme.colorScheme.primaryContainer
            : theme.colorScheme.surfaceContainer,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: selected ? theme.colorScheme.primary : Colors.transparent,
          width: 1.5,
        ),
      ),
      child: ListTile(
        onTap: onTap,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        leading: Icon(leading),
        title: Text(title),
        trailing: selected
            ? Icon(Icons.check_circle, color: theme.colorScheme.primary)
            : null,
      ),
    );
  }
}

class _AboutYouStep extends StatelessWidget {
  const _AboutYouStep({
    required this.nameController,
    required this.ageGroup,
    required this.occupation,
    required this.outdoorHours,
    required this.transport,
    required this.onChanged,
  });

  final TextEditingController nameController;
  final AgeGroup? ageGroup;
  final Occupation? occupation;
  final OutdoorHours? outdoorHours;
  final TransportMode? transport;
  final void Function(AgeGroup?, Occupation?, OutdoorHours?, TransportMode?)
      onChanged;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    Widget label(String text) => Padding(
          padding: const EdgeInsets.only(top: 20, bottom: 10),
          child: Text(text, style: theme.textTheme.titleSmall),
        );

    return _StepScaffold(
      title: 'About you',
      subtitle: 'The same heat affects a delivery rider and an office worker '
          'completely differently.',
      children: [
        TextField(
          controller: nameController,
          textCapitalization: TextCapitalization.words,
          decoration: const InputDecoration(
            labelText: 'Your name (optional)',
            prefixIcon: Icon(Icons.person_outline),
          ),
        ),
        label('Age group'),
        ChoiceChipGroup(
          options: AgeGroup.values,
          labelOf: (a) => a.label,
          selected: ageGroup,
          onSelected: (a) => onChanged(a, occupation, outdoorHours, transport),
        ),
        label('Occupation'),
        ChoiceChipGroup(
          options: Occupation.values,
          labelOf: (o) => o.label,
          selected: occupation,
          onSelected: (o) => onChanged(ageGroup, o, outdoorHours, transport),
        ),
        label('Hours outdoors on a typical day'),
        ChoiceChipGroup(
          options: OutdoorHours.values,
          labelOf: (h) => h.label,
          selected: outdoorHours,
          onSelected: (h) => onChanged(ageGroup, occupation, h, transport),
        ),
        label('How do you usually get around?'),
        ChoiceChipGroup(
          options: TransportMode.values,
          labelOf: (t) => t.label,
          selected: transport,
          onSelected: (t) => onChanged(ageGroup, occupation, outdoorHours, t),
        ),
      ],
    );
  }
}

class _HealthStep extends StatelessWidget {
  const _HealthStep({required this.selected, required this.onChanged});

  final Set<HealthCondition> selected;
  final ValueChanged<Set<HealthCondition>> onChanged;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return _StepScaffold(
      title: 'Health factors',
      subtitle: 'Optional — but they matter. Some conditions and their '
          'medications genuinely change how heat affects you.',
      children: [
        MultiChoiceChipGroup(
          options: HealthCondition.values,
          labelOf: (c) => c.label,
          selected: selected,
          onChanged: onChanged,
        ),
        const SizedBox(height: 20),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: theme.colorScheme.surfaceContainer,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Row(
            children: [
              Icon(Icons.lock_outline, color: theme.colorScheme.primary),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Stored only on this device. Never uploaded, never shared.',
                  style: theme.textTheme.bodySmall,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _HomeStep extends StatelessWidget {
  const _HomeStep({
    required this.homeType,
    required this.cooling,
    required this.powerCuts,
    required this.onChanged,
  });

  final HomeType? homeType;
  final CoolingType? cooling;
  final PowerCutFrequency? powerCuts;
  final void Function(HomeType?, CoolingType?, PowerCutFrequency?) onChanged;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    Widget label(String text) => Padding(
          padding: const EdgeInsets.only(top: 20, bottom: 10),
          child: Text(text, style: theme.textTheme.titleSmall),
        );

    return _StepScaffold(
      title: 'Your home',
      subtitle: 'Night-time recovery decides how much heat you can take the '
          'next day. A tin roof with power cuts is a different life from an '
          'air-conditioned flat.',
      children: [
        label('Home type'),
        ChoiceChipGroup(
          options: HomeType.values,
          labelOf: (h) => h.label,
          selected: homeType,
          onSelected: (h) => onChanged(h, cooling, powerCuts),
        ),
        label('Cooling available'),
        ChoiceChipGroup(
          options: CoolingType.values,
          labelOf: (c) => c.label,
          selected: cooling,
          onSelected: (c) => onChanged(homeType, c, powerCuts),
        ),
        label('Power cuts in your area'),
        ChoiceChipGroup(
          options: PowerCutFrequency.values,
          labelOf: (p) => p.label,
          selected: powerCuts,
          onSelected: (p) => onChanged(homeType, cooling, p),
        ),
      ],
    );
  }
}
