/**
 * ReportPage — Post-interview dashboard.
 * Displays overall scores, detailed question feedback, proctoring timeline with strike warnings,
 * and personalized AI-generated roadmap.
 */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { reportAPI } from '../services/api';
import ScoreCircle from '../components/ScoreCircle';

export default function ReportPage() {
  const { sessionId } = useParams();
  const [report, setReport] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [isLoadingReport, setIsLoadingReport] = useState(true);
  const [isLoadingRoadmap, setIsLoadingRoadmap] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch report
  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await reportAPI.get(sessionId);
        setReport(response.data);
      } catch (err) {
        console.error('Failed to fetch report:', err);
      } finally {
        setIsLoadingReport(false);
      }
    };

    fetchReport();
  }, [sessionId]);

  // Generate roadmap
  const handleGenerateRoadmap = async () => {
    setIsLoadingRoadmap(true);
    try {
      const response = await reportAPI.generateRoadmap(sessionId);
      setRoadmap(response.data);
    } catch (err) {
      console.error('Failed to generate roadmap:', err);
    } finally {
      setIsLoadingRoadmap(false);
    }
  };

  if (isLoadingReport) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center text-center p-6">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h3 className="text-lg font-bold text-stone-900">Generating report...</h3>
        <p className="text-xs text-stone-500 mt-1">AI is calculating your final evaluation summary.</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center text-center p-6">
        <h2 className="text-2xl font-bold text-stone-900">Session Report Not Found</h2>
        <p className="text-sm text-stone-500 mt-2">We could not retrieve this mock session report.</p>
        <Link
          to="/"
          className="mt-6 inline-flex px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-colors cursor-pointer"
        >
          Go Home
        </Link>
      </div>
    );
  }

  const { profile, questions, proctoring_logs, strikes, is_flagged } = report;
  const scorePercentage = report.score_percentage || 0;
  const totalQuestions = questions?.length || 0;
  const answeredQuestions = questions?.filter((q) => q.answer)?.length || 0;

  const difficultyColors = {
    easy: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    medium: 'bg-amber-50 text-amber-700 border-amber-100',
    hard: 'bg-rose-50 text-rose-700 border-rose-100',
  };

  const scoreColorClass = (score) => {
    if (score >= 7.5) return 'text-emerald-600';
    if (score >= 5) return 'text-amber-600';
    return 'text-rose-600';
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 pt-20 pb-20 px-4 sm:px-6" id="report-page">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Block */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
            Interview <span className="text-indigo-600">Evaluation Report</span>
          </h1>
          <p className="text-stone-500 text-sm sm:text-base font-medium">
            {profile?.role_display} &bull; {profile?.experience_display} level
          </p>
        </div>

        {/* Proctoring Flag Notice Banner */}
        {is_flagged && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 sm:p-5 rounded-2xl border border-rose-250 bg-rose-50/50 text-rose-800 text-sm flex items-start gap-3.5 shadow-sm"
          >
            <span className="text-rose-600 mt-0.5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </span>
            <div>
              <h5 className="font-bold text-rose-900 text-base">Session Flagged for Review</h5>
              <p className="mt-1 text-rose-700 leading-relaxed">
                This mock interview exceeded the standard threshold of proctoring warnings. 
                A total of <strong>{strikes} strike violations</strong> were recorded, indicating tab shifts or presence disruptions.
              </p>
            </div>
          </motion.div>
        )}

        {/* Statistical Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center">
            <ScoreCircle score={scorePercentage} maxScore={100} label="Overall Score" />
          </div>

          <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center">
            <div className="text-4xl font-black text-stone-850">{answeredQuestions} / {totalQuestions}</div>
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mt-2">Questions Answered</div>
            <div className="text-xs text-stone-500 mt-1 max-w-[150px] leading-snug">
              Total completed question response loops
            </div>
          </div>

          <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center">
            <div className={`text-4xl font-black ${proctoring_logs?.length > 2 ? 'text-rose-600' : 'text-stone-850'}`}>
              {proctoring_logs?.length || 0}
            </div>
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mt-2">Proctor Warnings</div>
            <div className="text-xs text-stone-500 mt-1 max-w-[150px] leading-snug">
              {strikes} strikes recorded out of 3 allowed
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-200 gap-1.5 pb-px">
          {[
            { id: 'overview', label: 'Question Breakdown' },
            { id: 'proctoring', label: 'Proctoring Logs' },
            { id: 'roadmap', label: 'Study Roadmap' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'roadmap' && !roadmap) handleGenerateRoadmap();
              }}
              id={`tab-${tab.id}`}
              className={`px-4 py-2.5 font-semibold text-sm transition-all border-b-2 cursor-pointer ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="space-y-6">
          {/* Questions & Feedback Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {questions?.map((q, idx) => (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className="bg-white border border-stone-200 p-6 rounded-2xl shadow-sm space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                        Question {idx + 1}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        difficultyColors[q.difficulty?.toLowerCase()] || difficultyColors.medium
                      }`}>
                        {q.difficulty}
                      </span>
                      {q.category && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-50 border border-stone-250 text-stone-600">
                          {q.category}
                        </span>
                      )}
                    </div>
                    {q.answer && (
                      <span className={`text-lg font-black ${scoreColorClass(q.answer.score)}`}>
                        {q.answer.score} / 10
                      </span>
                    )}
                  </div>

                  <p className="text-stone-900 font-semibold leading-relaxed">
                    {q.text}
                  </p>

                  {q.answer ? (
                    <div className="space-y-4 pt-1">
                      <div className="bg-stone-50/50 p-4 rounded-xl border border-stone-150 text-stone-600 text-xs italic leading-relaxed">
                        &ldquo;{q.answer.transcript}&rdquo;
                      </div>
                      <p className="text-sm text-stone-700 leading-relaxed">
                        {q.answer.feedback}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        {q.answer.strengths?.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                              Key Strengths
                            </span>
                            <ul className="text-xs text-stone-600 space-y-1 pl-4 list-disc">
                              {q.answer.strengths.map((str, i) => <li key={i}>{str}</li>)}
                            </ul>
                          </div>
                        )}
                        {q.answer.improvements?.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                              Improvements Needed
                            </span>
                            <ul className="text-xs text-stone-600 space-y-1 pl-4 list-disc">
                              {q.answer.improvements.map((imp, i) => <li key={i}>{imp}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-stone-400 italic">No response transcript was submitted.</p>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {/* Proctoring Timeline Tab */}
          {activeTab === 'proctoring' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {proctoring_logs?.length === 0 ? (
                <div className="bg-white border border-stone-200 p-10 rounded-2xl text-center flex flex-col items-center">
                  <h4 className="font-bold text-stone-900">Flawless Session Integrity</h4>
                  <p className="text-xs text-stone-500 mt-1">No violations or tracking interruptions were reported.</p>
                </div>
              ) : (
                <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-sm space-y-4">
                  <h4 className="font-bold text-stone-900">Recorded Incident Log</h4>
                  <div className="divide-y divide-stone-100">
                    {proctoring_logs.map((log, idx) => (
                      <div key={log.id || idx} className="py-3 flex items-start gap-4 text-xs">
                        <span className="font-mono text-stone-400 min-w-[50px] mt-0.5 select-none">
                          {Math.floor(log.timestamp_seconds / 60)}:{String(Math.floor(log.timestamp_seconds % 60)).padStart(2, '0')}
                        </span>
                        <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span className="text-stone-700 leading-relaxed">
                            {log.description}
                          </span>
                          <span className={`self-start sm:self-center px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                            log.is_strike 
                              ? 'bg-rose-50 border border-rose-100 text-rose-700 text-[9px]'
                              : 'bg-stone-50 border border-stone-200 text-stone-500 text-[9px]'
                          }`}>
                            {log.is_strike ? 'Strike violation' : 'Standard flag'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* AI Roadmap Tab */}
          {activeTab === 'roadmap' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {isLoadingRoadmap ? (
                <div className="bg-white border border-stone-200 p-12 rounded-2xl text-center flex flex-col items-center">
                  <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-stone-600 font-medium">AI is generating a customized 3-topic study guide based on your scores...</p>
                </div>
              ) : roadmap ? (
                <div className="space-y-6">
                  {/* Summary Header */}
                  <div className="bg-indigo-50/50 border border-indigo-100 p-6 rounded-2xl shadow-sm">
                    <h3 className="font-bold text-stone-900 text-lg">{roadmap.title || 'Personalized Study Plan'}</h3>
                    <p className="text-sm text-stone-600 mt-2 leading-relaxed">{roadmap.summary}</p>
                  </div>

                  {/* Topics List */}
                  <div className="space-y-4">
                    {roadmap.topics?.map((topic, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white border border-stone-200 p-6 rounded-2xl shadow-sm flex items-start gap-4"
                      >
                        <div className="w-8 h-8 rounded-full bg-stone-100 border border-stone-250 flex items-center justify-center text-sm font-bold text-stone-700 select-none mt-0.5">
                          {idx + 1}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-bold text-stone-900 text-sm sm:text-base">{topic.name}</h4>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                              topic.priority === 'high' 
                                ? 'bg-rose-50 text-rose-700 border-rose-100'
                                : topic.priority === 'medium'
                                  ? 'bg-amber-50 text-amber-700 border-amber-100'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            }`}>
                              {topic.priority} Priority
                            </span>
                            {topic.estimated_hours && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                                ~{topic.estimated_hours} Hours
                              </span>
                            )}
                          </div>
                          
                          <p className="text-sm text-stone-600 leading-relaxed">{topic.description}</p>
                          
                          {topic.resources?.length > 0 && (
                            <div className="pt-2">
                              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                                Recommended Study Materials
                              </span>
                              <ul className="text-xs text-indigo-600 hover:text-indigo-700 font-medium space-y-0.5 pl-4 list-disc">
                                {topic.resources.map((res, ridx) => <li key={ridx}>{res}</li>)}
                              </ul>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-stone-200 p-10 rounded-2xl text-center flex flex-col items-center">
                  <h4 className="font-bold text-stone-900">Customized Study Roadmap</h4>
                  <p className="text-xs text-stone-500 mt-1 max-w-sm">
                    Generate a personalized 3-topic study roadmap with estimated schedules and free reference resources.
                  </p>
                  <button
                    onClick={handleGenerateRoadmap}
                    className="mt-6 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-colors cursor-pointer shadow-sm"
                  >
                    Generate with Gemini AI
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Action Controls */}
        <div className="pt-8 flex justify-center gap-4 border-t border-stone-200">
          <Link
            to="/setup"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-colors cursor-pointer shadow-sm"
          >
            Practice Again
          </Link>
          <Link
            to="/"
            className="px-6 py-3 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 rounded-xl font-semibold text-sm transition-colors cursor-pointer shadow-sm"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
