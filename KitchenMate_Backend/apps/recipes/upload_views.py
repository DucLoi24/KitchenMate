"""
Upload views cho Recipes — Thumbnail và Step Media upload.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema

from apps.recipes.models import Recipe, RecipeStep
from core.utils.media_upload_service import MediaUploadService


class RecipeThumbnailUploadView(APIView):
    """
    POST /api/recipes/{recipe_id}/thumbnail/
    Upload thumbnail cho công thức. Chỉ owner mới được upload.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    @extend_schema(
        summary="Upload recipe thumbnail",
        description="Upload ảnh thumbnail cho công thức. Chỉ owner mới được phép. Tối đa 5MB.",
        request={
            'multipart/form-data': {
                'type': 'object',
                'properties': {
                    'file': {'type': 'string', 'format': 'binary'}
                },
                'required': ['file']
            }
        },
        responses={200: {'type': 'object', 'properties': {'url': {'type': 'string'}, 'message': {'type': 'string'}}}},
        tags=['Recipes']
    )
    def post(self, request, recipe_id):
        recipe = get_object_or_404(Recipe, id=recipe_id)

        # Kiểm tra ownership
        if recipe.user != request.user:
            return Response(
                {'error': 'Bạn không có quyền chỉnh sửa công thức này'},
                status=status.HTTP_403_FORBIDDEN
            )

        file = request.FILES.get('file')
        if not file:
            return Response(
                {'error': 'Vui lòng chọn file để upload'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            service = MediaUploadService()
            url = service.upload_recipe_thumbnail(recipe, file)
            return Response(
                {'url': url, 'message': 'Cập nhật thumbnail thành công'},
                status=status.HTTP_200_OK
            )
        except ValidationError as e:
            return Response(
                {'error': e.message if hasattr(e, 'message') else str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception:
            return Response(
                {'error': 'Không thể lưu file. Vui lòng thử lại sau'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class RecipeStepMediaUploadView(APIView):
    """
    POST /api/recipes/{recipe_id}/steps/{step_id}/media/
    Upload ảnh minh họa cho bước nấu ăn. Chỉ owner recipe mới được upload.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    @extend_schema(
        summary="Upload recipe step media",
        description="Upload ảnh minh họa cho bước nấu ăn. Chỉ owner recipe mới được phép. Tối đa 5MB.",
        request={
            'multipart/form-data': {
                'type': 'object',
                'properties': {
                    'file': {'type': 'string', 'format': 'binary'}
                },
                'required': ['file']
            }
        },
        responses={200: {'type': 'object', 'properties': {'url': {'type': 'string'}, 'message': {'type': 'string'}}}},
        tags=['Recipes']
    )
    def post(self, request, recipe_id, step_id):
        recipe = get_object_or_404(Recipe, id=recipe_id)

        # Kiểm tra ownership
        if recipe.user != request.user:
            return Response(
                {'error': 'Bạn không có quyền chỉnh sửa công thức này'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Kiểm tra step thuộc recipe
        step = get_object_or_404(RecipeStep, id=step_id, recipe=recipe)

        file = request.FILES.get('file')
        if not file:
            return Response(
                {'error': 'Vui lòng chọn file để upload'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            service = MediaUploadService()
            url = service.upload_step_media(step, file)
            return Response(
                {'url': url, 'message': 'Cập nhật ảnh bước thực hiện thành công'},
                status=status.HTTP_200_OK
            )
        except ValidationError as e:
            return Response(
                {'error': e.message if hasattr(e, 'message') else str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception:
            return Response(
                {'error': 'Không thể lưu file. Vui lòng thử lại sau'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
