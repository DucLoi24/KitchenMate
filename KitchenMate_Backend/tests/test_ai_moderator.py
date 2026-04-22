"""
Test suite cho core/services/ai_moderator.py
Bao gồm: unit tests (example-based) và property tests (Hypothesis).
"""
import pytest
import requests as requests_lib
from unittest.mock import patch, MagicMock
from hypothesis import given, settings as h_settings
from hypothesis import strategies as st
from django.test import override_settings

from core.services.ai_moderator import (
    moderate_text,
    ModerationTimeoutError,
    ModerationServiceError,
)

# ==============================================================================
# UNIT TESTS — Smoke tests
# ==============================================================================

def test_moderation_timeout_error_is_exception():
    """ModerationTimeoutError phải kế thừa từ Exception."""
    assert issubclass(ModerationTimeoutError, Exception)


def test_moderation_service_error_is_exception():
    """ModerationServiceError phải kế thừa từ Exception."""
    assert issubclass(ModerationServiceError, Exception)


def test_moderate_text_callable():
    """Hàm moderate_text phải tồn tại và có thể gọi được."""
    assert callable(moderate_text)


# ==============================================================================
# UNIT TESTS — Example-based
# ==============================================================================

def test_timeout_raises_moderation_timeout_error():
    """Khi Ollama timeout, phải raise ModerationTimeoutError."""
    with patch('core.services.ai_moderator.requests.post') as mock_post:
        mock_post.side_effect = requests_lib.exceptions.Timeout("timeout")
        with pytest.raises(ModerationTimeoutError):
            moderate_text("test text")


def test_http_500_raises_moderation_service_error():
    """Khi Ollama trả về HTTP 500, phải raise ModerationServiceError."""
    with patch('core.services.ai_moderator.requests.post') as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.text = "Internal Server Error"
        mock_post.return_value = mock_response
        with pytest.raises(ModerationServiceError):
            moderate_text("test text")


def test_connection_refused_raises_moderation_service_error():
    """Khi connection refused, phải raise ModerationServiceError."""
    with patch('core.services.ai_moderator.requests.post') as mock_post:
        mock_post.side_effect = requests_lib.exceptions.ConnectionError("connection refused")
        with pytest.raises(ModerationServiceError):
            moderate_text("test text")


def test_normalize_yes_lowercase():
    """Response 'yes\\n' phải được normalize thành 'YES'."""
    with patch('core.services.ai_moderator.requests.post') as mock_post:
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {'response': 'yes\n'}
        result = moderate_text("test text")
        assert result == 'YES'


def test_normalize_no_with_spaces():
    """Response '  No  ' phải được normalize thành 'NO'."""
    with patch('core.services.ai_moderator.requests.post') as mock_post:
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {'response': '  No  '}
        result = moderate_text("test text")
        assert result == 'NO'


def test_logger_error_called_on_timeout(caplog):
    """logger.error phải được gọi khi có timeout exception."""
    import logging
    with patch('core.services.ai_moderator.requests.post') as mock_post:
        mock_post.side_effect = requests_lib.exceptions.Timeout("timeout")
        with caplog.at_level(logging.ERROR, logger='core.services.ai_moderator'):
            with pytest.raises(ModerationTimeoutError):
                moderate_text("test text")
    assert len(caplog.records) > 0
    assert caplog.records[0].levelno == logging.ERROR


def test_logger_error_called_on_connection_error(caplog):
    """logger.error phải được gọi khi có connection error."""
    import logging
    with patch('core.services.ai_moderator.requests.post') as mock_post:
        mock_post.side_effect = requests_lib.exceptions.ConnectionError("refused")
        with caplog.at_level(logging.ERROR, logger='core.services.ai_moderator'):
            with pytest.raises(ModerationServiceError):
                moderate_text("test text")
    assert len(caplog.records) > 0
    assert caplog.records[0].levelno == logging.ERROR


# ==============================================================================
# PROPERTY TESTS — Hypothesis
# ==============================================================================

