from django.urls import path
from apps.social.upload_views import CooksnapUploadView

urlpatterns = [
    path('reviews/<int:review_id>/cooksnap/', CooksnapUploadView.as_view(), name='cooksnap-upload'),
]
