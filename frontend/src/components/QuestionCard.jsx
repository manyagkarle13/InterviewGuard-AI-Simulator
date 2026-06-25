/**
 * QuestionCard — Displays the current interview question with difficulty badge.
 */
import { motion } from 'framer-motion';

export default function QuestionCard({ question, questionNumber, totalQuestions }) {
  if (!question) return null;

  const difficultyColors = {
    easy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    hard: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const diffColor = difficultyColors[question.difficulty?.toLowerCase()] || difficultyColors.medium;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      id="question-card"
      className="p-6 rounded-2xl border border-stone-200 bg-white shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
          Question {questionNumber} of {totalQuestions}
        </span>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${diffColor}`}>
            {question.difficulty}
          </span>
          {question.category && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border border-stone-200 bg-stone-50 text-stone-600">
              {question.category}
            </span>
          )}
        </div>
      </div>
      <p className="text-lg md:text-xl font-medium text-stone-850 leading-relaxed">
        {question.text}
      </p>
    </motion.div>
  );
}
