/**
 * StrikeIndicator — Displays visual indicators for the 3-strike proctoring system.
 */
import { motion } from 'framer-motion';

export default function StrikeIndicator({ strikes = 0, maxStrikes = 3 }) {
  return (
    <div className="flex flex-col items-center gap-1.5 p-3 px-4 rounded-xl border border-stone-200 bg-stone-50/50">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
        AI Proctoring Status
      </div>
      <div className="flex items-center gap-2">
        {Array.from({ length: maxStrikes }).map((_, idx) => {
          const isTriggered = idx < strikes;
          return (
            <div key={idx} className="relative w-6 h-6 flex items-center justify-center">
              {/* Pulse background for active strike */}
              {isTriggered && (
                <motion.span
                  initial={{ scale: 0.8, opacity: 0.5 }}
                  animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute inset-0 rounded-full bg-red-400"
                />
              )}
              {/* Inner indicator dot */}
              <motion.div
                animate={{
                  scale: isTriggered ? 1 : 0.8,
                  backgroundColor: isTriggered ? '#dc2626' : '#d6d3d1',
                }}
                className="w-3.5 h-3.5 rounded-full relative z-10"
                title={isTriggered ? `Strike ${idx + 1} logged` : `Strike slot ${idx + 1}`}
              />
            </div>
          );
        })}
      </div>
      <div className="text-xs font-semibold mt-0.5 text-stone-700">
        {strikes === 0 ? (
          <span className="text-emerald-600">All clear</span>
        ) : strikes >= maxStrikes ? (
          <span className="text-red-600 font-bold">Flagged (3/3 Strikes)</span>
        ) : (
          <span className="text-amber-600">{strikes} / {maxStrikes} Strikes</span>
        )}
      </div>
    </div>
  );
}
