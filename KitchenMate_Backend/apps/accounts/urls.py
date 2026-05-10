"""
URL patterns cho accounts app.
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    MeView,
    ChangePasswordView,
    UserPublicProfileView,
    ForgotPasswordView,
    ResetPasswordView,
    GoogleOAuthView,
    GoogleOAuthCallbackView,
)

app_name = 'accounts'

urlpatterns = [
    # Auth
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    path('google/', GoogleOAuthView.as_view(), name='google-auth'),
    path('google/callback/', GoogleOAuthCallbackView.as_view(), name='google-auth-callback'),
]
