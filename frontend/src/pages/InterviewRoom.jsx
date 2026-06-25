/**
 * InterviewRoom — Redesigned layout for the mock interview experience.
 * Stacks large video, question, and record input on the left column (col-span-8),
 * and stacks the AI Assistant and Proctoring Monitor on the right column (col-span-4)
 * to fit everything cleanly in a single screen viewport without vertical scrolling.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useInterview } from '../context/InterviewContext';
import { sessionAPI, questionAPI, answerAPI, proctoringAPI } from '../services/api';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import useSpeechSynthesis from '../hooks/useSpeechSynthesis';
import useCamera from '../hooks/useCamera';
import useProctoring from '../hooks/useProctoring';
import CameraFeed from '../components/CameraFeed';
import VoiceVisualizer from '../components/VoiceVisualizer';
import QuestionCard from '../components/QuestionCard';
import ViolationToast from '../components/ViolationToast';
import StrikeIndicator from '../components/StrikeIndicator';
import TabSwitchModal from '../components/TabSwitchModal';

export default function InterviewRoom() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const interview = useInterview();
  const [timer, setTimer] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [strikes, setStrikes] = useState(0);
  const [isFlagged, setIsFlagged] = useState(false);
  const [showTabSwitchModal, setShowTabSwitchModal] = useState(false);
  
  const timerRef = useRef(null);
  const sessionStartRef = useRef(Date.now());

  // Hooks
  const speech = useSpeechRecognition();
  const tts = useSpeechSynthesis();
  const camera = useCamera();

  // Proctoring violation handler
  const handleViolation = useCallback((violation) => {
    interview.addViolation(violation);
    
    if (violation.type === 'tab_switch') {
      setShowTabSwitchModal(true);
    }

    // Log to backend
    if (sessionId) {
      proctoringAPI.logViolation(sessionId, {
        violation_type: violation.type,
        description: violation.message,
        timestamp_seconds: (Date.now() - sessionStartRef.current) / 1000,
      })
      .then((res) => {
        if (res.data) {
          setStrikes(res.data.strikes || 0);
          setIsFlagged(res.data.is_flagged || false);
        }
      })
      .catch(() => {});
    }
  }, [sessionId, interview]);

  const proctoring = useProctoring(camera.videoRef, handleViolation);

  // End interview logic
  const endInterview = useCallback(async () => {
    try {
      speech.stopListening();
      tts.stop();
      if (timerRef.current) clearInterval(timerRef.current);
      await sessionAPI.complete(sessionId);
      navigate(`/report/${sessionId}`);
    } catch (err) {
      navigate(`/report/${sessionId}`);
    }
  }, [sessionId, navigate, speech, tts]);

  // Listen to custom Navbar 'end-interview' event
  useEffect(() => {
    const handleEndInterviewEvent = () => {
      endInterview();
    };
    window.addEventListener('end-interview', handleEndInterviewEvent);
    return () => {
      window.removeEventListener('end-interview', handleEndInterviewEvent);
    };
  }, [endInterview]);

  // Initialize session
  useEffect(() => {
    const init = async () => {
      try {
        let initialStrikes = 0;
        let initialFlagged = false;
        
        // Fetch session if not in context
        if (!interview.session) {
          const response = await sessionAPI.get(sessionId);
          interview.setSession(response.data);
          initialStrikes = response.data.strikes || 0;
          initialFlagged = response.data.is_flagged || false;
        } else {
          initialStrikes = interview.session.strikes || 0;
          initialFlagged = interview.session.is_flagged || false;
        }

        setStrikes(initialStrikes);
        setIsFlagged(initialFlagged);

        // Start camera
        await camera.startCamera();

        // Start proctoring (will load models)
        proctoring.startProctoring();

        setIsReady(true);
      } catch (err) {
        console.error('Initialization error:', err);
      }
    };

    init();

    return () => {
      camera.stopCamera();
      proctoring.stopProctoring();
      tts.stop();
      speech.stopListening();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update proctoring status in context
  useEffect(() => {
    interview.setProctoringStatus(proctoring.status);
  }, [proctoring.status]); // eslint-disable-line react-hooks/exhaustive-deps

  // Generate next question
  const generateNextQuestion = useCallback(async () => {
    interview.setGeneratingQuestion(true);
    setFeedback(null);
    setTimer(0);

    try {
      const response = await questionAPI.generate(sessionId);

      if (response.data.error && response.data.completed) {
        interview.completeInterview();
        await sessionAPI.complete(sessionId);
        navigate(`/report/${sessionId}`);
        return;
      }

      const question = response.data;
      interview.setCurrentQuestion(question);

      // Read question aloud
      tts.speak(question.text);
    } catch (err) {
      if (err.response?.data?.completed) {
        interview.completeInterview();
        await sessionAPI.complete(sessionId);
        navigate(`/report/${sessionId}`);
      } else {
        console.error('Question generation error:', err);
        interview.setGeneratingQuestion(false);
      }
    }
  }, [sessionId, interview, tts, navigate]);

  // Auto-generate first question when ready
  useEffect(() => {
    if (isReady && interview.questions.length === 0 && !interview.isGeneratingQuestion) {
      generateNextQuestion();
    }
  }, [isReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // Start recording answer
  const startRecording = useCallback(() => {
    speech.resetTranscript();
    speech.startListening();
    interview.setListening(true);
    interview.setPhase('listening');

    // Start timer
    setTimer(0);
    timerRef.current = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);
  }, [speech, interview]);

  // Stop recording and evaluate
  const stopRecording = useCallback(async () => {
    speech.stopListening();
    interview.setListening(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const transcript = speech.fullTranscript || speech.transcript;
    if (!transcript.trim()) {
      interview.setPhase('idle');
      return;
    }

    interview.setTranscript(transcript);
    interview.setEvaluating(true);

    try {
      const response = await answerAPI.evaluate(
        sessionId,
        interview.currentQuestion.id,
        {
          transcript: transcript,
          duration_seconds: timer,
        }
      );

      const answerData = response.data.answer;
      interview.addAnswer({
        ...answerData,
        questionId: interview.currentQuestion.id,
        transcript,
      });
      setFeedback(answerData);

      // Read score summary
      tts.speak(`Response received. Score: ${answerData.score} out of 10.`);
    } catch (err) {
      console.error('Evaluation error:', err);
      interview.setEvaluating(false);
      interview.setPhase('idle');
    }
  }, [speech, interview, sessionId, timer, tts]);

  // Format timer
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalQuestions = interview.session?.profile?.num_questions || interview.profile?.num_questions || 5;
  const currentQNum = interview.questions.length;

  if (!isReady) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center text-center p-6">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h3 className="text-lg font-bold text-stone-900">Setting up your room...</h3>
        <p className="text-xs text-stone-500 mt-1 max-w-sm">
          Please allow camera and mic permissions if prompted. We are loading the client-side proctoring models.
        </p>
      </div>
    );
  }

  const scoreBorderColor = (score) => {
    if (score >= 7.5) return 'border-l-4 border-emerald-500';
    if (score >= 5) return 'border-l-4 border-amber-500';
    return 'border-l-4 border-rose-500';
  };

  const scoreTextColor = (score) => {
    if (score >= 7.5) return 'text-emerald-600';
    if (score >= 5) return 'text-amber-600';
    return 'text-rose-600';
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 pt-16 pb-4 px-4 sm:px-8 max-w-[1536px] mx-auto space-y-4 overflow-hidden" id="interview-room">
      <ViolationToast violations={interview.violations} />
      <TabSwitchModal isOpen={showTabSwitchModal} onAcknowledge={() => setShowTabSwitchModal(false)} />

      {/* Main Grid: Left side has bigger video call stacked with question; Right side has AI Assistant stacked with Proctoring diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column (col-span-8): Webcam + Question + Recording Controls stacked */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          
          {/* Big Video call window */}
          <div className="bg-white border border-stone-200 p-2.5 rounded-2xl shadow-sm w-full">
            <CameraFeed
              videoRef={camera.videoRef}
              stream={camera.stream}
              proctoringStatus={proctoring.status}
            />
          </div>

          {/* Question Card */}
          {interview.isGeneratingQuestion ? (
            <div className="bg-white border border-stone-200 p-8 rounded-2xl shadow-sm text-center flex flex-col items-center justify-center min-h-[110px]">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-xs text-stone-600 font-medium">Generating your next question...</p>
            </div>
          ) : (
            <QuestionCard
              question={interview.currentQuestion}
              questionNumber={currentQNum}
              totalQuestions={totalQuestions}
            />
          )}

          {/* Recording & Input controls (at the edge box) */}
          <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Recording Control</span>
                <div className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                  timer > 120 ? 'bg-rose-50 text-rose-600' : 'bg-stone-50 text-stone-700'
                }`}>
                  Time: {formatTime(timer)}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <VoiceVisualizer isListening={speech.isListening} />
                <button
                  id="record-button"
                  onClick={speech.isListening ? stopRecording : startRecording}
                  disabled={!interview.currentQuestion || interview.isEvaluating || interview.isGeneratingQuestion}
                  className={`record-btn ${speech.isListening ? 'recording' : ''}`}
                  aria-label={speech.isListening ? 'Stop Recording' : 'Start Recording'}
                />
              </div>
            </div>

            {/* Transcript/Input container */}
            <div 
              id="live-transcript"
              className="p-3 min-h-[70px] border border-stone-200 bg-stone-50/50 rounded-xl text-stone-700 text-xs leading-relaxed"
            >
              {speech.fullTranscript || speech.transcript ? (
                <p className="relative">
                  {speech.fullTranscript || speech.transcript}
                  {speech.isListening && <span className="cursor-blink" />}
                </p>
              ) : (
                <span className="text-stone-400 italic text-[11px]">
                  {interview.isEvaluating
                    ? 'Evaluating response transcript...'
                    : speech.isListening
                      ? 'Listening... Speak your answer.'
                      : 'Press the red record circle above to start speaking your answer.'
                  }
                </span>
              )}
            </div>
          </div>

          {/* Feedback Card (only slides in when available, scroll is handled inside dashboard) */}
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 bg-white border border-stone-200 rounded-2xl shadow-sm flex flex-col gap-3 ${scoreBorderColor(feedback.score)}`}
            >
              <div className="flex items-center justify-between">
                <h5 className="font-bold text-stone-900 text-sm">AI Feedback</h5>
                <span className={`text-base font-black ${scoreTextColor(feedback.score)}`}>
                  {feedback.score} / 10
                </span>
              </div>
              
              <p className="text-xs text-stone-600 leading-relaxed bg-stone-50/50 p-3 rounded-xl border border-stone-150">
                {feedback.feedback}
              </p>

              {feedback.strengths?.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                    Strengths
                  </div>
                  <ul className="text-[11px] text-stone-600 space-y-0.5 pl-4 list-disc">
                    {feedback.strengths.map((str, idx) => (
                      <li key={idx}>{str}</li>
                    ))}
                  </ul>
                </div>
              )}

              {feedback.improvements?.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                    Areas to Improve
                  </div>
                  <ul className="text-[11px] text-stone-600 space-y-0.5 pl-4 list-disc">
                    {feedback.improvements.map((imp, idx) => (
                      <li key={idx}>{imp}</li>
                    ))}
                  </ul>
                </div>
              )}

                <button
                  id="next-question-btn"
                  onClick={generateNextQuestion}
                  className="w-full py-2.5 mt-1 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition-colors shadow-sm cursor-pointer text-xs text-center"
                >
                  {currentQNum >= totalQuestions ? 'Proceed to Final Report' : 'Move to Next Question'}
                </button>
            </motion.div>
          )}

        </div>

        {/* Right Column (col-span-4): AI Assistant stacked with Proctoring Diagnostics */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          
          {/* AI Assistant Card */}
          <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-sm flex flex-col items-center text-center space-y-3">
            
            {/* AI Assistant Avatar Section */}
            <div className="relative w-20 h-20 flex items-center justify-center mt-1">
              <motion.div
                animate={{
                  scale: tts.isSpeaking ? [1, 1.2, 1] : speech.isListening ? [1, 1.1, 1] : 1,
                  borderColor: tts.isSpeaking ? '#6366f1' : speech.isListening ? '#16a34a' : interview.isEvaluating ? '#d97706' : '#d6d3d1',
                }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute inset-0 rounded-full border-2 border-stone-200"
              />
              <div className="w-16 h-16 rounded-full bg-indigo-50 border border-indigo-105 flex items-center justify-center shadow-inner relative z-10 text-indigo-650 select-none">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            <div className="space-y-0.5">
              <h3 className="font-bold text-stone-900 text-sm">AI Assistant</h3>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                tts.isSpeaking 
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                  : speech.isListening 
                    ? 'bg-green-50 text-green-700 border border-green-150 animate-pulse'
                    : interview.isEvaluating
                      ? 'bg-amber-50 text-amber-700 border border-amber-100'
                      : 'bg-stone-50 text-stone-500 border border-stone-200'
              }`}>
                <span className={`w-1 h-1 rounded-full ${
                  tts.isSpeaking 
                    ? 'bg-indigo-600 animate-pulse' 
                    : speech.isListening 
                      ? 'bg-green-600 animate-pulse'
                      : interview.isEvaluating
                        ? 'bg-amber-600 animate-spin'
                        : 'bg-stone-400'
                }`} />
                {tts.isSpeaking 
                  ? 'Speaking...' 
                  : speech.isListening 
                    ? 'Listening...' 
                    : interview.isEvaluating 
                      ? 'Analyzing...' 
                      : 'Standby'}
              </span>
            </div>

            {/* Conversational bubble */}
            <div className="w-full relative bg-stone-50 border border-stone-150 p-3 rounded-xl text-left text-[11px] text-stone-600 leading-relaxed shadow-inner">
              <div className="absolute left-1/2 -top-1.5 transform -translate-x-1/2 w-2.5 h-2.5 bg-stone-50 border-t border-l border-stone-150 rotate-45" />
              <p className="relative z-10">
                {interview.isGeneratingQuestion ? (
                  "Generating next role-aware technical challenge..."
                ) : tts.isSpeaking ? (
                  "Reading question. Listen closely!"
                ) : speech.isListening ? (
                  "I'm listening. Speak naturally and cover key conceptual trade-offs."
                ) : interview.isEvaluating ? (
                  "Analyzing response transcript for scores and feedback..."
                ) : feedback ? (
                  `Evaluation complete. You scored ${feedback.score}/10!`
                ) : (
                  "Click the microphone button when you are set to answer."
                )}
              </p>
            </div>

            {/* Tip Panel */}
            <div className="w-full text-left bg-indigo-50/30 border border-indigo-100/50 p-3 rounded-lg text-[10px] leading-normal text-stone-600">
              <span className="font-semibold text-indigo-800">Interviewer Guidance:</span> Mention edge cases, complexity, and real-world architectures.
            </div>

          </div>

          {/* Proctoring Diagnostics (Moved here from the bottom!) */}
          <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Proctoring Monitor
              </h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                isFlagged ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
              }`}>
                {isFlagged ? 'Flagged' : 'Compliant'}
              </span>
            </div>

            {/* Strikes indicator */}
            <div className="flex justify-center border-b border-stone-100 pb-2">
              <StrikeIndicator strikes={strikes} />
            </div>

            {/* Diagnostics details */}
            <div className="space-y-1.5 text-[11px] font-medium border-b border-stone-100 pb-2">
              <div className="flex justify-between items-center">
                <span className="text-stone-400">Webcam Face Detection</span>
                <span className={`w-2 h-2 rounded-full ${proctoring.status.faceDetected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-stone-400">Estimated Gaze Focus</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                  proctoring.status.gazeDirection === 'center'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-700 font-semibold'
                }`}>
                  {proctoring.status.gazeDirection === 'center' ? 'Center' : proctoring.status.gazeDirection || 'Away'}
                </span>
              </div>
            </div>

            {/* Alerts Log timeline */}
            <div className="bg-stone-50/50 p-2.5 rounded-xl border border-stone-150 h-[58px] overflow-y-auto space-y-1 text-[10px]">
              {interview.violations.length === 0 ? (
                <span className="text-stone-400 italic">No warnings recorded.</span>
              ) : (
                interview.violations.slice(-2).map((violation, idx) => (
                  <div key={idx} className="flex gap-1.5 text-stone-650 leading-snug">
                    <span className="text-rose-600 font-bold select-none">!</span>
                    <span>{violation.message}</span>
                  </div>
                ))
              )}
            </div>

            {/* Progress tracker */}
            <div className="pt-1 flex items-center justify-between text-[10px] text-stone-500">
              <div className="flex items-center gap-2 w-3/5">
                <span>Progress:</span>
                <div className="flex-1 h-1 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-500"
                    style={{ width: `${(currentQNum / totalQuestions) * 105}%` }}
                  />
                </div>
              </div>
              <span className="font-semibold">{currentQNum}/{totalQuestions} Qs</span>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
