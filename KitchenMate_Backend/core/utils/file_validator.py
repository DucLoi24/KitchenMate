"""
FileValidator — kiểm tra extension, MIME type (magic bytes qua Pillow), và file size.
"""
import io
from PIL import Image
from django.core.exceptions import ValidationError
from django.conf import settings


class FileValidator:
    """
    Validate file upload: extension, MIME type thực sự (magic bytes), và file size.
    Raise ValidationError với message tiếng Việt nếu file không hợp lệ.
    """

    ALLOWED_TYPES: set = {'image/jpeg', 'image/png', 'image/webp'}
    ALLOWED_EXTENSIONS: set = getattr(settings, 'ALLOWED_IMAGE_EXTENSIONS', {'jpg', 'jpeg', 'png', 'webp'})
    MAX_FILE_SIZE: int = getattr(settings, 'IMAGE_UPLOAD_MAX_SIZE', 5 * 1024 * 1024)

    def validate(self, file) -> None:
        """
        Validate toàn bộ: extension → file size → MIME type.
        Raise ValidationError nếu bất kỳ check nào thất bại.
        """
        self._check_extension(file.name)
        self._check_file_size(file)
        self._check_mime_type(file)

    def _check_extension(self, filename: str) -> None:
        """Kiểm tra extension của filename có trong whitelist không."""
        ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
        if ext not in self.ALLOWED_EXTENSIONS:
            raise ValidationError(
                "Định dạng file không được hỗ trợ. Chỉ chấp nhận: jpg, png, webp"
            )

    def _check_mime_type(self, file) -> None:
        """
        Kiểm tra MIME type thực sự bằng cách mở file với Pillow (magic bytes).
        Không tin vào Content-Type header hay extension.
        """
        try:
            file.seek(0)
            img = Image.open(file)
            img.verify()  # verify không decode toàn bộ ảnh, chỉ check header
            file.seek(0)  # reset lại sau khi verify
            # Kiểm tra format có trong whitelist
            allowed_formats = {'JPEG', 'PNG', 'WEBP'}
            if img.format not in allowed_formats:
                raise ValidationError(
                    "Định dạng file không được hỗ trợ. Chỉ chấp nhận: jpg, png, webp"
                )
        except ValidationError:
            raise
        except Exception:
            raise ValidationError(
                "File không phải ảnh hợp lệ. Chỉ chấp nhận: jpg, png, webp"
            )

    def _check_file_size(self, file) -> None:
        """Kiểm tra file size không vượt quá MAX_FILE_SIZE."""
        # Lấy size từ file object
        file.seek(0, 2)  # seek đến cuối file
        size = file.tell()
        file.seek(0)  # reset về đầu
        if size > self.MAX_FILE_SIZE:
            raise ValidationError(
                "File quá lớn. Kích thước tối đa là 5MB"
            )
