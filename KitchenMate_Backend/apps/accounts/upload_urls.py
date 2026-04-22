from django.urls import path
from apps.accounts.upload_views import AvatarUploadView

urlpatterns = [
    path('me/avatar/', AvatarUploadView.as_view(), name='avatar-upload'),
]
