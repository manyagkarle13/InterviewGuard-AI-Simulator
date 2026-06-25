/**
 * Interview Context — Global state management for the interview flow.
 */
import { createContext, useContext, useReducer, useCallback } from 'react';

const InterviewContext = createContext(null);

const initialState = {
  // Session
  session: null,
  sessionId: null,

  // Profile config
  profile: {
    role: 'fullstack',
    experience: 'mid',
    tech_stack: [],
    num_questions: 5,
  },

  // Interview state
  currentQuestion: null,
  questions: [],
  answers: [],
  currentQuestionIndex: 0,
  isGeneratingQuestion: false,
  isEvaluating: false,

  // Voice state
  isListening: false,
  transcript: '',

  // Proctoring
  violations: [],
  proctoringStatus: {
    faceDetected: false,
    gazeDirection: 'center',
    faceCount: 0,
  },

  // UI state
  interviewPhase: 'idle', // idle | listening | processing | feedback | completed
};

function interviewReducer(state, action) {
  switch (action.type) {
    case 'SET_PROFILE':
      return { ...state, profile: { ...state.profile, ...action.payload } };

    case 'SET_SESSION':
      return {
        ...state,
        session: action.payload,
        sessionId: action.payload.id,
      };

    case 'SET_CURRENT_QUESTION':
      return {
        ...state,
        currentQuestion: action.payload,
        questions: [...state.questions, action.payload],
        currentQuestionIndex: state.questions.length,
        isGeneratingQuestion: false,
        interviewPhase: 'idle',
      };

    case 'SET_GENERATING_QUESTION':
      return { ...state, isGeneratingQuestion: action.payload };

    case 'SET_LISTENING':
      return {
        ...state,
        isListening: action.payload,
        interviewPhase: action.payload ? 'listening' : state.interviewPhase,
      };

    case 'SET_TRANSCRIPT':
      return { ...state, transcript: action.payload };

    case 'SET_EVALUATING':
      return {
        ...state,
        isEvaluating: action.payload,
        interviewPhase: action.payload ? 'processing' : state.interviewPhase,
      };

    case 'ADD_ANSWER':
      return {
        ...state,
        answers: [...state.answers, action.payload],
        isEvaluating: false,
        interviewPhase: 'feedback',
      };

    case 'ADD_VIOLATION':
      return {
        ...state,
        violations: [...state.violations, action.payload],
      };

    case 'SET_PROCTORING_STATUS':
      return {
        ...state,
        proctoringStatus: { ...state.proctoringStatus, ...action.payload },
      };

    case 'SET_PHASE':
      return { ...state, interviewPhase: action.payload };

    case 'COMPLETE_INTERVIEW':
      return { ...state, interviewPhase: 'completed' };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

export function InterviewProvider({ children }) {
  const [state, dispatch] = useReducer(interviewReducer, initialState);

  const setProfile = useCallback((data) => dispatch({ type: 'SET_PROFILE', payload: data }), []);
  const setSession = useCallback((data) => dispatch({ type: 'SET_SESSION', payload: data }), []);
  const setCurrentQuestion = useCallback((data) => dispatch({ type: 'SET_CURRENT_QUESTION', payload: data }), []);
  const setGeneratingQuestion = useCallback((val) => dispatch({ type: 'SET_GENERATING_QUESTION', payload: val }), []);
  const setListening = useCallback((val) => dispatch({ type: 'SET_LISTENING', payload: val }), []);
  const setTranscript = useCallback((val) => dispatch({ type: 'SET_TRANSCRIPT', payload: val }), []);
  const setEvaluating = useCallback((val) => dispatch({ type: 'SET_EVALUATING', payload: val }), []);
  const addAnswer = useCallback((data) => dispatch({ type: 'ADD_ANSWER', payload: data }), []);
  const addViolation = useCallback((data) => dispatch({ type: 'ADD_VIOLATION', payload: data }), []);
  const setProctoringStatus = useCallback((data) => dispatch({ type: 'SET_PROCTORING_STATUS', payload: data }), []);
  const setPhase = useCallback((phase) => dispatch({ type: 'SET_PHASE', payload: phase }), []);
  const completeInterview = useCallback(() => dispatch({ type: 'COMPLETE_INTERVIEW' }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  const value = {
    ...state,
    setProfile,
    setSession,
    setCurrentQuestion,
    setGeneratingQuestion,
    setListening,
    setTranscript,
    setEvaluating,
    addAnswer,
    addViolation,
    setProctoringStatus,
    setPhase,
    completeInterview,
    reset,
  };

  return (
    <InterviewContext.Provider value={value}>
      {children}
    </InterviewContext.Provider>
  );
}

export function useInterview() {
  const context = useContext(InterviewContext);
  if (!context) {
    throw new Error('useInterview must be used within an InterviewProvider');
  }
  return context;
}

export default InterviewContext;
