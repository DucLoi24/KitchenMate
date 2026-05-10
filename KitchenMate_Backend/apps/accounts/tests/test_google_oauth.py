"""
Unit Tests — Google OAuth Endpoint (Phase 01, Wave 3)
Test token exchange, user creation, blocked user scenarios.
"""
import pytest
from unittest.mock import patch, MagicMock
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()
GOOGLE_URL = '/api/auth/google/'


@pytest.mark.unit
@pytest.mark.django_db
class TestGoogleOAuthMissingCode:
    """Tests for missing code parameter."""

    def test_missing_code_returns_400(self, api_client):
        """POST without code body returns HTTP 400."""
        response = api_client.post(GOOGLE_URL, {}, format='json')
        assert response.status_code == 400
        assert response.data['success'] is False
        assert 'Thiếu mã xác thực Google' in response.data['error']['message']


@pytest.mark.unit
@pytest.mark.django_db
class TestGoogleOAuthInvalidCode:
    """Tests for invalid code (Google API error)."""

    @patch('apps.accounts.views.requests.post')
    def test_invalid_code_returns_400(self, mock_post, api_client):
        """Google API error on token exchange returns HTTP 400."""
        mock_post.return_value.ok = False
        mock_post.return_value.text = 'invalid_grant'

        response = api_client.post(GOOGLE_URL, {'code': 'invalid-code'}, format='json')
        assert response.status_code == 400
        assert response.data['success'] is False

    @patch('apps.accounts.views.requests.post')
    @patch('apps.accounts.views.id_token.verify_oauth2_token')
    def test_google_returns_error_returns_400(self, mock_verify, mock_post, api_client):
        """Token exchange succeeds but Google verification fails returns HTTP 400."""
        mock_post.return_value.ok = True
        mock_post.return_value.json.return_value = {'id_token': 'mock-id-token'}
        mock_verify.side_effect = ValueError('Token verification failed')

        response = api_client.post(GOOGLE_URL, {'code': 'some-code'}, format='json')
        assert response.status_code == 400
        assert response.data['success'] is False


@pytest.mark.unit
@pytest.mark.django_db
class TestGoogleOAuthBlockedUser:
    """Tests for blocked user scenarios."""

    @patch('apps.accounts.views.requests.post')
    @patch('apps.accounts.views.id_token.verify_oauth2_token')
    def test_blocked_user_returns_403(self, mock_verify, mock_post, api_client):
        """User with is_active=False returns HTTP 403."""
        # Create blocked user with matching google_user_id
        User.objects.create_user(
            username='blocked@example.com',
            email='blocked@example.com',
            full_name='Blocked User',
            password='pass123',
            google_user_id='google-123',
            is_google_user=True,
            is_active=False,
        )

        mock_verify.return_value = {
            'sub': 'google-123',
            'email': 'blocked@example.com',
            'name': 'Blocked User',
        }
        mock_post.return_value.ok = True
        mock_post.return_value.json.return_value = {'id_token': 'valid-token'}

        response = api_client.post(GOOGLE_URL, {'code': 'valid-code'}, format='json')
        assert response.status_code == 403
        assert response.data['success'] is False
        assert 'bị khóa' in response.data['error']['message']


@pytest.mark.unit
@pytest.mark.django_db
class TestGoogleOAuthNewUser:
    """Tests for new user creation on first Google login."""

    @patch('apps.accounts.views.requests.post')
    @patch('apps.accounts.views.id_token.verify_oauth2_token')
    def test_new_user_created(self, mock_verify, mock_post, api_client):
        """First Google login creates new user with correct fields."""
        mock_verify.return_value = {
            'sub': 'google-456',
            'email': 'newuser@example.com',
            'name': 'New Google User',
            'picture': 'https://example.com/avatar.jpg',
        }
        mock_post.return_value.ok = True
        mock_post.return_value.json.return_value = {'id_token': 'valid-id-token'}

        response = api_client.post(GOOGLE_URL, {
            'code': 'valid-code',
            'redirect_uri': 'http://localhost:8000/api/auth/google/callback/',
        }, format='json')

        assert response.status_code == 200
        assert response.data['success'] is True
        assert response.data['is_new_user'] is True

        user = User.objects.get(email='newuser@example.com')
        assert user.google_user_id == 'google-456'
        assert user.is_google_user is True
        assert user.full_name == 'New Google User'
        assert user.avatar_url == 'https://example.com/avatar.jpg'

    @patch('apps.accounts.views.requests.post')
    @patch('apps.accounts.views.id_token.verify_oauth2_token')
    def test_jwt_returned(self, mock_verify, mock_post, api_client):
        """Valid Google code returns HTTP 200 with access and refresh tokens."""
        mock_verify.return_value = {
            'sub': 'google-789',
            'email': 'jwtuser@example.com',
            'name': 'JWT User',
        }
        mock_post.return_value.ok = True
        mock_post.return_value.json.return_value = {'id_token': 'valid-id-token'}

        response = api_client.post(GOOGLE_URL, {'code': 'valid-code'}, format='json')

        assert response.status_code == 200
        assert response.data['success'] is True
        assert 'access' in response.data['data']['tokens']
        assert 'refresh' in response.data['data']['tokens']
        assert 'user' in response.data['data']


@pytest.mark.unit
@pytest.mark.django_db
class TestGoogleOAuthExistingUser:
    """Tests for existing user scenarios."""

    @patch('apps.accounts.views.requests.post')
    @patch('apps.accounts.views.id_token.verify_oauth2_token')
    def test_existing_user_returned(self, mock_verify, mock_post, api_client):
        """Existing user with matching google_user_id returns same user (no recreation)."""
        existing_user = User.objects.create_user(
            username='existing@example.com',
            email='existing@example.com',
            full_name='Existing User',
            password='pass123',
            google_user_id='google-existing',
            is_google_user=True,
        )

        mock_verify.return_value = {
            'sub': 'google-existing',
            'email': 'existing@example.com',
            'name': 'Existing User',
        }
        mock_post.return_value.ok = True
        mock_post.return_value.json.return_value = {'id_token': 'valid-token'}

        response = api_client.post(GOOGLE_URL, {'code': 'valid-code'}, format='json')

        assert response.status_code == 200
        assert response.data['is_new_user'] is False
        user_data = response.data['data']['user']
        assert user_data['email'] == 'existing@example.com'

    @patch('apps.accounts.views.requests.post')
    @patch('apps.accounts.views.id_token.verify_oauth2_token')
    def test_email_linked(self, mock_verify, mock_post, api_client):
        """Existing user with same email gets google_user_id linked."""
        User.objects.create_user(
            username='linkuser@example.com',
            email='linkuser@example.com',
            full_name='Link User',
            password='pass123',
        )

        mock_verify.return_value = {
            'sub': 'google-link',
            'email': 'linkuser@example.com',
            'name': 'Link User',
        }
        mock_post.return_value.ok = True
        mock_post.return_value.json.return_value = {'id_token': 'valid-token'}

        response = api_client.post(GOOGLE_URL, {'code': 'valid-code'}, format='json')

        assert response.status_code == 200
        assert response.data['is_new_user'] is False

        user = User.objects.get(email='linkuser@example.com')
        assert user.google_user_id == 'google-link'
        assert user.is_google_user is True
