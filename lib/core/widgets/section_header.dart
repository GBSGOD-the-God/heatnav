import 'package:flutter/material.dart';

import '../i18n/app_localizations.dart';

/// Consistent section title with optional trailing action, used across every
/// scrolling screen. Titles are translated here so every call site is
/// localized automatically.
class SectionHeader extends StatelessWidget {
  const SectionHeader(
    this.title, {
    super.key,
    this.actionLabel,
    this.onAction,
  });

  final String title;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 24, 4, 12),
      child: Row(
        children: [
          Expanded(
            child: Text(context.tr(title),
                style: Theme.of(context).textTheme.titleMedium),
          ),
          if (actionLabel != null)
            TextButton(
                onPressed: onAction, child: Text(context.tr(actionLabel!))),
        ],
      ),
    );
  }
}
