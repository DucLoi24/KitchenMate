"""
MediaUploadService — orchestrate toàn bộ luồng upload:
validate → process → save → update DB → delete old file.
"""
import uuid
import logging
import os
from django.conf import settings

from core.utils.file_validator import FileValidator
from core.utils.image_processor import ImageProcessor

logger = logging.getLogger(__name__)


class MediaUploadService:
    """
    Service xử lý upload media cho tất cả loại: avatar, thumbnail, step, cooksnap.
    Orchestrate: validate → process → save → update model → delete old file.
    """

    def __init__(self):
        self.validator = FileValidator()
        self.processor = ImageProcessor()

    def upload_avatar(self, user, file) -> str:
        """
        Upload avatar cho user. Xóa file cũ nếu tồn tại.

        Returns:
            str: Relative URL '/media/avatars/{uuid}.jpg'
        """
        self.validator.validate(file)
        sizes = settings.IMAGE_SIZES['avatar']
        processed = self.processor.process(
            file,
            max_width=sizes['max_width'],
            max_height=sizes['max_height'],
            quality=sizes['quality']
        )
        filename = self._generate_unique_filename('jpg')
        relative_path = f'avatars/{filename}'
        self._save_file(relative_path, processed)

        # Xóa file cũ
        self._delete_old_file(user.avatar_url)

        # Cập nhật DB
        user.avatar_url = f'/media/{relative_path}'
        user.save(update_fields=['avatar_url'])

        return user.avatar_url

    def upload_recipe_thumbnail(self, recipe, file) -> str:
        """
        Upload thumbnail cho recipe. Xóa file cũ nếu tồn tại.

        Returns:
            str: Relative URL '/media/recipes/thumbnails/{uuid}.jpg'
        """
        self.validator.validate(file)
        sizes = settings.IMAGE_SIZES['thumbnail']
        processed = self.processor.process(
            file,
            max_width=sizes['max_width'],
            max_height=sizes['max_height'],
            quality=sizes['quality']
        )
        filename = self._generate_unique_filename('jpg')
        relative_path = f'recipes/thumbnails/{filename}'
        self._save_file(relative_path, processed)

        # Xóa file cũ
        self._delete_old_file(recipe.thumbnail_url)

        # Cập nhật DB
        recipe.thumbnail_url = f'/media/{relative_path}'
        recipe.save(update_fields=['thumbnail_url'])

        return recipe.thumbnail_url

    def upload_step_media(self, step, file) -> str:
        """
        Upload media cho recipe step. Xóa file cũ nếu tồn tại.

        Returns:
            str: Relative URL '/media/recipes/steps/{uuid}.jpg'
        """
        self.validator.validate(file)
        sizes = settings.IMAGE_SIZES['step']
        processed = self.processor.process(
            file,
            max_width=sizes['max_width'],
            max_height=sizes['max_height'],
            quality=sizes['quality']
        )
        filename = self._generate_unique_filename('jpg')
        relative_path = f'recipes/steps/{filename}'
        self._save_file(relative_path, processed)

        # Xóa file cũ
        self._delete_old_file(step.media_url)

        # Cập nhật DB
        step.media_url = f'/media/{relative_path}'
        step.save(update_fields=['media_url'])

        return step.media_url

    def upload_cooksnap(self, review, file) -> str:
        """
        Upload cooksnap cho review. Xóa file cũ nếu tồn tại.

        Returns:
            str: Relative URL '/media/cooksnaps/{uuid}.jpg'
        """
        self.validator.validate(file)
        sizes = settings.IMAGE_SIZES['cooksnap']
        processed = self.processor.process(
            file,
            max_width=sizes['max_width'],
            max_height=sizes['max_height'],
            quality=sizes['quality']
        )
        filename = self._generate_unique_filename('jpg')
        relative_path = f'cooksnaps/{filename}'
        self._save_file(relative_path, processed)

        # Xóa file cũ
        self._delete_old_file(review.cooksnap_url)

        # Cập nhật DB
        review.cooksnap_url = f'/media/{relative_path}'
        review.save(update_fields=['cooksnap_url'])

        return review.cooksnap_url

    def _save_file(self, relative_path: str, content) -> None:
        """Lưu file vào MEDIA_ROOT, tự tạo thư mục nếu chưa có."""
        full_path = os.path.join(settings.MEDIA_ROOT, relative_path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, 'wb') as f:
            f.write(content.read())

    def _delete_old_file(self, url: str | None) -> None:
        """Xóa file cũ trên disk nếu URL tồn tại và file tồn tại."""
        if not url:
            return
        # URL dạng '/media/avatars/xxx.jpg' → path 'avatars/xxx.jpg'
        if url.startswith('/media/'):
            relative_path = url[len('/media/'):]
        else:
            return
        full_path = os.path.join(settings.MEDIA_ROOT, relative_path)
        if os.path.exists(full_path):
            try:
                os.remove(full_path)
            except OSError as e:
                logger.warning(f"Không thể xóa file cũ {full_path}: {e}")

    def _generate_unique_filename(self, ext: str) -> str:
        """Tạo tên file unique dạng {uuid4}.{ext}"""
        return f"{uuid.uuid4()}.{ext}"
