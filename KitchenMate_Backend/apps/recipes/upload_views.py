"""
Upload views cho Recipes — Thumbnail và Step Media upload.
"""
import os
import uuid

from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema

from apps.recipes.models import Recipe, RecipeStep, RecipeStepMedia
from core.utils.file_validator import FileValidator
from core.utils.image_processor import ImageProcessor
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
    Upload ảnh/video minh họa cho bước nấu ăn. Chỉ owner recipe mới được upload.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    image_validator = FileValidator()
    image_processor = ImageProcessor()
    allowed_video_extensions = {'mp4', 'webm', 'mov'}
    allowed_video_content_types = {'video/mp4', 'video/webm', 'video/quicktime'}

    @extend_schema(
        summary="Upload recipe step media",
        description="Upload một hoặc nhiều ảnh/video cho bước nấu ăn. Chỉ owner recipe mới được phép.",
        request={
            'multipart/form-data': {
                'type': 'object',
                'properties': {
                    'file': {'type': 'string', 'format': 'binary'},
                    'files': {'type': 'array', 'items': {'type': 'string', 'format': 'binary'}}
                },
            }
        },
        responses={200: {'type': 'object', 'properties': {'url': {'type': 'string'}, 'media': {'type': 'array'}, 'message': {'type': 'string'}}}},
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

        files = request.FILES.getlist('files')
        single_file = request.FILES.get('file')
        if single_file:
            files.append(single_file)
        if not files:
            return Response(
                {'error': 'Vui lòng chọn file để upload'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            created_media = self._save_media_files(step, files)
            first_url = created_media[0].media_url
            step.media_url = first_url
            step.save(update_fields=['media_url'])
            return Response(
                {
                    'url': first_url,
                    'media': [self._serialize_media(media) for media in created_media],
                    'message': 'Cập nhật media bước thực hiện thành công',
                },
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

    def _save_media_files(self, step, files):
        existing_count = step.media_items.count()
        created_media = []
        for index, file in enumerate(files, start=1):
            media_type = self._validate_step_media(file)
            media_url = self._save_step_media_file(file, media_type)
            created_media.append(RecipeStepMedia.objects.create(
                step=step,
                media_url=media_url,
                media_type=media_type,
                order=existing_count + index,
                original_name=file.name[:255],
            ))
        return created_media

    def _validate_step_media(self, file):
        content_type = getattr(file, 'content_type', '')
        if content_type.startswith('image/'):
            self.image_validator.validate(file)
            return 'IMAGE'
        if content_type in self.allowed_video_content_types:
            self._validate_video_file(file)
            return 'VIDEO'
        raise ValidationError('Chỉ chấp nhận ảnh jpg, png, webp hoặc video mp4, webm, mov')

    def _validate_video_file(self, file):
        ext = file.name.rsplit('.', 1)[-1].lower() if '.' in file.name else ''
        if ext not in self.allowed_video_extensions:
            raise ValidationError('Định dạng video không được hỗ trợ. Chỉ chấp nhận: mp4, webm, mov')

        max_size = getattr(settings, 'VIDEO_UPLOAD_MAX_SIZE', 50 * 1024 * 1024)
        file.seek(0, 2)
        size = file.tell()
        file.seek(0)
        if size > max_size:
            raise ValidationError('Video quá lớn. Kích thước tối đa là 50MB')

        header = file.read(16)
        file.seek(0)
        is_mp4_or_mov = len(header) >= 12 and header[4:8] == b'ftyp'
        is_webm = header.startswith(b'\x1a\x45\xdf\xa3')
        if not (is_mp4_or_mov or is_webm):
            raise ValidationError('File không phải video hợp lệ')

    def _save_step_media_file(self, file, media_type):
        if media_type == 'IMAGE':
            sizes = settings.IMAGE_SIZES['step']
            content = self.image_processor.process(
                file,
                max_width=sizes['max_width'],
                max_height=sizes['max_height'],
                quality=sizes['quality']
            )
            extension = 'jpg'
        else:
            file.seek(0)
            content = file
            extension = file.name.rsplit('.', 1)[-1].lower()

        filename = f'{uuid.uuid4()}.{extension}'
        relative_path = f'recipes/steps/{filename}'
        full_path = os.path.join(settings.MEDIA_ROOT, relative_path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        chunks = content.chunks() if hasattr(content, 'chunks') else iter(lambda: content.read(64 * 1024), b'')
        with open(full_path, 'wb') as target:
            for chunk in chunks:
                target.write(chunk)

        return f'/media/{relative_path}'

    def _serialize_media(self, media):
        return {
            'id': media.id,
            'media_url': media.media_url,
            'media_type': media.media_type,
            'order': media.order,
            'original_name': media.original_name,
        }
