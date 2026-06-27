"""
Gemini 2.0 Flash Service Layer — Question generation, answer evaluation.
Uses the new google-genai SDK which supports AQ. format API keys.
"""
import json
import logging
from django.conf import settings

from google import genai
from google.genai import types

logger = logging.getLogger(__name__)


def _get_client():
    return genai.Client(api_key=settings.GEMINI_API_KEY)


def _generate(prompt: str) -> str:
    client = _get_client()
    response = client.models.generate_content(
        model='gemini-2.0-flash-lite',
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.7,
            max_output_tokens=512,
        ),
    )
    return response.text.strip()


def _parse_json(text: str) -> dict:
    if text.startswith('```'):
        text = text.split('\n', 1)[1]
    if text.endswith('```'):
        text = text.rsplit('```', 1)[0]
    return json.loads(text.strip())


def generate_question(role, experience, tech_stack, previous_questions=None, question_number=1, total_questions=5):
    """Generate a role-aware interview question using Gemini."""
    previous_q_text = ""
    if previous_questions:
        previous_q_text = "\n".join([f"- {q}" for q in previous_questions])
        previous_q_text = f"\n\nPreviously asked questions (DO NOT repeat these):\n{previous_q_text}"

    has_skills = bool(tech_stack)
    skills_line = f"- Core Technologies / Skills: {', '.join(tech_stack)}" if has_skills else "- Core Technologies / Skills: Not specified"
    skills_instruction = (
        "2. Tie the question to one of the listed core technologies/skills where natural."
        if has_skills else
        "2. Since no specific skills are listed, focus entirely on the responsibilities, challenges, and mindset of the role."
    )

    prompt = f"""You are an expert technical interviewer conducting a mock interview.

Candidate Profile:
- Target Role: {role}
- Experience Level: {experience}
{skills_line}
- Question: {question_number} of {total_questions}
{previous_q_text}

Your goal is to generate ONE question that is DEEPLY relevant to the target role.

Guidelines:
1. The question MUST relate to the "{role}" role — think about what this role actually does day-to-day.
{skills_instruction}
3. Match difficulty to experience: Junior → concepts, Mid → application, Senior → trade-offs/scale, Lead → strategy/architecture.
4. Gradually increase difficulty as question number increases.
5. Make it conversational — the question will be spoken aloud in a real voice interview.
6. Ask only ONE focused question — not multi-part.

Respond ONLY in this exact JSON format (no markdown, no code blocks):
{{"text": "Your question here", "difficulty": "easy|medium|hard", "category": "Category name"}}"""

    try:
        text = _generate(prompt)
        result = _parse_json(text)
        return {
            'text': result.get('text', 'Tell me about your experience.'),
            'difficulty': result.get('difficulty', 'medium'),
            'category': result.get('category', 'General'),
        }
    except Exception as e:
        logger.error(f"Gemini question generation error: {type(e).__name__}: {e}")
        role_hint = role or 'software development'
        tech_hint = tech_stack[0] if tech_stack else role_hint
        return {
            'text': f'Tell me about your experience with {tech_hint} and how you have applied it in your projects.',
            'difficulty': 'medium',
            'category': 'General',
        }


def evaluate_answer(question_text, answer_text, role, experience):
    """Evaluate a candidate's answer using Gemini."""
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
        text = _generate(prompt)
        result = _parse_json(text)
        score = float(result.get('score', 5.0))
        score = max(1.0, min(10.0, score))
        return {
            'score': score,
            'feedback': result.get('feedback', 'No feedback available.'),
            'strengths': result.get('strengths', []),
            'improvements': result.get('improvements', []),
        }
    except Exception as e:
        logger.error(f"Gemini answer evaluation error: {type(e).__name__}: {e}")
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
        text = _generate(prompt)
        return _parse_json(text)
    except Exception as e:
        logger.error(f"Gemini roadmap generation error: {type(e).__name__}: {e}")
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
