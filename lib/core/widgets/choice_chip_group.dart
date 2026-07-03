import 'package:flutter/material.dart';

/// Wrap of selectable chips over any option list. Single- and multi-select
/// variants share the chip styling; used by onboarding and profile editing.
class ChoiceChipGroup<T> extends StatelessWidget {
  const ChoiceChipGroup({
    super.key,
    required this.options,
    required this.labelOf,
    this.selected,
    this.onSelected,
  });

  final List<T> options;
  final String Function(T) labelOf;
  final T? selected;
  final ValueChanged<T>? onSelected;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        for (final option in options)
          ChoiceChip(
            label: Text(labelOf(option)),
            selected: option == selected,
            onSelected: (_) => onSelected?.call(option),
          ),
      ],
    );
  }
}

class MultiChoiceChipGroup<T> extends StatelessWidget {
  const MultiChoiceChipGroup({
    super.key,
    required this.options,
    required this.labelOf,
    required this.selected,
    required this.onChanged,
  });

  final List<T> options;
  final String Function(T) labelOf;
  final Set<T> selected;
  final ValueChanged<Set<T>> onChanged;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        for (final option in options)
          FilterChip(
            label: Text(labelOf(option)),
            selected: selected.contains(option),
            onSelected: (isSelected) {
              final next = Set<T>.of(selected);
              isSelected ? next.add(option) : next.remove(option);
              onChanged(next);
            },
          ),
      ],
    );
  }
}
