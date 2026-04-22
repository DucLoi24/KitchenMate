"""
AI Moderator service — giao tiếp với Ollama Local LLM để kiểm duyệt nội dung.
"""
import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

# ==============================================================================
# EXCEPTION CLASSES
# ==============================================================================

class ModerationTimeoutError(Exception):
    """Ollama không phản hồi trong thời gian timeout."""
    pass

class ModerationServiceError(Exception):
    """Lỗi kết nối hoặc HTTP error từ Ollama service."""
    pass

# ==============================================================================
# PROMPT TEMPLATE
# ==============================================================================

PROMPT_TEMPLATE = """Bạn là hệ thống kiểm duyệt nội dung cho nền tảng chia sẻ công thức nấu ăn.
Hãy đánh giá văn bản sau và trả lời bằng ĐÚNG MỘT trong ba từ: YES, NO, hoặc SUSPECT.

Tiêu chí:
- YES: Nội dung phù hợp với chủ đề ẩm thực, không vi phạm cộng đồng.
- NO: Nội dung rõ ràng không phù hợp (ngôn từ thô tục, nội dung độc hại, hoàn toàn không liên quan đến ẩm thực).
- SUSPECT: Nội dung mơ hồ, cần Admin xem xét thêm.

Chỉ trả về đúng một từ, không giải thích, không thêm ký tự nào khác.

Văn bản cần kiểm duyệt:
{text}"""

# ==============================================================================
# INTERNAL HELPERS
# ==============================================================================

def _build_prompt(text: str) -> str:
    """Nhúng text vào Prompt_Template tiếng Việt."""
    return PROMPT_TEMPLATE.format(text=text)

def _call_ollama(prompt: str) -> str:
    """
    Gọi HTTP POST tới Ollama API, trả về raw response text.
    Raise ModerationTimeoutError nếu timeout.
    Raise ModerationServiceError nếu HTTP error hoặc connection refused.
    """
    base_url = getattr(settings, 'OLLAMA_BASE_URL', 'http://localhost:11434')
    model = getattr(settings, 'OLLAMA_MODEL', 'gemma4:e2b')
    timeout = getattr(settings, 'OLLAMA_TIMEOUT', 30)
    url = f"{base_url}/api/generate"
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
    }
    try:
        response = requests.post(url, json=payload, timeout=timeout)
    except requests.exceptions.Timeout as e:
        logger.error("Ollama timeout sau %ds: %s", timeout, str(e))
        raise ModerationTimeoutError(f"Ollama không phản hồi trong {timeout}s: {e}") from e
    except requests.exceptions.ConnectionError as e:
        logger.error("Connection refused tới Ollama: %s", str(e))
        raise ModerationServiceError(f"Không thể kết nối tới Ollama: {e}") from e

    if response.status_code != 200:
        logger.error("Ollama service error (HTTP %d): %s", response.status_code, response.text)
        raise ModerationServiceError(
            f"Ollama trả về HTTP {response.status_code}: {response.text}"
        )

    try:
        data = response.json()
        return data['response']
    except (ValueError, KeyError) as e:
        logger.error("Không thể parse response từ Ollama: %s", str(e))
        raise ModerationServiceError(f"Không thể parse response từ Ollama: {e}") from e


def _normalize_result(raw: str) -> str:
    """
    Strip whitespace, chuyển về chữ hoa, validate.
    Fallback về 'SUSPECT' nếu không khớp YES/NO/SUSPECT.
    """
    normalized = raw.strip().upper()
    if normalized in ('YES', 'NO', 'SUSPECT'):
        return normalized
    return 'SUSPECT'

# ==============================================================================
# PUBLIC INTERFACE
# ==============================================================================

def moderate_text(text: str) -> str:
    """
    Nhận văn bản, trả về "YES", "NO", hoặc "SUSPECT".
    - Nếu text rỗng hoặc chỉ chứa whitespace: trả về "SUSPECT" ngay, không gọi Ollama.
    - Nếu Ollama timeout: raise ModerationTimeoutError.
    - Nếu Ollama lỗi: raise ModerationServiceError.
    """
    if not text or not text.strip():
        return 'SUSPECT'
    prompt = _build_prompt(text)
    raw = _call_ollama(prompt)
    return _normalize_result(raw)
