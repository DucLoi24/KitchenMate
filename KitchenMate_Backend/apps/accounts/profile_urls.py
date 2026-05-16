"""
URL patterns cho account profile endpoints.
"""
from django.urls import path

from .views import (
    MeView,
    ChangePasswordView,
    UserPublicProfileView,
    UserRecipesView,
    UserStatsView,
    UserSearchView,
    FollowUserView,
    UserFollowersView,
    UserFollowingView,
)

app_name = 'accounts_profile'

urlpatterns = [
    path('me/', MeView.as_view(), name='me'),
    path('me/change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('search/', UserSearchView.as_view(), name='user-search'),
    path('<uuid:pk>/', UserPublicProfileView.as_view(), name='public-profile'),
    path('<uuid:pk>/follow/', FollowUserView.as_view(), name='follow-user'),
    path('<uuid:pk>/followers/', UserFollowersView.as_view(), name='user-followers'),
    path('<uuid:pk>/following/', UserFollowingView.as_view(), name='user-following'),
    path('<uuid:pk>/recipes/', UserRecipesView.as_view(), name='user-recipes'),
    path('<uuid:pk>/stats/', UserStatsView.as_view(), name='user-stats'),
]
