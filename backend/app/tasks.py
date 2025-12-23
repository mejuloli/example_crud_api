import time
from celery import shared_task
from django.db.models import Avg, StdDev
from .models import Person


@shared_task
def long_running_task():
    """
    simple task to test celery connectivity.
    """
    time.sleep(10)
    return "Test task finished!"


@shared_task
def calculate_demographics_task():
    """
    calculates heavy statistics in background (simulated delay).
    """
    time.sleep(5)  # simulates heavy processing load
    
    stats = Person.objects.aggregate(
        media=Avg('age'), 
        desvio=StdDev('age')
    )
    
    return {
        "media_idade": round(stats['media'] or 0, 2),
        "desvio_padrao": round(stats['desvio'] or 0, 2),
        "total": Person.objects.count()
    }