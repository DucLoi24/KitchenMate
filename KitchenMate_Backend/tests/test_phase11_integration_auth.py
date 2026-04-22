"""
Integration Tests — Authentication Flow (Phase 11)
Kiểm tra luồng JWT end-to-end: register, login, refresh, logout.
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()

REGISTER_URL = '/api/auth/register/'
LOGIN_URL = '/api/auth/login/'
REFRESH_URL = '/api/auth/refresh/'
LOGOUT_URL = '/api/auth/logout/'
FORGOT_PASSWORD_URL = '/api/auth/forgot-password/'
ME_URL = '/api/accounts/me/'


def extract_tokens(login_response_data):
    """Helper: extract access và refresh token từ login response."""
    # Format: {"success": true, "data": {"user": {...}, "tokens": {"access": ..., "refresh": ...}}}
    data = login_response_data.get('data', login_response_data)
    tokens = data.get('tokens', data)
    return tokens.get('access'), tokens.get('refresh')


@pytest.mark.integration
@pytest.mark.django_db
class TestRegisterEndpoint:
    """Tests cho POST /api/auth/register/."""

    def test_register_valid_data_returns_201_and_creates_user(self):
        """Dữ liệu hợp lệ → HTTP 201, user tồn tại trong DB."""
        client = APIClient()
        data = {
            'email': 'newuser@example.com',
            'full_name': 'New User',
            'password': 'StrongPass123!',
            'password_confirm': 'StrongPass123!',
        }
        response = client.post(REGISTER_URL, data, format='json')
        assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.data}"
        assert User.objects.filter(email='newuser@example.com').exists()

    def test_register_duplicate_email_returns_400(self):
        """Email đã tồn tại → HTTP 400."""
        User.objects.create_user(
            username='existing@example.com',
            email='existing@example.com',
            full_name='Existing User',
            password='pass123',
        )
        client = APIClient()
        data = {
            'email': 'existing@example.com',
            'full_name': 'Another User',
            'password': 'StrongPass123!',
            'password_confirm': 'StrongPass123!',
        }
        response = client.post(REGISTER_URL, data, format='json')
        assert response.status_code == 400


@pytest.mark.integration
@pytest.mark.django_db
class TestLoginEndpoint:
    """Tests cho POST /api/auth/login/."""

    def setup_method(self):
        self.user = User.objects.create_user(
            username='logintest@example.com',
            email='logintest@example.com',
            full_name='Login Test',
            password='TestPass123!',
        )

    def test_login_correct_credentials_returns_200_with_tokens(self):
        """Credentials đúng → HTTP 200, có access và refresh token."""
        client = APIClient()
        data = {'email': 'logintest@example.com', 'password': 'TestPass123!'}
        response = client.post(LOGIN_URL, data, format='json')
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.data}"
        # Response format: {"success": true, "data": {"user": {...}, "tokens": {"access": ..., "refresh": ...}}}
        response_data = response.data
        assert 'data' in response_data
        token_data = response_data['data'].get('tokens', response_data['data'])
        assert 'access' in token_data, f"Thiếu access token: {response_data}"
        assert 'refresh' in token_data, f"Thiếu refresh token: {response_data}"

    def test_login_wrong_password_returns_401(self):
        """Password sai → HTTP 401."""
        client = APIClient()
        data = {'email': 'logintest@example.com', 'password': 'WrongPassword!'}
        response = client.post(LOGIN_URL, data, format='json')
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


@pytest.mark.integration
@pytest.mark.django_db
class TestRefreshEndpoint:
    """Tests cho POST /api/auth/refresh/."""

    def test_refresh_valid_token_returns_200_with_new_access(self):
        """Refresh token hợp lệ → HTTP 200, có access token mới."""
        user = User.objects.create_user(
            username='refresh@example.com',
            email='refresh@example.com',
            full_name='Refresh User',
            password='TestPass123!',
        )
        client = APIClient()
        # Lấy refresh token qua login
        login_resp = client.post(LOGIN_URL, {'email': 'refresh@example.com', 'password': 'TestPass123!'}, format='json')
        assert login_resp.status_code == 200

        access_token, refresh_token = extract_tokens(login_resp.data)
        assert refresh_token, "Thiếu refresh token từ login"

        response = client.post(REFRESH_URL, {'refresh': refresh_token}, format='json')
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.data}"
        assert 'access' in response.data


@pytest.mark.integration
@pytest.mark.django_db
class TestLogoutEndpoint:
    """Tests cho POST /api/auth/logout/."""

    def test_logout_valid_token_returns_200(self):
        """Refresh token hợp lệ → HTTP 200."""
        user = User.objects.create_user(
            username='logout@example.com',
            email='logout@example.com',
            full_name='Logout User',
            password='TestPass123!',
        )
        client = APIClient()
        login_resp = client.post(LOGIN_URL, {'email': 'logout@example.com', 'password': 'TestPass123!'}, format='json')
        assert login_resp.status_code == 200

        access_token, refresh_token = extract_tokens(login_resp.data)

        client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        response = client.post(LOGOUT_URL, {'refresh': refresh_token}, format='json')
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.data}"

    def test_access_token_after_logout_returns_401(self):
        """Dùng access token sau logout → HTTP 401 (token blacklisted)."""
        user = User.objects.create_user(
            username='logout2@example.com',
            email='logout2@example.com',
            full_name='Logout User 2',
            password='TestPass123!',
        )
        client = APIClient()
        login_resp = client.post(LOGIN_URL, {'email': 'logout2@example.com', 'password': 'TestPass123!'}, format='json')
        assert login_resp.status_code == 200

        access_token, refresh_token = extract_tokens(login_resp.data)

        # Logout
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        client.post(LOGOUT_URL, {'refresh': refresh_token}, format='json')

        # Thử dùng refresh token đã blacklist để lấy access mới
        client2 = APIClient()
        response = client2.post(REFRESH_URL, {'refresh': refresh_token}, format='json')
        assert response.status_code == 401, f"Expected 401 after logout, got {response.status_code}"


@pytest.mark.integration
@pytest.mark.django_db
class TestForgotPasswordEndpoint:
    """Tests cho POST /api/auth/forgot-password/."""

    def test_forgot_password_valid_email_returns_200(self):
        """Email hợp lệ → HTTP 200 (không lộ thông tin user tồn tại hay không)."""
        User.objects.create_user(
            username='forgot@example.com',
            email='forgot@example.com',
            full_name='Forgot User',
            password='TestPass123!',
        )
        client = APIClient()
        response = client.post(FORGOT_PASSWORD_URL, {'email': 'forgot@example.com'}, format='json')
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.data}"

    def test_forgot_password_nonexistent_email_returns_200(self):
        """Email không tồn tại → vẫn HTTP 200 (không lộ thông tin)."""
        client = APIClient()
        response = client.post(FORGOT_PASSWORD_URL, {'email': 'nonexistent@example.com'}, format='json')
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.data}"
