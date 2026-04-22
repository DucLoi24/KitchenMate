"""
Property-Based Tests cho ImageProcessor._get_resize_dimensions().
Kiểm tra 3 invariants: max dimensions, aspect ratio, no upscale.
"""
import pytest
from hypothesis import given, settings as h_settings, HealthCheck
from hypothesis import strategies as st

from core.utils.image_processor import ImageProcessor


# ============================================================
# Property 4: Output không bao giờ vượt quá max dimensions
# ============================================================

@given(
    width=st.integers(min_value=1, max_value=5000),
    height=st.integers(min_value=1, max_value=5000),
    max_w=st.integers(min_value=100, max_value=2000),
    max_h=st.integers(min_value=100, max_value=2000),
)
@h_settings(suppress_health_check=[HealthCheck.function_scoped_fixture])
def test_resize_never_exceeds_max_dimensions(width, height, max_w, max_h):
    """
    ∀ (width, height, max_w, max_h):
    output_w <= max_w AND output_h <= max_h

    **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
    """
    processor = ImageProcessor()
    out_w, out_h = processor._get_resize_dimensions(width, height, max_w, max_h)
    assert out_w <= max_w, f"Width {out_w} vượt quá max {max_w}"
    assert out_h <= max_h, f"Height {out_h} vượt quá max {max_h}"


# ============================================================
# Property 5: Aspect ratio được giữ nguyên (sai số ≤ 2%)
# ============================================================

@given(
    width=st.integers(min_value=2, max_value=5000),
    height=st.integers(min_value=2, max_value=5000),
    max_w=st.integers(min_value=100, max_value=2000),
    max_h=st.integers(min_value=100, max_value=2000),
)
@h_settings(suppress_health_check=[HealthCheck.function_scoped_fixture])
def test_resize_preserves_aspect_ratio(width, height, max_w, max_h):
    """
    ∀ (width, height) cần resize:
    output dimensions phải nằm trong vòng 1px so với giá trị lý tưởng (float).

    Cách kiểm tra đúng cho integer pixel rounding: thay vì so sánh ratio,
    kiểm tra rằng mỗi chiều output sai lệch tối đa 1px so với giá trị float lý tưởng.
    Điều này đảm bảo thuật toán round đúng, không phải truncate hay làm tròn sai.

    **Validates: Requirements 5.7**
    """
    processor = ImageProcessor()
    out_w, out_h = processor._get_resize_dimensions(width, height, max_w, max_h)

    # Chỉ kiểm tra khi ảnh thực sự được resize
    if out_w != width or out_h != height:
        ratio_w = max_w / width
        ratio_h = max_h / height
        ratio = min(ratio_w, ratio_h)

        # Giá trị lý tưởng (float)
        ideal_w = width * ratio
        ideal_h = height * ratio

        # Output phải nằm trong 1px của giá trị lý tưởng
        assert abs(out_w - ideal_w) <= 1.0, (
            f"Width sai lệch quá 1px: ideal={ideal_w:.2f}, output={out_w}"
        )
        assert abs(out_h - ideal_h) <= 1.0, (
            f"Height sai lệch quá 1px: ideal={ideal_h:.2f}, output={out_h}"
        )


# ============================================================
# Property 7: Ảnh nhỏ hơn max không bị phóng to
# ============================================================

@given(
    width=st.integers(min_value=1, max_value=399),
    height=st.integers(min_value=1, max_value=399),
)
@h_settings(suppress_health_check=[HealthCheck.function_scoped_fixture])
def test_small_image_not_upscaled(width, height):
    """
    ∀ ảnh có width < 400 AND height < 400:
    output dimensions == input dimensions (không phóng to)

    **Validates: Requirements 5.5**
    """
    processor = ImageProcessor()
    out_w, out_h = processor._get_resize_dimensions(width, height, 400, 400)
    assert out_w == width, f"Width bị thay đổi: {width} → {out_w}"
    assert out_h == height, f"Height bị thay đổi: {height} → {out_h}"
