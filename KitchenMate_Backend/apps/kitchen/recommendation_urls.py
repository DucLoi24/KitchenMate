"""
URL patterns cho Recommendation API.
Mount tai /api/recommendations/
"""
from django.urls import path
from .views import RecommendationView

urlpatterns = [
    path('suggest/', RecommendationView.as_view(), name='recommend-suggest'),
]
