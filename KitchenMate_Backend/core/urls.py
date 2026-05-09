"""
URL Configuration cho KitchenMate Backend
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),

    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # Authentication
    path('api/auth/', include('apps.accounts.urls')),

    # Account / Profile
    path('api/accounts/', include('apps.accounts.profile_urls')),

    # Account Upload (Avatar)
    path('api/accounts/', include('apps.accounts.upload_urls')),

    # Ingredients
    path('api/ingredients/', include('apps.ingredients.urls')),

    # Recipes
    path('api/recipes/', include('apps.recipes.urls')),

    # Recipe Upload (Thumbnail + Step Media)
    path('api/recipes/', include('apps.recipes.upload_urls')),

    # Kitchen (Pantry + ShoppingList)
    path('api/kitchen/', include('apps.kitchen.urls')),

    # Recommendations
    path('api/recommendations/', include('apps.kitchen.recommendation_urls')),

    # Social (Reviews + Collections)
    path('api/social/', include('apps.social.urls')),

    # Social Upload (Cooksnap)
    path('api/social/', include('apps.social.upload_urls')),

    # Reports - User endpoints
    path('api/reports/', include('apps.reports.urls')),

    # Notifications
    path('api/notifications/', include('apps.reports.notification_urls')),

    # Reports - Admin endpoints
    path('api/admin/reports/', include('apps.reports.admin_urls')),

    # Admin Panel
    path('api/admin/', include('apps.admin_panel.urls')),
]

# Serve media files trong development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
