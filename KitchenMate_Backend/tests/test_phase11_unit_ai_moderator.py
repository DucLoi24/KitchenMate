"""
Unit Tests — AI Moderation Service (Phase 11)
Kiểm tra moderate_text() với mock Ollama — không gọi Ollama thật.
"""
import pytest
from unittest.mock import patch, MagicMock

from core.services.ai_moderator import (
    moderate_text,
    ModerationTimeoutError,
    ModerationServiceError,
)


@pytest.mark.unit
class TestModerateTextEmptyInput:
    """Tests cho input rỗng và whitespace — không gọi Ollama."""

    def test_empty_string_returns_suspect_without_calling_ollama(self):
        """Input rỗng '' → 'SUSPECT', mock không được gọi."""
        with patch('core.services.ai_moderator.requests.post') as mock_post:
            result = moderate_text('')
            assert result == 'SUSPECT'
            mock_post.assert_not_called()

    def test_whitespace_only_returns_suspect_without_calling_ollama(self):
        """Input chỉ whitespace '   ' → 'SUSPECT', mock không được gọi."""
        with patch('core.services.ai_moderator.requests.post') as mock_post:
            result = moderate_text('   ')
            assert result == 'SUSPECT'
            mock_post.assert_not_called()

    def test_newline_only_returns_suspect_without_calling_ollama(self):
        """Input chỉ newline → 'SUSPECT', mock không được gọi."""
        with patch('core.services.ai_moderator.requests.post') as mock_post:
            result = moderate_text('\n\t\r')
            assert result == 'SUSPECT'
            mock_post.assert_not_called()


@pytest.mark.unit
class TestModerateTextNormalization:
    """Tests cho normalize response từ Ollama."""

    def _make_mock_response(self, response_text):
        """Helper tạo mock response từ Ollama."""
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {'response': response_text}
        return mock_resp

    def test_garbage_response_fallback_to_suspect(self):
        """Ollama trả về 'GARBAGE' → fallback 'SUSPECT'."""
        with patch('core.services.ai_moderator.requests.post') as mock_post:
            mock_post.return_value = self._make_mock_response('GARBAGE')
            result = moderate_text('Công thức nấu phở')
            assert result == 'SUSPECT'

    def test_lowercase_yes_normalized_to_yes(self):
        """Ollama trả về 'yes' → normalize thành 'YES'."""
        with patch('core.services.ai_moderator.requests.post') as mock_post:
            mock_post.return_value = self._make_mock_response('yes')
            result = moderate_text('Công thức nấu phở')
            assert result == 'YES'

    def test_mixed_case_yes_normalized_to_yes(self):
        """Ollama trả về 'Yes' → normalize thành 'YES'."""
        with patch('core.services.ai_moderator.requests.post') as mock_post:
            mock_post.return_value = self._make_mock_response('Yes')
            result = moderate_text('Công thức nấu phở')
            assert result == 'YES'

    def test_yes_with_trailing_space_normalized(self):
        """Ollama trả về 'YES ' (trailing space) → normalize thành 'YES'."""
        with patch('core.services.ai_moderator.requests.post') as mock_post:
            mock_post.return_value = self._make_mock_response('YES ')
            result = moderate_text('Công thức nấu phở')
            assert result == 'YES'

    def test_no_response_normalized(self):
        """Ollama trả về 'no' → normalize thành 'NO'."""
        with patch('core.services.ai_moderator.requests.post') as mock_post:
            mock_post.return_value = self._make_mock_response('no')
            result = moderate_text('Nội dung xấu')
            assert result == 'NO'

    def test_suspect_response_normalized(self):
        """Ollama trả về 'suspect' → normalize thành 'SUSPECT'."""
        with patch('core.services.ai_moderator.requests.post') as mock_post:
            mock_post.return_value = self._make_mock_response('suspect')
            result = moderate_text('Nội dung mơ hồ')
            assert result == 'SUSPECT'


