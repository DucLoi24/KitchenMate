"""
ImageProcessor — resize và compress ảnh trước khi lưu.
Giữ nguyên aspect ratio, không upscale ảnh nhỏ.
"""
import io
from PIL import Image


class ImageProcessor:
    """
    Xử lý ảnh: resize về max dimensions (giữ aspect ratio, không upscale),
    convert sang RGB nếu cần, compress với quality cho trước.
    """

    def process(
        self,
        file,
        max_width: int,
        max_height: int,
        quality: int = 85,
        output_format: str = 'JPEG'
    ) -> io.BytesIO:
        """
        Resize và compress ảnh.

        Args:
            file: InMemoryUploadedFile hoặc file-like object
            max_width: Chiều rộng tối đa
            max_height: Chiều cao tối đa
            quality: Chất lượng nén (1-95), mặc định 85
            output_format: Format output, mặc định 'JPEG'

        Returns:
            BytesIO chứa ảnh đã xử lý
        """
        file.seek(0)
        img = Image.open(file)

        # Convert RGBA hoặc P (palette) sang RGB để lưu JPEG
        if img.mode in ('RGBA', 'P', 'LA'):
            # Tạo background trắng cho ảnh có transparency
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
            img = background
        elif img.mode != 'RGB':
            img = img.convert('RGB')

        # Tính kích thước mới
        new_width, new_height = self._get_resize_dimensions(
            img.width, img.height, max_width, max_height
        )

        # Chỉ resize nếu cần (không upscale)
        if new_width != img.width or new_height != img.height:
            img = img.resize((new_width, new_height), Image.LANCZOS)

        # Lưu vào BytesIO
        output = io.BytesIO()
        img.save(output, format=output_format, quality=quality, optimize=True)
        output.seek(0)
        return output

    def _get_resize_dimensions(
        self,
        original_width: int,
        original_height: int,
        max_width: int,
        max_height: int
    ) -> tuple:
        """
        Tính kích thước mới giữ nguyên aspect ratio.
        Không upscale ảnh nhỏ hơn max dimensions.

        Returns:
            tuple (new_width, new_height)
        """
        # Nếu ảnh đã nhỏ hơn hoặc bằng max, giữ nguyên
        if original_width <= max_width and original_height <= max_height:
            return original_width, original_height

        # Tính tỷ lệ scale để fit trong max_width x max_height
        ratio_w = max_width / original_width
        ratio_h = max_height / original_height
        ratio = min(ratio_w, ratio_h)  # Dùng ratio nhỏ hơn để không vượt quá cả 2 chiều

        # Dùng round() thay vì int() để giảm sai số aspect ratio khi làm tròn pixel
        new_width = max(1, round(original_width * ratio))
        new_height = max(1, round(original_height * ratio))

        # Đảm bảo không vượt quá max (do làm tròn)
        new_width = min(new_width, max_width)
        new_height = min(new_height, max_height)

        return new_width, new_height
