from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.filters import OrderingFilter, SearchFilter
from celery.result import AsyncResult
from .models import Person
from .serializers import PersonSerializer
from .tasks import long_running_task, calculate_demographics_task


class PersonViewSet(viewsets.ModelViewSet):
    serializer_class = PersonSerializer
    
    # enable ordering AND search
    filter_backends = [OrderingFilter, SearchFilter]
    
    # fields available for ?search= query param
    search_fields = ['person_name', 'hobbies']
    
    ordering_fields = ['person_name', 'age', 'created_date']
    ordering = ['-created_date']

    def get_queryset(self):
        """
        applies optional date range filtering.
        search filtering is applied automatically by filter_backends.
        """
        queryset = Person.objects.all().order_by('-created_date')
        
        start = self.request.query_params.get('start_date')
        end = self.request.query_params.get('end_date')

        if start:
            queryset = queryset.filter(created_date__gte=start)
        if end:
            queryset = queryset.filter(created_date__lte=end)
            
        return queryset

    @action(detail=False, methods=['post'], url_path='calculate-stats')
    def calculate_stats(self, request):
        """
        endpoint to trigger the background calculation task.
        """
        task = calculate_demographics_task.delay()
        return Response(
            {"task_id": task.id, "status": "STARTED"}, 
            status=status.HTTP_202_ACCEPTED
        )


class LongTaskStartView(APIView):
    def post(self, request):
        task = long_running_task.delay()
        return Response(
            {"task_id": task.id}, 
            status=status.HTTP_202_ACCEPTED
        )


class LongTaskStatusView(APIView):
    def get(self, request, task_id):
        """
        checks the status of a celery task by id.
        """
        # fix: convert uuid object to string for celery lookup
        task_id_str = str(task_id)
        
        task_result = AsyncResult(task_id_str)
        return Response({
            "task_id": task_id_str, 
            "status": task_result.status, 
            "result": task_result.result
        })