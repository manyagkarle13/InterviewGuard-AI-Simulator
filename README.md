# InterviewGuard AI Simulator

**Voice-First AI Interview Simulator with Real-Time Computer Vision Proctoring**

InterviewGuard AI Simulator is a technical interview practice platform. It simulates real technical interviews by reading questions aloud, transcribing verbal answers in real-time, and evaluating performance using LLM intelligence. Throughout the session, client-side computer vision tracks the candidate's gaze and face presence to maintain test integrity.

---

# Live Deployments:

* Frontend Application: https://interviewguard-ai-simulator.netlify.app
* Backend Server (API): https://interviewguard-ai-simulator.onrender.com

---

## Key Features

* **Voice-First Interaction** — Candidates speak answers naturally; integration with the Web Speech API handles audio capture and real-time transcription.
* **Role-Aware Adaptive Questions** — Gemini 2.0 Flash dynamically generates technical questions tailored to the candidate's target role, experience level, and core technologies.
* **Client-Side Computer Vision** — Real-time face presence validation and horizontal/vertical gaze tracking using MediaPipe Face Mesh and TensorFlow.js.
* **Instant Evaluation** — AI scores responses immediately, generating detailed feedback alongside actionable lists of strengths and improvements.
* **Local Privacy** — All webcam image and landmark processing runs 100% locally in the candidate's browser tab. No video data is uploaded to external servers.

---

## Technical Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS v4, Framer Motion |
| Backend | Django, Django REST Framework |
| AI / LLM | Gemini 2.0 Flash |
| Face Detection | MediaPipe Face Mesh |
| Gaze Tracking | TensorFlow.js |
| Voice I/O | Web Speech API (SpeechRecognition & SpeechSynthesis) |
| Database | SQLite |

---

## Setup and Quick Start

### Backend Requirements & Installation

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run migrations and start the server:
   ```bash
   python manage.py migrate
   python manage.py runserver
   ```
   The backend server will run on `http://localhost:8000`.

### Frontend Requirements & Installation

1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install node dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend application will be available at `http://localhost:5173`.

---

## API Endpoints

| HTTP Method | URI | Description |
|---|---|---|
| POST | `/api/sessions/` | Create a new mock interview session |
| GET | `/api/sessions/list/` | List recent mock interview sessions |
| GET | `/api/sessions/<session_id>/` | Fetch full details for a session |
| POST | `/api/sessions/<session_id>/complete/` | Mark a session as completed |
| POST | `/api/sessions/<session_id>/generate-question/` | Generate the next technical question |
| POST | `/api/sessions/<session_id>/questions/<question_id>/evaluate/` | Evaluate a response transcript |
| POST | `/api/sessions/<session_id>/proctoring-log/` | Log a proctoring violation warning |
| GET | `/api/sessions/<session_id>/report/` | Get the final session evaluation report |

---

