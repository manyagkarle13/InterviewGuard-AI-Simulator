"""
API Views for InterviewGuard AI Simulator — Interview sessions, question generation, answer evaluation,
proctoring with 3-strike system, and roadmap generation.
No authentication required.
"""
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import InterviewProfile, InterviewSession, Question, Answer, ProctoringLog
from .serializers import (
    InterviewSessionSerializer, InterviewSessionListSerializer,
    CreateSessionSerializer, QuestionSerializer, SubmitAnswerSerializer,
    ProctoringLogSerializer,
)
from . import gemini_service


# ─── Interview Sessions ─────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def create_session(request):
    """Create a new interview session with profile configuration."""
    serializer = CreateSessionSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data

    profile = InterviewProfile.objects.create(
        role=data['role'],
        experience=data['experience'],
        tech_stack=data.get('tech_stack', []),
        num_questions=data.get('num_questions', 5),
    )

    session = InterviewSession.objects.create(
        profile=profile,
        status='in_progress',
        started_at=timezone.now(),
    )

    return Response(InterviewSessionSerializer(session).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_session(request, session_id):
    """Get full session details."""
    try:
        session = InterviewSession.objects.get(id=session_id)
    except InterviewSession.DoesNotExist:
        return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)
    return Response(InterviewSessionSerializer(session).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def list_sessions(request):
    """List recent sessions."""
    sessions = InterviewSession.objects.all()[:20]
    return Response(InterviewSessionListSerializer(sessions, many=True).data)


# ─── Question Generation ────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def generate_question(request, session_id):
    """Generate the next interview question using Gemini."""
    try:
        session = InterviewSession.objects.get(id=session_id)
    except InterviewSession.DoesNotExist:
        return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

    if session.status == 'completed':
        return Response({'error': 'Session is already completed'}, status=status.HTTP_400_BAD_REQUEST)

    profile = session.profile
    existing_questions = list(session.questions.values_list('text', flat=True))
    question_number = len(existing_questions) + 1

    if question_number > profile.num_questions:
        session.status = 'completed'
        session.completed_at = timezone.now()
        session.save()
        return Response({'error': 'All questions have been asked', 'completed': True},
                       status=status.HTTP_400_BAD_REQUEST)

    result = gemini_service.generate_question(
        role=profile.get_role_display(),
        experience=profile.get_experience_display(),
        tech_stack=profile.tech_stack,
        previous_questions=existing_questions,
        question_number=question_number,
        total_questions=profile.num_questions,
    )

    question = Question.objects.create(
        session=session,
        text=result['text'],
        difficulty=result['difficulty'],
        category=result['category'],
        order=question_number - 1,
    )

    session.current_question_index = question_number - 1
    session.save()

    return Response(QuestionSerializer(question).data, status=status.HTTP_201_CREATED)


# ─── Answer Evaluation ───────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def evaluate_answer(request, session_id, question_id):
    """Evaluate a candidate's answer using Gemini."""
    try:
        session = InterviewSession.objects.get(id=session_id)
        question = Question.objects.get(id=question_id, session=session)
    except (InterviewSession.DoesNotExist, Question.DoesNotExist):
        return Response({'error': 'Session or question not found'}, status=status.HTTP_404_NOT_FOUND)

    if hasattr(question, 'answer') and question.answer:
        return Response({'error': 'Question already answered'}, status=status.HTTP_400_BAD_REQUEST)

    serializer = SubmitAnswerSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    transcript = serializer.validated_data['transcript']
    duration = serializer.validated_data.get('duration_seconds', 0)

    profile = session.profile
    evaluation = gemini_service.evaluate_answer(
        question_text=question.text,
        answer_text=transcript,
        role=profile.get_role_display(),
        experience=profile.get_experience_display(),
    )

    answer = Answer.objects.create(
        question=question,
        transcript=transcript,
        score=evaluation['score'],
        feedback=evaluation['feedback'],
        strengths=evaluation['strengths'],
        improvements=evaluation['improvements'],
        duration_seconds=duration,
    )

    session.total_score += evaluation['score']
    session.max_score += 10.0
    session.save()

    return Response({
        'answer': {
            'id': str(answer.id),
            'score': answer.score,
            'feedback': answer.feedback,
            'strengths': answer.strengths,
            'improvements': answer.improvements,
        },
        'session_score': session.score_percentage,
    })


# ─── Proctoring (3-Strike System) ────────────────────────────────────

STRIKE_VIOLATIONS = {'no_face', 'multiple_faces', 'tab_switch'}

@api_view(['POST'])
@permission_classes([AllowAny])
def log_violation(request, session_id):
    """Log a proctoring violation. Certain types count as strikes."""
    try:
        session = InterviewSession.objects.get(id=session_id)
    except InterviewSession.DoesNotExist:
        return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

    data = request.data
    violation_type = data.get('violation_type', 'looking_away')
    is_strike = data.get('is_strike', violation_type in STRIKE_VIOLATIONS)

    log = ProctoringLog.objects.create(
        session=session,
        violation_type=violation_type,
        description=data.get('description', ''),
        is_strike=is_strike,
        timestamp_seconds=data.get('timestamp_seconds', 0),
    )

    session.proctoring_violations += 1
    if is_strike:
        session.strikes += 1
        if session.strikes >= 3:
            session.is_flagged = True
    session.save()

    return Response({
        **ProctoringLogSerializer(log).data,
        'strikes': session.strikes,
        'is_flagged': session.is_flagged,
    }, status=status.HTTP_201_CREATED)


# ─── Report & Roadmap ────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def get_report(request, session_id):
    """Get a complete session report."""
    try:
        session = InterviewSession.objects.get(id=session_id)
    except InterviewSession.DoesNotExist:
        return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)
    return Response(InterviewSessionSerializer(session).data)


@api_view(['POST'])
@permission_classes([AllowAny])
def generate_roadmap(request, session_id):
    """Generate a personalized 3-topic study roadmap."""
    try:
        session = InterviewSession.objects.get(id=session_id)
    except InterviewSession.DoesNotExist:
        return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

    weak_areas = []
    for question in session.questions.all():
        try:
            answer = question.answer
            if answer and answer.score < 6.0:
                weak_areas.append(question.category or question.text[:50])
                weak_areas.extend(answer.improvements)
        except Answer.DoesNotExist:
            weak_areas.append(question.category or question.text[:50])

    if not weak_areas:
        weak_areas = ['General improvement']

    weak_areas = list(set(weak_areas))[:10]

    profile = session.profile
    roadmap = gemini_service.generate_roadmap(
        weak_areas=weak_areas,
        role=profile.get_role_display(),
        experience=profile.get_experience_display(),
    )

    return Response(roadmap)


@api_view(['POST'])
@permission_classes([AllowAny])
def complete_session(request, session_id):
    """Mark a session as completed."""
    try:
        session = InterviewSession.objects.get(id=session_id)
    except InterviewSession.DoesNotExist:
        return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

    session.status = 'completed'
    session.completed_at = timezone.now()
    session.save()

    return Response(InterviewSessionSerializer(session).data)
