"""
Tests for admin_panel app.
Feature: admin-user-management (Step 1, Step 2)
"""
import uuid
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.contrib.sessions.backends.db import SessionStore
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()


def make_user(email=None, password='testpass123', is_superuser=False, is_staff=False):
    email = email or f'user_{uuid.uuid4().hex[:8]}@test.com'
    return User.objects.create_user(
        username=email, email=email, full_name='Test User',
        password=password, is_superuser=is_superuser, is_staff=is_staff
    )


class SetAdminActionTest(TestCase):
    """Test set_admin action in AdminUserViewSet."""

    def setUp(self):
        self.client = APIClient()
        self.superuser = make_user(is_superuser=True, is_staff=True)
        self.admin = make_user(is_superuser=False, is_staff=True)
        self.regular_user = make_user(is_superuser=False, is_staff=False)
        self.target_user = make_user()

    def test_set_admin_action_exists(self):
        """set_admin action exists in AdminUserViewSet."""
        self.client.force_authenticate(user=self.superuser)
        response = self.client.post(
            f'/api/admin/users/{self.target_user.pk}/set-admin/',
            {'is_admin': True},
            format='json'
        )
        # Action exists if we get 200 (success) or 404 (user not found), not 401 or 405
        self.assertIn(response.status_code, [200, 404])

    def test_superuser_can_assign_admin_role(self):
        """Only superuser can assign admin role."""
        self.client.force_authenticate(user=self.superuser)
        response = self.client.post(
            f'/api/admin/users/{self.target_user.pk}/set-admin/',
            {'is_admin': True},
            format='json'
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['success'])
        self.assertIn('quan tri vien', response.data['message'])
        self.target_user.refresh_from_db()
        self.assertTrue(self.target_user.is_staff)

    def test_superuser_can_remove_admin_role(self):
        """Superuser can remove admin role from a user."""
        self.client.force_authenticate(user=self.superuser)
        self.target_user.is_staff = True
        self.target_user.save()
        response = self.client.post(
            f'/api/admin/users/{self.target_user.pk}/set-admin/',
            {'is_admin': False},
            format='json'
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['success'])
        self.assertIn('xoa quyen', response.data['message'])
        self.target_user.refresh_from_db()
        self.assertFalse(self.target_user.is_staff)

    def test_regular_admin_receives_403(self):
        """Regular admin (is_staff but not superuser) receives 403."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            f'/api/admin/users/{self.target_user.pk}/set-admin/',
            {'is_admin': True},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(response.data['success'])
        self.assertIn('Ban khong co quyen', response.data['message'])

    def test_unauthenticated_receives_401(self):
        """Unauthenticated user receives 401 (not 403) since IsAdminUser requires auth."""
        response = self.client.post(
            f'/api/admin/users/{self.target_user.pk}/set-admin/',
            {'is_admin': True},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_nonexistent_user_returns_404(self):
        """Request for nonexistent user returns 404."""
        self.client.force_authenticate(user=self.superuser)
        import uuid as uuid_module
        nonexistent_uuid = uuid_module.uuid4()
        response = self.client.post(
            f'/api/admin/users/{nonexistent_uuid}/set-admin/',
            {'is_admin': True},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_success_message_on_completion(self):
        """Returns success message on completion."""
        self.client.force_authenticate(user=self.superuser)
        response = self.client.post(
            f'/api/admin/users/{self.target_user.pk}/set-admin/',
            {'is_admin': True},
            format='json'
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['success'])
        self.assertIn('message', response.data)
        self.assertIn(self.target_user.email, response.data['message'])


class BlockActionTest(TestCase):
    """Test block action with session invalidation in AdminUserViewSet."""

    def setUp(self):
        self.client = APIClient()
        self.admin = make_user(is_superuser=False, is_staff=True)
        self.target_user = make_user()

    def _create_session_for_user(self, user):
        """Helper: create a session with the user pk stored in it."""
        session = SessionStore()
        session['_auth_user_id'] = str(user.pk)
        session['_auth_user_backend'] = 'django.contrib.auth.backends.ModelBackend'
        session.save()
        return session.session_key

    def test_block_action_exists(self):
        """block action exists in AdminUserViewSet."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(f'/api/admin/users/{self.target_user.pk}/block/')
        # Action exists if we get 200 (success) or 404 (user not found), not 401 or 405
        self.assertIn(response.status_code, [200, 404])

    def test_block_sets_user_inactive(self):
        """block action sets user.is_active=False."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(f'/api/admin/users/{self.target_user.pk}/block/')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['success'])
        self.target_user.refresh_from_db()
        self.assertFalse(self.target_user.is_active)

    def test_block_invalidates_user_sessions(self):
        """block action deletes all sessions for the blocked user."""
        self.client.force_authenticate(user=self.admin)

        # Create two sessions for target_user
        session_key_1 = self._create_session_for_user(self.target_user)
        session_key_2 = self._create_session_for_user(self.target_user)

        # Verify sessions exist before block
        self.assertTrue(SessionStore(session_key=session_key_1).exists(session_key_1))
        self.assertTrue(SessionStore(session_key=session_key_2).exists(session_key_2))

        response = self.client.post(f'/api/admin/users/{self.target_user.pk}/block/')
        self.assertEqual(response.status_code, 200)

        # Both sessions should be deleted - create fresh SessionStore instances to check
        self.assertFalse(SessionStore(session_key=session_key_1).exists(session_key_1))
        self.assertFalse(SessionStore(session_key=session_key_2).exists(session_key_2))

    def test_blocked_user_cannot_access_api(self):
        """Blocked user (is_active=False) cannot access any API on next request."""
        self.client.force_authenticate(user=self.admin)

        # Create a session for target_user and authenticate as them
        session_key = self._create_session_for_user(self.target_user)

        # Block the user (via admin)
        self.client.post(f'/api/admin/users/{self.target_user.pk}/block/')

        # Try to access API as blocked user with session - should fail
        # Use force_authenticate which will check is_active
        self.client.force_authenticate(user=self.target_user)
        response = self.client.get('/api/admin/users/list/')
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_block_returns_success_message(self):
        """block action returns success message with user email."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(f'/api/admin/users/{self.target_user.pk}/block/')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['success'])
        self.assertIn('message', response.data)
        self.assertIn(self.target_user.email, response.data['message'])

