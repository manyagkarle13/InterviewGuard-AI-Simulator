/**
 * ScoreCircle — Animated SVG circular progress indicator.
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function ScoreCircle({ score, maxScore = 100, size = 180, strokeWidth = 10, label = 'Score' }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 200);
    return () => clearTimeout(timer);
  }, [score]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = maxScore > 0 ? (animatedScore / maxScore) * 100 : 0;
  const strokeDashoffset = circumference - (circumference * percentage) / 100;

  // Color classes for Tailwind
  const getColor = () => {
    if (percentage >= 70) return '#16a34a'; // success
    if (percentage >= 40) return '#d97706'; // warning
    return '#dc2626'; // danger
  };

  const getTextColorClass = () => {
    if (percentage >= 70) return 'text-green-600';
    if (percentage >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }} id="score-circle">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-border-light)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.5s ease',
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className={`text-3xl font-bold tracking-tight ${getTextColorClass()}`}>
          {Math.round(percentage)}%
        </span>
        <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider mt-0.5">
          {label}
        </span>
      </div>
    </div>
  );
}
