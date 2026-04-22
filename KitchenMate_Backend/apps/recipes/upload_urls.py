from django.urls import path
from apps.recipes.upload_views import RecipeThumbnailUploadView, RecipeStepMediaUploadView

urlpatterns = [
    path('<uuid:recipe_id>/thumbnail/', RecipeThumbnailUploadView.as_view(), name='recipe-thumbnail-upload'),
    path('<uuid:recipe_id>/steps/<int:step_id>/media/', RecipeStepMediaUploadView.as_view(), name='recipe-step-media-upload'),
]
