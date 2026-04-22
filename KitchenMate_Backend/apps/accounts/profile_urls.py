"""
URL patterns cho account profile endpoints.
"""
from django.urls import path

from .views import MeView, ChangePasswordView, UserPublicProfileView, UserRecipesView, UserStatsView

app_name = 'accounts_profile'

urlpatterns = [
    path('me/', MeView.as_view(), name='me'),
    path('me/change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('<uuid:pk>/', UserPublicProfileView.as_view(), name='public-profile'),
    path('<uuid:pk>/recipes/', UserRecipesView.as_view(), name='user-recipes'),
    path('<uuid:pk>/stats/', UserStatsView.as_view(), name='user-stats'),
]
