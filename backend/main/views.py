from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import NewsArticle
from .serialisers import NewsArticleSerializer
from django.utils import timezone
from datetime import timedelta
from rest_framework import status, generics, permissions, serializers

@api_view(['GET'])
def home(request):
    return Response({
        "status": "online",
        "message": "Welcome to the Noctra REST API",
        "endpoints": {
            "news": "/news"
        }
    })

@api_view(['GET'])
def news(request):
    # Get articles from the last 24 hours
    last_24_hours = timezone.now() - timedelta(hours=24)
    articles = NewsArticle.objects.filter(date__gte=last_24_hours).order_by('-date')
    
    serializer = NewsArticleSerializer(articles, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def error_404(request, exception=None):
    return Response({"error": "Endpoint not found"}, status=404)