@given(text=st.text(min_size=1).filter(lambda t: t.strip()))
@h_settings(max_examples=100)
def test_text_embedded_in_prompt(text):
    """
    # Feature: phase-5-ai-moderation, Property 1: Text nhúng vào prompt
    Với bất kỳ text hợp lệ nào, text phải xuất hiện nguyên vẹn trong prompt gửi tới Ollama.
    Validates: Requirements 2.4
    """
    with patch('core.services.ai_moderator.requests.post') as mock_post:
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {'response': 'YES'}
        moderate_text(text)
        call_args = mock_post.call_args
        assert text in call_args[1]['json']['prompt']


@given(
    text=st.text(min_size=1).filter(lambda t: t.strip()),
    raw_result=st.sampled_from(['YES', 'NO', 'SUSPECT', 'yes', 'no', 'suspect', ' YES ', '\nNO\n'])
)
@h_settings(max_examples=100)
def test_output_always_valid(text, raw_result):
    """
    # Feature: phase-5-ai-moderation, Property 2: Output luôn là giá trị hợp lệ
    Với bất kỳ response hợp lệ nào từ Ollama, output phải là YES, NO, hoặc SUSPECT.
    Validates: Requirements 3.2, 3.3
    """
    with patch('core.services.ai_moderator.requests.post') as mock_post:
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {'response': raw_result}
        result = moderate_text(text)
        assert result in ('YES', 'NO', 'SUSPECT')


@given(
    text=st.text(min_size=1).filter(lambda t: t.strip()),
    invalid_response=st.text().filter(lambda r: r.strip().upper() not in ('YES', 'NO', 'SUSPECT'))
)
@h_settings(max_examples=100)
def test_invalid_response_fallback_suspect(text, invalid_response):
    """
    # Feature: phase-5-ai-moderation, Property 3: Fallback về SUSPECT cho response không hợp lệ
    Khi Ollama trả về response không hợp lệ, moderate_text phải trả về SUSPECT.
    Validates: Requirements 3.4
    """
    with patch('core.services.ai_moderator.requests.post') as mock_post:
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {'response': invalid_response}
        result = moderate_text(text)
        assert result == 'SUSPECT'


@given(text=st.one_of(st.just(''), st.text(alphabet=' \t\n\r', min_size=1)))
@h_settings(max_examples=100)
def test_whitespace_no_api_call(text):
    """
    # Feature: phase-5-ai-moderation, Property 4: Whitespace input không gọi Ollama
    Với input rỗng hoặc chỉ chứa whitespace, moderate_text phải trả về SUSPECT mà không gọi Ollama.
    Validates: Requirements 3.5
    """
    with patch('core.services.ai_moderator.requests.post') as mock_post:
        result = moderate_text(text)
        assert result == 'SUSPECT'
        mock_post.assert_not_called()


@given(
    base_url=st.from_regex(r'http://[\w]+:\d+', fullmatch=True),
    model=st.text(
        min_size=1,
        alphabet=st.characters(
            whitelist_categories=('Lu', 'Ll', 'Nd'),
            whitelist_characters=':.-_'
        )
    ),
    timeout=st.integers(min_value=1, max_value=120)
)
@h_settings(max_examples=100)
def test_settings_override(base_url, model, timeout):
    """
    # Feature: phase-5-ai-moderation, Property 10: Settings override
    AI_Moderator phải sử dụng đúng giá trị từ Django settings thay vì hardcode.
    Validates: Requirements 7.1, 7.2, 7.3, 7.4
    """
    with override_settings(OLLAMA_BASE_URL=base_url, OLLAMA_MODEL=model, OLLAMA_TIMEOUT=timeout):
        with patch('core.services.ai_moderator.requests.post') as mock_post:
            mock_post.return_value.status_code = 200
            mock_post.return_value.json.return_value = {'response': 'YES'}
            moderate_text('test text')
            call_args = mock_post.call_args
            assert call_args[0][0].startswith(base_url)
            assert call_args[1]['json']['model'] == model
            assert call_args[1]['timeout'] == timeout
