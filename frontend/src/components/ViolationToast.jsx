/**
 * ViolationToast — Animated toast notifications for proctoring violations.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ViolationToast({ violations }) {
  const [visibleToasts, setVisibleToasts] = useState([]);

  useEffect(() => {
    if (violations.length === 0) return;

    const latest = violations[violations.length - 1];
    const toastId = Date.now();

    setVisibleToasts((prev) => [...prev, { ...latest, id: toastId }]);

    // Auto-dismiss after 4 seconds
    const timer = setTimeout(() => {
      setVisibleToasts((prev) => prev.filter((t) => t.id !== toastId));
    }, 4000);

    return () => clearTimeout(timer);
  }, [violations.length, violations]);


  const getTitle = (type) => {
    switch (type) {
      case 'no_face': return 'No Face Detected';
      case 'multiple_faces': return 'Multiple Faces';
      case 'looking_away': return 'Looking Away';
      case 'tab_switch': return 'Tab Switch';
      default: return 'Violation Warning';
    }
  };

  const isStrikeViolation = (type) => {
    return ['no_face', 'multiple_faces', 'tab_switch'].includes(type);
  };

  return (
    <div 
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none" 
      id="violation-toasts"
    >
      <AnimatePresence>
        {visibleToasts.slice(-3).map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
            className={`pointer-events-auto p-4 rounded-xl border shadow-lg flex gap-3 bg-white ${
              isStrikeViolation(toast.type) 
                ? 'border-rose-200 bg-rose-50/30' 
                : 'border-amber-200 bg-amber-50/30'
            }`}
          >
            <div className="text-rose-600 flex items-center justify-center select-none">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-stone-900 text-sm">
                  {getTitle(toast.type)}
                </h4>
                {isStrikeViolation(toast.type) && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700">
                    Strike Limit Warning
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
                {toast.message}
              </p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
