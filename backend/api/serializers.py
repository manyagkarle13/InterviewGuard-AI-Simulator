"""
DRF Serializers for InterviewGuard AI Simulator models.
"""
from rest_framework import serializers
from .models import InterviewProfile, InterviewSession, Question, Answer, ProctoringLog


class AnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = ('id', 'question', 'transcript', 'score', 'feedback', 'strengths',
                  'improvements', 'duration_seconds', 'created_at')
        read_only_fields = ('id', 'score', 'feedback', 'strengths', 'improvements', 'created_at')


class QuestionSerializer(serializers.ModelSerializer):
    answer = AnswerSerializer(read_only=True)

    class Meta:
        model = Question
        fields = ('id', 'session', 'text', 'difficulty', 'category', 'order', 'answer', 'created_at')
        read_only_fields = ('id', 'text', 'difficulty', 'category', 'order', 'created_at')


class ProctoringLogSerializer(serializers.ModelSerializer):
    violation_display = serializers.CharField(source='get_violation_type_display', read_only=True)

    class Meta:
        model = ProctoringLog
        fields = ('id', 'session', 'violation_type', 'violation_display', 'description',
                  'is_strike', 'timestamp_seconds', 'created_at')
        read_only_fields = ('id', 'created_at')


class InterviewProfileSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    experience_display = serializers.CharField(source='get_experience_display', read_only=True)

    class Meta:
        model = InterviewProfile
        fields = ('id', 'role', 'role_display', 'experience', 'experience_display',
                  'tech_stack', 'num_questions', 'created_at')
        read_only_fields = ('id', 'created_at')


class InterviewSessionSerializer(serializers.ModelSerializer):
    profile = InterviewProfileSerializer(read_only=True)
    questions = QuestionSerializer(many=True, read_only=True)
    proctoring_logs = ProctoringLogSerializer(many=True, read_only=True)
    score_percentage = serializers.ReadOnlyField()

    class Meta:
        model = InterviewSession
        fields = ('id', 'profile', 'status', 'current_question_index', 'total_score',
                  'max_score', 'score_percentage', 'proctoring_violations', 'strikes',
                  'is_flagged', 'questions', 'proctoring_logs', 'started_at',
                  'completed_at', 'created_at')
        read_only_fields = ('id', 'total_score', 'max_score', 'score_percentage',
                           'proctoring_violations', 'strikes', 'is_flagged', 'created_at')


class InterviewSessionListSerializer(serializers.ModelSerializer):
    profile = InterviewProfileSerializer(read_only=True)
    score_percentage = serializers.ReadOnlyField()

    class Meta:
        model = InterviewSession
        fields = ('id', 'profile', 'status', 'score_percentage', 'proctoring_violations',
                  'strikes', 'is_flagged', 'started_at', 'completed_at', 'created_at')


class CreateSessionSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=InterviewProfile.ROLE_CHOICES)
    experience = serializers.ChoiceField(choices=InterviewProfile.EXPERIENCE_CHOICES)
    tech_stack = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    num_questions = serializers.IntegerField(min_value=1, max_value=15, default=5)


class SubmitAnswerSerializer(serializers.Serializer):
    transcript = serializers.CharField()
    duration_seconds = serializers.IntegerField(min_value=0, default=0)
