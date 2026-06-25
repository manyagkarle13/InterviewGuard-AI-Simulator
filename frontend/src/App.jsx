/**
 * App — Root component with React Router and InterviewProvider.
 */
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { InterviewProvider } from './context/InterviewContext';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import SetupPage from './pages/SetupPage';
import InterviewRoom from './pages/InterviewRoom';
import ReportPage from './pages/ReportPage';

function App() {
  return (
    <InterviewProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/interview/:sessionId" element={<InterviewRoom />} />
          <Route path="/report/:sessionId" element={<ReportPage />} />
        </Routes>
      </Router>
    </InterviewProvider>
  );
}

export default App;
