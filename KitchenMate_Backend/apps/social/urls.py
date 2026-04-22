"""
URL patterns cho social app.
Reviews long trong recipe: /api/social/recipes/{recipe_pk}/reviews/
Collections: /api/social/collections/
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import ReviewViewSet, CollectionViewSet

# Router cho collections
router = DefaultRouter()
router.register(r'collections', CollectionViewSet, basename='collection')

# Router cho reviews (nested duoi recipe)
review_router = DefaultRouter()
review_router.register(r'reviews', ReviewViewSet, basename='review')

urlpatterns = [
    path('', include(router.urls)),
    # /api/social/recipes/{recipe_pk}/reviews/
    path('recipes/<uuid:recipe_pk>/', include(review_router.urls)),
    # Update/delete review truc tiep theo id: /api/social/reviews/{pk}/
    path('reviews/<int:pk>/update/', ReviewViewSet.as_view({'put': 'update', 'patch': 'partial_update'}), name='review-update'),
    path('reviews/<int:pk>/delete/', ReviewViewSet.as_view({'delete': 'destroy'}), name='review-delete'),
]
