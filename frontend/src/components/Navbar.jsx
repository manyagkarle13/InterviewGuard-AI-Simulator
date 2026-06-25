import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Navbar() {
  const location = useLocation();
  const isInterview = location.pathname.startsWith('/interview');

  const handleEndInterviewClick = () => {
    // Dispatch a custom event to notify the active InterviewRoom to save and close the session
    window.dispatchEvent(new CustomEvent('end-interview'));
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200"
    >
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-stone-900 hover:text-stone-700 transition-colors">
          <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm">P</span>
          InterviewGuard AI Simulator
        </Link>

        <div className="flex items-center gap-6 text-sm font-medium text-stone-500">
          {!isInterview && (
            <>
              <Link to="/" className="hover:text-stone-900 transition-colors">Home</Link>
              <Link to="/setup" className="hover:text-stone-900 transition-colors">Practice</Link>
            </>
          )}
          {isInterview && (
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-green-600 font-semibold text-xs sm:text-sm">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Live Session
              </span>
              <button
                onClick={handleEndInterviewClick}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 hover:text-rose-800 border border-rose-200 transition-colors cursor-pointer shadow-sm"
              >
                End Session
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
