"""
WSGI config for InterviewGuard AI Simulator project.
"""
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'proctor_ai.settings')
application = get_wsgi_application()
