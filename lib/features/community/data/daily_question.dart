import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/storage/local_store.dart';

/// One-tap daily micro-survey. One question per day, never more — this is
/// how the community layer earns its data without becoming a chore.
class DailyQuestion {
  const DailyQuestion(this.id, this.text, this.options);

  final String id;
  final String text;
  final List<String> options;

  static const _pool = [
    DailyQuestion('hotter', 'Was today hotter than expected?',
        ['Much hotter', 'About right', 'Cooler']),
    DailyQuestion('power', 'Did your neighbourhood lose power today?',
        ['Yes, hours', 'Briefly', 'No']),
    DailyQuestion('water', 'Could you find drinking water when out?',
        ['Easily', 'With difficulty', 'Not at all']),
    DailyQuestion('shade', 'Was your usual route shaded enough?',
        ['Mostly shaded', 'Partly', 'No shade']),
  ];

  /// Deterministic rotation so everyone in a city answers the same question
  /// on the same day — that's what makes the answers comparable.
  static DailyQuestion forDate(DateTime date) {
    final dayOfYear = date.difference(DateTime(date.year)).inDays;
    return _pool[dayOfYear % _pool.length];
  }
}

class DailyQuestionState {
  const DailyQuestionState({required this.question, this.answer});

  final DailyQuestion question;
  final String? answer;

  bool get isAnswered => answer != null;
}

class DailyQuestionController extends Notifier<DailyQuestionState> {
  static const _key = 'daily_question_answers';

  @override
  DailyQuestionState build() {
    final today = DateTime.now();
    final question = DailyQuestion.forDate(today);
    final answers = ref.watch(localStoreProvider).readObject(_key) ?? {};
    return DailyQuestionState(
      question: question,
      answer: answers[_dateKey(today)] as String?,
    );
  }

  Future<void> answer(String choice) async {
    final store = ref.read(localStoreProvider);
    final answers = store.readObject(_key) ?? <String, dynamic>{};
    answers[_dateKey(DateTime.now())] = choice;
    await store.writeObject(_key, answers);
    state = DailyQuestionState(question: state.question, answer: choice);
  }

  static String _dateKey(DateTime d) =>
      '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
}

final dailyQuestionProvider =
    NotifierProvider<DailyQuestionController, DailyQuestionState>(
  DailyQuestionController.new,
);
