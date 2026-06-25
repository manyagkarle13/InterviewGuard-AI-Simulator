"""
Gemini 2.0 Flash Service Layer — Question generation, answer evaluation, and 3-topic roadmap.
"""
import json
import logging
from django.conf import settings

import google.generativeai as genai

logger = logging.getLogger(__name__)

genai.configure(api_key=settings.GEMINI_API_KEY)


def _get_model():
    return genai.GenerativeModel('gemini-2.0-flash')


def generate_question(role, experience, tech_stack, previous_questions=None, question_number=1, total_questions=5):
    """Generate a role-aware interview question using Gemini 2.0 Flash."""
    previous_q_text = ""
    if previous_questions:
        previous_q_text = "\n".join([f"- {q}" for q in previous_questions])
        previous_q_text = f"\n\nPreviously asked questions (DO NOT repeat these):\n{previous_q_text}"

    prompt = f"""You are an expert technical interviewer. Generate ONE interview question for the following candidate:

Role: {role}
Experience Level: {experience}
Tech Stack: {', '.join(tech_stack) if tech_stack else 'General'}
Question Number: {question_number} of {total_questions}
{previous_q_text}

Rules:
1. Match the question difficulty to the experience level.
2. Junior → fundamentals and basic concepts.
3. Mid-level → practical application, problem-solving, debugging scenarios.
4. Senior → architecture, design patterns, trade-offs, scalability.
5. Lead → system design, team decisions, strategic technical choices.
6. Gradually increase difficulty as question number increases.
7. Cover different areas from the tech stack across questions.
8. Make the question conversational — it will be spoken aloud in a voice interview.
9. Keep the question focused and clear — one concept per question.

Respond ONLY in this JSON format (no markdown, no code blocks, no explanation):
{{"text": "Your question here", "difficulty": "easy|medium|hard", "category": "Category name"}}"""

    try:
        model = _get_model()
        response = model.generate_content(prompt)
        text = response.text.strip()

        if text.startswith('```'):
            text = text.split('\n', 1)[1]
        if text.endswith('```'):
            text = text.rsplit('```', 1)[0]
        text = text.strip()

        result = json.loads(text)
        return {
            'text': result.get('text', 'Tell me about your experience.'),
            'difficulty': result.get('difficulty', 'medium'),
            'category': result.get('category', 'General'),
        }
    except Exception as e:
        logger.error(f"Gemini question generation error: {e}")
        return {
            'text': f'Tell me about your experience with {tech_stack[0] if tech_stack else "software development"} and how you have applied it in your projects.',
            'difficulty': 'medium',
            'category': 'General',
        }


def evaluate_answer(question_text, answer_text, role, experience):
    """Evaluate a candidate's answer using Gemini 2.0 Flash."""
    prompt = f"""You are an expert technical interviewer evaluating a candidate's spoken answer.

Role: {role}
Experience Level: {experience}

Question: {question_text}

Candidate's Answer (voice transcript — may contain speech-to-text artifacts): {answer_text}

Evaluate considering:
1. Technical accuracy and depth
2. Clarity of explanation
3. Relevance to the question
4. Appropriate level for the experience level
5. Practical examples or real-world application

If the answer is empty, very short, or "I don't know", give a low score but constructive feedback.

Respond ONLY in this JSON format (no markdown, no code blocks):
{{"score": 7.5, "feedback": "Your detailed feedback paragraph here", "strengths": ["strength 1", "strength 2"], "improvements": ["improvement 1", "improvement 2"]}}

Score must be a number from 1.0 to 10.0."""

    try:
        model = _get_model()
        response = model.generate_content(prompt)
        text = response.text.strip()

        if text.startswith('```'):
            text = text.split('\n', 1)[1]
        if text.endswith('```'):
            text = text.rsplit('```', 1)[0]
        text = text.strip()

        result = json.loads(text)
        score = float(result.get('score', 5.0))
        score = max(1.0, min(10.0, score))

        return {
            'score': score,
            'feedback': result.get('feedback', 'No feedback available.'),
            'strengths': result.get('strengths', []),
            'improvements': result.get('improvements', []),
        }
    except Exception as e:
        logger.error(f"Gemini answer evaluation error: {e}")
        return {
            'score': 5.0,
            'feedback': 'Unable to evaluate answer at this time.',
            'strengths': [],
            'improvements': [],
        }


def generate_roadmap(weak_areas, role, experience):
    """Generate a 3-topic study roadmap based on weak areas."""
    prompt = f"""You are a senior tech mentor. Create a focused 3-topic study roadmap.

Role: {role}
Experience Level: {experience}
Weak Areas: {', '.join(weak_areas) if weak_areas else 'General improvement'}

Create exactly 3 study topics ordered by priority. Each topic needs:
- A clear name
- What to study and why (2-3 sentences)
- 2-3 specific, actionable resources
- Priority (high/medium/low)
- Estimated hours to study

Respond ONLY in this JSON format (no markdown, no code blocks):
{{
    "title": "Your Study Roadmap",
    "summary": "One sentence summary of the roadmap focus",
    "topics": [
        {{
            "name": "Topic Name",
            "description": "What to study and why",
            "resources": ["Resource 1", "Resource 2"],
            "priority": "high",
            "estimated_hours": 10
        }}
    ]
}}"""

    try:
        model = _get_model()
        response = model.generate_content(prompt)
        text = response.text.strip()

        if text.startswith('```'):
            text = text.split('\n', 1)[1]
        if text.endswith('```'):
            text = text.rsplit('```', 1)[0]
        text = text.strip()

        return json.loads(text)
    except Exception as e:
        logger.error(f"Gemini roadmap generation error: {e}")
        return {
            'title': 'Study Roadmap',
            'summary': 'Focus on strengthening your core skills.',
            'topics': [
                {
                    'name': area,
                    'description': f'Review and practice {area} concepts.',
                    'resources': ['Official documentation', 'Online tutorials'],
                    'priority': 'high',
                    'estimated_hours': 8,
                }
                for area in (weak_areas or ['General Programming'])[:3]
            ],
        }
