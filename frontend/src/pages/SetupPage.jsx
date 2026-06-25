/**
 * SetupPage — Interview configuration form.
 * Uses Tailwind CSS v4 + Framer Motion for clean, warm-light aesthetics.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useInterview } from '../context/InterviewContext';
import { sessionAPI } from '../services/api';

const ROLES = [
  { value: 'frontend', label: 'Frontend Developer' },
  { value: 'backend', label: 'Backend Developer' },
  { value: 'fullstack', label: 'Full-Stack Developer' },
  { value: 'sde', label: 'Software Dev Engineer' },
  { value: 'data_science', label: 'Data Scientist' },
  { value: 'data_analyst', label: 'Data Analyst' },
  { value: 'devops', label: 'DevOps Engineer' },
  { value: 'mobile', label: 'Mobile Developer' },
  { value: 'ml_engineer', label: 'ML Engineer' },
  { value: 'system_design', label: 'System Design' },
  { value: 'product_manager', label: 'Product Manager' },
];

const EXPERIENCES = [
  { value: 'junior', label: 'Junior (0-2 years)' },
  { value: 'mid', label: 'Mid-Level (2-5 years)' },
  { value: 'senior', label: 'Senior (5-8 years)' },
  { value: 'lead', label: 'Lead (8+ years)' },
];

const COMMON_TECH = [
  'React', 'Node.js', 'Python', 'JavaScript', 'TypeScript', 'Java',
  'Go', 'Rust', 'SQL', 'MongoDB', 'Docker', 'Kubernetes', 'AWS',
  'Django', 'FastAPI', 'Next.js', 'Vue.js', 'TensorFlow', 'PyTorch',
  'GraphQL', 'Redis', 'PostgreSQL', 'Git',
];

export default function SetupPage() {
  const navigate = useNavigate();
  const { setProfile, setSession } = useInterview();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    role: 'fullstack',
    experience: 'mid',
    tech_stack: [],
    num_questions: 5,
  });

  const [techInput, setTechInput] = useState('');

  const handleRoleSelect = (role) => {
    setFormData((prev) => ({ ...prev, role }));
  };

  const handleExperienceSelect = (experience) => {
    setFormData((prev) => ({ ...prev, experience }));
  };

  const addTech = (tech) => {
    const cleaned = tech.trim();
    if (cleaned && !formData.tech_stack.includes(cleaned)) {
      setFormData((prev) => ({
        ...prev,
        tech_stack: [...prev.tech_stack, cleaned],
      }));
    }
  };

  const removeTech = (tech) => {
    setFormData((prev) => ({
      ...prev,
      tech_stack: prev.tech_stack.filter((t) => t !== tech),
    }));
  };

  const handleTechInputKeyDown = (e) => {
    if (e.key === 'Enter' && techInput.trim()) {
      e.preventDefault();
      addTech(techInput);
      setTechInput('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      setProfile(formData);
      const response = await sessionAPI.create(formData);
      setSession(response.data);
      navigate(`/interview/${response.data.id}`);
    } catch (err) {
      console.error('Session creation error:', err);
      setError(err.response?.data?.error || 'Failed to create session. Ensure backend server is running.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 pt-20 pb-16 flex items-center justify-center px-4" id="setup-page">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-2xl bg-white border border-stone-200 rounded-3xl p-6 sm:p-10 shadow-md relative"
      >
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-indigo-600 rounded-t-3xl" />

        <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
          Configure Your Practice Session
        </h2>
        <p className="text-sm text-stone-500 mt-2">
          Tell us about your target role and stack to generate personalized interview questions.
        </p>

        {error && (
          <div className="mt-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm font-medium">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Target Role Selection */}
          <div className="space-y-3">
            <label className="text-sm font-bold uppercase tracking-wider text-stone-400 block">
              Target Role
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ROLES.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => handleRoleSelect(role.value)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm font-medium transition-all cursor-pointer ${
                    formData.role === role.value
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 font-semibold ring-1 ring-indigo-500'
                      : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  <span>{role.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Experience Level */}
          <div className="space-y-3">
            <label className="text-sm font-bold uppercase tracking-wider text-stone-400 block">
              Experience Level
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {EXPERIENCES.map((exp) => (
                <button
                  key={exp.value}
                  type="button"
                  onClick={() => handleExperienceSelect(exp.value)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm font-medium transition-all cursor-pointer ${
                    formData.experience === exp.value
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 font-semibold ring-1 ring-indigo-500'
                      : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  <span>{exp.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tech Stack Selection */}
          <div className="space-y-3">
            <label className="text-sm font-bold uppercase tracking-wider text-stone-400 block">
              Core Technologies
            </label>
            <div className="flex flex-wrap gap-2 p-3 min-h-[50px] border border-stone-200 rounded-xl bg-stone-50 focus-within:border-stone-300 transition-colors">
              {formData.tech_stack.map((tech) => (
                <span
                  key={tech}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-600 text-white select-none shadow-sm"
                >
                  {tech}
                  <button
                    type="button"
                    onClick={() => removeTech(tech)}
                    className="hover:bg-indigo-700 rounded p-0.5 ml-1 transition-colors leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={handleTechInputKeyDown}
                placeholder={formData.tech_stack.length === 0 ? 'Type and press Enter...' : ''}
                className="flex-1 min-w-[120px] bg-transparent border-0 outline-none text-sm text-stone-800 placeholder-stone-400"
              />
            </div>
            
            {/* Quick Suggestions */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {COMMON_TECH.filter((t) => !formData.tech_stack.includes(t)).slice(0, 10).map((tech) => (
                <button
                  key={tech}
                  type="button"
                  onClick={() => addTech(tech)}
                  className="px-2.5 py-1 rounded-lg border border-stone-200 hover:border-stone-300 bg-white hover:bg-stone-50 text-xs text-stone-600 transition-all cursor-pointer"
                >
                  + {tech}
                </button>
              ))}
            </div>
          </div>

          {/* Number of Questions */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold uppercase tracking-wider text-stone-400">
                Number of Questions
              </label>
              <span className="text-sm font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg px-2.5 py-0.5">
                {formData.num_questions} Questions
              </span>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="15"
                value={formData.num_questions}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, num_questions: parseInt(e.target.value, 10) }))
                }
                className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={isLoading}
            id="start-interview-btn"
            className="w-full py-4 rounded-2xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-850 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 disabled:opacity-75 cursor-pointer text-base mt-4"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating Session...
              </>
            ) : (
              <>Begin Mock Practice Session</>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