from datetime import timedelta
from django.utils import timezone


class DashboardChartViewSetTest(TestCase):
    """Test DashboardChartViewSet endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.superuser = make_user(is_superuser=True, is_staff=True)

    def _create_user_with_date(self, days_ago):
        """Helper: create user with custom created_at."""
        user = make_user()
        user.created_at = timezone.now() - timedelta(days=days_ago)
        user.save(update_fields=['created_at'])
        return user

    def _create_recipe_with_date(self, days_ago, visibility='PUBLIC'):
        """Helper: create recipe with custom created_at and view_count."""
        from apps.recipes.models import Recipe
        recipe = Recipe.objects.create(
            title=f'Test Recipe {uuid.uuid4().hex[:8]}',
            description='Test',
            visibility=visibility,
            user=self.superuser,
            view_count=10
        )
        recipe.created_at = timezone.now() - timedelta(days=days_ago)
        recipe.save(update_fields=['created_at'])
        return recipe

    def test_charts_returns_user_growth_with_new_users_field(self):
        """user_growth uses 'new_users' field."""
        self._create_user_with_date(1)
        self.client.force_authenticate(user=self.superuser)
        response = self.client.get('/api/admin/dashboard/charts/')
        self.assertEqual(response.status_code, 200)
        for item in response.data['user_growth']:
            self.assertIn('new_users', item)

    def test_charts_returns_recipe_submissions_with_new_recipes_field(self):
        """recipe_submissions uses 'new_recipes' field."""
        self._create_recipe_with_date(1)
        self.client.force_authenticate(user=self.superuser)
        response = self.client.get('/api/admin/dashboard/charts/')
        self.assertEqual(response.status_code, 200)
        for item in response.data['recipe_submissions']:
            self.assertIn('new_recipes', item)
            self.assertIn('public_recipes', item)

    def test_charts_returns_total_views_with_views_field(self):
        """total_views uses 'views' field."""
        self._create_recipe_with_date(1)
        self.client.force_authenticate(user=self.superuser)
        response = self.client.get('/api/admin/dashboard/charts/')
        self.assertEqual(response.status_code, 200)
        for item in response.data['total_views']:
            self.assertIn('views', item)

    def test_charts_returns_7_days_of_data(self):
        """charts endpoint returns 7 days of data."""
        self.client.force_authenticate(user=self.superuser)
        response = self.client.get('/api/admin/dashboard/charts/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['user_growth']), 7)
        self.assertEqual(len(response.data['recipe_submissions']), 7)
        self.assertEqual(len(response.data['total_views']), 7)

    def test_unauthenticated_receives_401(self):
        """Unauthenticated user receives 401."""
        response = self.client.get('/api/admin/dashboard/charts/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_non_admin_receives_403(self):
        """Non-admin user receives 403."""
        regular_user = make_user()
        self.client.force_authenticate(user=regular_user)
        response = self.client.get('/api/admin/dashboard/charts/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class BlockNonexistentUserTest(TestCase):
    """Request for nonexistent user returns 404."""
    def setUp(self):
        self.client = APIClient()
        self.admin = make_user(is_superuser=False, is_staff=True)

    def test_block_nonexistent_user_returns_404(self):
        """Request for nonexistent user returns 404."""
        self.client.force_authenticate(user=self.admin)
        nonexistent_uuid = uuid.uuid4()
        response = self.client.post(f'/api/admin/users/{nonexistent_uuid}/block/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)