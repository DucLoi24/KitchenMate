"""
Property-Based Tests cho FileValidator.
Sử dụng Hypothesis để kiểm tra các invariants.
"""
import io
import pytest
import django
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

from hypothesis import given, settings as h_settings, HealthCheck
from hypothesis import strategies as st
from django.core.exceptions import ValidationError

from core.utils.file_validator import FileValidator


def make_fake_file(name: str, size: int = 100):
    """Tạo file-like object giả với tên và size cho trước."""
    content = b'x' * size
    f = io.BytesIO(content)
    f.name = name
    f.seek(0)
    return f


# ============================================================
# Property 1: Extension không hợp lệ luôn bị reject
# ============================================================

INVALID_EXTENSIONS = [
    'gif', 'bmp', 'tiff', 'svg', 'ico', 'heic', 'avif',
    'pdf', 'doc', 'docx', 'txt', 'csv', 'xml', 'json',
    'mp4', 'avi', 'mov', 'mp3', 'wav', 'zip', 'rar',
    'exe', 'sh', 'py', 'js', 'html', 'css', 'php',
]


@given(ext=st.sampled_from(INVALID_EXTENSIONS))
@h_settings(suppress_health_check=[HealthCheck.function_scoped_fixture])
def test_invalid_extension_always_rejected(ext):
    """
    ∀ extension không thuộc {jpg, jpeg, png, webp}
    → FileValidator._check_extension() phải raise ValidationError

    **Validates: Requirements 3.1, 3.2**
    """
    validator = FileValidator()
    filename = f"testfile.{ext}"
    with pytest.raises(ValidationError):
        validator._check_extension(filename)


@given(
    name=st.text(
        alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd')),
        min_size=1, max_size=10
    ),
    ext=st.sampled_from(INVALID_EXTENSIONS)
)
@h_settings(suppress_health_check=[HealthCheck.function_scoped_fixture])
def test_invalid_extension_with_random_name_always_rejected(name, ext):
    """
    ∀ filename với extension không hợp lệ → luôn bị reject

    **Validates: Requirements 3.1, 3.2**
    """
    validator = FileValidator()
    filename = f"{name}.{ext}"
    with pytest.raises(ValidationError):
        validator._check_extension(filename)


# ============================================================
# Property 2: File > 5MB luôn bị reject
# ============================================================

MAX_SIZE = 5 * 1024 * 1024  # 5MB


@given(size=st.integers(min_value=MAX_SIZE + 1, max_value=MAX_SIZE + 10 * 1024 * 1024))
@h_settings(suppress_health_check=[HealthCheck.function_scoped_fixture])
def test_oversized_file_always_rejected(size):
    """
    ∀ file_size > 5MB → FileValidator._check_file_size() phải raise ValidationError

    **Validates: Requirements 4.1**
    """
    validator = FileValidator()
    fake_file = make_fake_file('test.jpg', size)
    with pytest.raises(ValidationError):
        validator._check_file_size(fake_file)


# ============================================================
# Property 3: File ≤ 5MB luôn được chấp nhận (về size)
# ============================================================

@given(size=st.integers(min_value=1, max_value=MAX_SIZE))
@h_settings(suppress_health_check=[HealthCheck.function_scoped_fixture])
def test_valid_size_always_accepted(size):
    """
    ∀ file_size ∈ [1, 5MB] → FileValidator._check_file_size() không raise exception

    **Validates: Requirements 4.2, 4.3**
    """
    validator = FileValidator()
    fake_file = make_fake_file('test.jpg', size)
    # Không raise exception
    validator._check_file_size(fake_file)
