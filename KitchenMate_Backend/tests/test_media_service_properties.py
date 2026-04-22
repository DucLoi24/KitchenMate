"""
Property-Based Tests cho MediaUploadService._generate_unique_filename().
Kiểm tra uniqueness invariant.
"""
import pytest
import re
from hypothesis import given, settings as h_settings, HealthCheck
from hypothesis import strategies as st

from core.utils.media_upload_service import MediaUploadService


# ============================================================
# Property 6: Unique filename không bao giờ trùng
# ============================================================

@given(
    ext=st.sampled_from(['jpg', 'png', 'webp']),
    n=st.integers(min_value=2, max_value=50)
)
@h_settings(suppress_health_check=[HealthCheck.function_scoped_fixture])
def test_generated_filenames_are_unique(ext, n):
    """
    ∀ n lần gọi _generate_unique_filename(ext):
    tất cả n tên file phải khác nhau

    **Validates: Requirements 10.2**
    """
    service = MediaUploadService()
    filenames = [service._generate_unique_filename(ext) for _ in range(n)]
    assert len(filenames) == len(set(filenames)), (
        f"Phát hiện tên file trùng trong {n} lần generate"
    )


@given(ext=st.sampled_from(['jpg', 'png', 'webp']))
@h_settings(suppress_health_check=[HealthCheck.function_scoped_fixture])
def test_generated_filename_format(ext):
    """
    ∀ ext: filename phải có format {uuid4}.{ext}

    **Validates: Requirements 10.1**
    """
    service = MediaUploadService()
    filename = service._generate_unique_filename(ext)

    # Kiểm tra format: uuid4.ext
    uuid_pattern = r'^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.' + re.escape(ext) + r'$'
    assert re.match(uuid_pattern, filename), (
        f"Filename '{filename}' không đúng format {{uuid4}}.{ext}"
    )