@pytest.mark.unit
class TestModerateTextErrorHandling:
    """Tests cho error handling khi Ollama lỗi."""

    def test_timeout_raises_moderation_timeout_error(self):
        """Ollama timeout → raise ModerationTimeoutError."""
        import requests as req_lib
        with patch('core.services.ai_moderator.requests.post') as mock_post:
            mock_post.side_effect = req_lib.exceptions.Timeout('Connection timed out')
            with pytest.raises(ModerationTimeoutError):
                moderate_text('Công thức nấu phở')

    def test_http_500_raises_moderation_service_error(self):
        """Ollama HTTP 500 → raise ModerationServiceError."""
        with patch('core.services.ai_moderator.requests.post') as mock_post:
            mock_resp = MagicMock()
            mock_resp.status_code = 500
            mock_resp.text = 'Internal Server Error'
            mock_post.return_value = mock_resp
            with pytest.raises(ModerationServiceError):
                moderate_text('Công thức nấu phở')

    def test_connection_error_raises_moderation_service_error(self):
        """Ollama connection refused → raise ModerationServiceError."""
        import requests as req_lib
        with patch('core.services.ai_moderator.requests.post') as mock_post:
            mock_post.side_effect = req_lib.exceptions.ConnectionError('Connection refused')
            with pytest.raises(ModerationServiceError):
                moderate_text('Công thức nấu phở')


@pytest.mark.unit
class TestModerateTextPromptContent:
    """Tests cho nội dung prompt gửi tới Ollama."""

    def test_input_text_appears_in_prompt_verbatim(self):
        """Prompt chứa nguyên văn input text (không bị truncate)."""
        input_text = 'Đây là công thức nấu phở bò đặc biệt với nhiều gia vị thơm ngon'
        with patch('core.services.ai_moderator.requests.post') as mock_post:
            mock_resp = MagicMock()
            mock_resp.status_code = 200
            mock_resp.json.return_value = {'response': 'YES'}
            mock_post.return_value = mock_resp

            moderate_text(input_text)

            # Kiểm tra prompt được gửi chứa nguyên văn input text
            call_args = mock_post.call_args
            payload = call_args[1]['json'] if 'json' in call_args[1] else call_args[0][1]
            assert input_text in payload['prompt'], "Input text phải xuất hiện nguyên vẹn trong prompt"

    def test_uses_settings_ollama_base_url(self):
        """Sử dụng settings.OLLAMA_BASE_URL (không hardcode)."""
        from django.conf import settings
        with patch('core.services.ai_moderator.requests.post') as mock_post:
            mock_resp = MagicMock()
            mock_resp.status_code = 200
            mock_resp.json.return_value = {'response': 'YES'}
            mock_post.return_value = mock_resp

            moderate_text('Test text')

            call_args = mock_post.call_args
            url = call_args[0][0] if call_args[0] else call_args[1].get('url', '')
            base_url = getattr(settings, 'OLLAMA_BASE_URL', 'http://localhost:11434')
            assert base_url in url, f"URL phải chứa OLLAMA_BASE_URL: {base_url}"

    def test_uses_settings_ollama_model(self):
        """Sử dụng settings.OLLAMA_MODEL trong payload."""
        from django.conf import settings
        with patch('core.services.ai_moderator.requests.post') as mock_post:
            mock_resp = MagicMock()
            mock_resp.status_code = 200
            mock_resp.json.return_value = {'response': 'YES'}
            mock_post.return_value = mock_resp

            moderate_text('Test text')

            call_args = mock_post.call_args
            payload = call_args[1]['json'] if 'json' in call_args[1] else call_args[0][1]
            model = getattr(settings, 'OLLAMA_MODEL', 'gemma4:e2b')
            assert payload['model'] == model, f"Model phải là {model}"

    def test_uses_settings_ollama_timeout(self):
        """Sử dụng settings.OLLAMA_TIMEOUT làm timeout."""
        from django.conf import settings
        with patch('core.services.ai_moderator.requests.post') as mock_post:
            mock_resp = MagicMock()
            mock_resp.status_code = 200
            mock_resp.json.return_value = {'response': 'YES'}
            mock_post.return_value = mock_resp

            moderate_text('Test text')

            call_args = mock_post.call_args
            timeout = call_args[1].get('timeout')
            expected_timeout = getattr(settings, 'OLLAMA_TIMEOUT', 30)
            assert timeout == expected_timeout, f"Timeout phải là {expected_timeout}"
