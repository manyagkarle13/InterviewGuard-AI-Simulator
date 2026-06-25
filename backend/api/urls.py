"""
URL routes for the API app. No authentication endpoints needed.
"""
from django.urls import path
from . import views

urlpatterns = [
    # Sessions
    path('sessions/', views.create_session, name='create_session'),
    path('sessions/list/', views.list_sessions, name='list_sessions'),
    path('sessions/<uuid:session_id>/', views.get_session, name='get_session'),
    path('sessions/<uuid:session_id>/complete/', views.complete_session, name='complete_session'),

    # Questions
    path('sessions/<uuid:session_id>/generate-question/', views.generate_question, name='generate_question'),

    # Answers
    path('sessions/<uuid:session_id>/questions/<uuid:question_id>/evaluate/', views.evaluate_answer, name='evaluate_answer'),

    # Proctoring
    path('sessions/<uuid:session_id>/proctoring-log/', views.log_violation, name='log_violation'),

    # Report & Roadmap
    path('sessions/<uuid:session_id>/report/', views.get_report, name='get_report'),
    path('sessions/<uuid:session_id>/roadmap/', views.generate_roadmap, name='generate_roadmap'),
]
