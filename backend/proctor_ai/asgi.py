"""
ASGI config for InterviewGuard AI Simulator project.
"""
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'proctor_ai.settings')
application = get_asgi_application()
