/**
 * TabSwitchModal — A blocking fullscreen modal overlay when a tab switch is detected.
 */
import { motion, AnimatePresence } from 'framer-motion';

export default function TabSwitchModal({ isOpen, onAcknowledge }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="w-full max-w-md rounded-2xl border border-rose-100 bg-white p-6 shadow-2xl text-center"
          >
            <div className="mx-auto w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 mb-4 animate-bounce">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h3 className="text-lg font-bold text-stone-900 mb-2">
              Tab Switch Warning
            </h3>
            
            <p className="text-sm text-stone-600 mb-6 leading-relaxed">
              We detected that you switched tabs or minimised the browser. 
              Navigating away from the interview screen is strictly prohibited and counts as a <strong className="text-rose-600">strike</strong>.
            </p>
            
            <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 text-xs text-stone-500 text-left mb-6 leading-relaxed">
              <span className="font-semibold text-stone-700 block mb-1">Rules Reminder:</span>
              • Stay in full-screen/focus at all times.<br />
              • 3 strikes will automatically flag your session for review.<br />
              • Your webcam and gaze tracking remain active.
            </div>

            <button
              onClick={onAcknowledge}
              className="w-full py-2.5 px-4 rounded-xl font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition-colors shadow-sm cursor-pointer"
            >
              I Understand, Resume Interview
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
