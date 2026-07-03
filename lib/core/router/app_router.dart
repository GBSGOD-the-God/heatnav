import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/calendar/presentation/calendar_screen.dart';
import '../../features/community/presentation/community_screen.dart';
import '../../features/community/presentation/submit_report_screen.dart';
import '../../features/emergency/presentation/emergency_screen.dart';
import '../../features/history/presentation/history_screen.dart';
import '../../features/home/presentation/home_screen.dart';
import '../../features/map/presentation/map_screen.dart';
import '../../features/onboarding/presentation/onboarding_screen.dart';
import '../../features/plan/presentation/plan_detail_screen.dart';
import '../../features/plan/presentation/plan_list_screen.dart';
import '../../features/plan/presentation/plan_wizard_screen.dart';
import '../../features/profile/presentation/profile_controller.dart';
import '../../features/profile/presentation/profile_screen.dart';
import '../../features/recovery/presentation/recovery_screen.dart';
import '../../features/routes/presentation/heat_routes_screen.dart';
import 'app_shell.dart';

abstract final class AppRoutes {
  static const onboarding = '/onboarding';
  static const home = '/home';
  static const plans = '/plans';
  static const planNew = '/plans/new';
  static const map = '/map';
  static const community = '/community';
  static const communityNew = '/community/new';
  static const profile = '/profile';
  static const heatRoutes = '/heat-routes';
  static const calendar = '/calendar';
  static const history = '/history';
  static const recovery = '/recovery';
  static const emergency = '/emergency';

  static String planDetail(String id) => '/plans/$id';
}

final appRouterProvider = Provider<GoRouter>((ref) {
  // Redirect decisions must react to onboarding completion.
  final hasProfile = ref.watch(
    profileControllerProvider.select((p) => p != null),
  );

  return GoRouter(
    initialLocation: AppRoutes.home,
    redirect: (context, state) {
      final onboarding = state.matchedLocation == AppRoutes.onboarding;
      if (!hasProfile && !onboarding) return AppRoutes.onboarding;
      if (hasProfile && onboarding) return AppRoutes.home;
      return null;
    },
    routes: [
      GoRoute(
        path: AppRoutes.onboarding,
        builder: (context, state) => const OnboardingScreen(),
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, shell) => AppShell(shell: shell),
        branches: [
          StatefulShellBranch(routes: [
            GoRoute(
              path: AppRoutes.home,
              builder: (context, state) => const HomeScreen(),
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: AppRoutes.plans,
              builder: (context, state) => const PlanListScreen(),
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: AppRoutes.map,
              builder: (context, state) => const MapScreen(),
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: AppRoutes.community,
              builder: (context, state) => const CommunityScreen(),
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: AppRoutes.profile,
              builder: (context, state) => const ProfileScreen(),
            ),
          ]),
        ],
      ),
      GoRoute(
        path: AppRoutes.planNew,
        parentNavigatorKey: null,
        builder: (context, state) => const PlanWizardScreen(),
      ),
      GoRoute(
        path: '/plans/:id',
        builder: (context, state) =>
            PlanDetailScreen(planId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: AppRoutes.communityNew,
        builder: (context, state) => const SubmitReportScreen(),
      ),
      GoRoute(
        path: AppRoutes.heatRoutes,
        builder: (context, state) => const HeatRoutesScreen(),
      ),
      GoRoute(
        path: AppRoutes.calendar,
        builder: (context, state) => const CalendarScreen(),
      ),
      GoRoute(
        path: AppRoutes.history,
        builder: (context, state) => const HistoryScreen(),
      ),
      GoRoute(
        path: AppRoutes.recovery,
        builder: (context, state) => const RecoveryScreen(),
      ),
      GoRoute(
        path: AppRoutes.emergency,
        pageBuilder: (context, state) => CustomTransitionPage(
          fullscreenDialog: true,
          child: const EmergencyScreen(),
          transitionsBuilder: (context, animation, secondary, child) =>
              FadeTransition(opacity: animation, child: child),
        ),
      ),
    ],
  );
});
