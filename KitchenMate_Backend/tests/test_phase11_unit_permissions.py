"""
Unit Tests — Permissions (Phase 11)
Kiểm tra custom permission classes mà không cần HTTP thật.
Dùng MockRequest và mock object.
"""
import pytest
from unittest.mock import MagicMock
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser

from core.permissions import IsOwnerOrReadOnly, IsOwner, IsAdminUser

User = get_user_model()


class MockRequest:
    """Mock request object để test permissions mà không cần HTTP thật."""
    def __init__(self, method='GET', user=None):
        self.method = method
        self.user = user or AnonymousUser()


class MockObject:
    """Mock object có thuộc tính user."""
    def __init__(self, user):
        self.user = user


@pytest.mark.unit
class TestIsOwnerOrReadOnlyHasPermission:
    """Tests cho IsOwnerOrReadOnly.has_permission()."""

    def test_unauthenticated_get_returns_true(self):
        """Unauthenticated + GET → True (safe method)."""
        perm = IsOwnerOrReadOnly()
        request = MockRequest(method='GET', user=AnonymousUser())
        assert perm.has_permission(request, None) is True

    def test_unauthenticated_post_returns_false(self):
        """Unauthenticated + POST → False."""
        perm = IsOwnerOrReadOnly()
        request = MockRequest(method='POST', user=AnonymousUser())
        assert perm.has_permission(request, None) is False

    def test_unauthenticated_put_returns_false(self):
        """Unauthenticated + PUT → False."""
        perm = IsOwnerOrReadOnly()
        request = MockRequest(method='PUT', user=AnonymousUser())
        assert perm.has_permission(request, None) is False

    def test_unauthenticated_delete_returns_false(self):
        """Unauthenticated + DELETE → False."""
        perm = IsOwnerOrReadOnly()
        request = MockRequest(method='DELETE', user=AnonymousUser())
        assert perm.has_permission(request, None) is False

    def test_all_safe_methods_return_true_for_unauthenticated(self):
        """GET, HEAD, OPTIONS → True cho unauthenticated user."""
        perm = IsOwnerOrReadOnly()
        for method in ('GET', 'HEAD', 'OPTIONS'):
            request = MockRequest(method=method, user=AnonymousUser())
            assert perm.has_permission(request, None) is True, f"{method} phải trả về True"

    def test_authenticated_post_returns_true(self):
        """Authenticated + POST → True."""
        perm = IsOwnerOrReadOnly()
        user = MagicMock()
        user.is_authenticated = True
        request = MockRequest(method='POST', user=user)
        assert perm.has_permission(request, None) is True


@pytest.mark.unit
class TestIsOwnerOrReadOnlyHasObjectPermission:
    """Tests cho IsOwnerOrReadOnly.has_object_permission()."""

    def test_owner_put_returns_true(self):
        """Owner + PUT → True."""
        perm = IsOwnerOrReadOnly()
        user = MagicMock()
        user.is_authenticated = True
        obj = MockObject(user=user)
        request = MockRequest(method='PUT', user=user)
        assert perm.has_object_permission(request, None, obj) is True

    def test_non_owner_put_returns_false(self):
        """Non-owner + PUT → False."""
        perm = IsOwnerOrReadOnly()
        owner = MagicMock()
        other_user = MagicMock()
        obj = MockObject(user=owner)
        request = MockRequest(method='PUT', user=other_user)
        assert perm.has_object_permission(request, None, obj) is False

    def test_get_always_returns_true(self):
        """GET → True bất kể ownership."""
        perm = IsOwnerOrReadOnly()
        owner = MagicMock()
        other_user = MagicMock()
        obj = MockObject(user=owner)
        request = MockRequest(method='GET', user=other_user)
        assert perm.has_object_permission(request, None, obj) is True


@pytest.mark.unit
class TestIsOwnerHasObjectPermission:
    """Tests cho IsOwner.has_object_permission()."""

    def test_owner_returns_true(self):
        """Owner → True."""
        perm = IsOwner()
        user = MagicMock()
        obj = MockObject(user=user)
        request = MockRequest(method='GET', user=user)
        assert perm.has_object_permission(request, None, obj) is True

    def test_non_owner_returns_false(self):
        """Non-owner → False."""
        perm = IsOwner()
        owner = MagicMock()
        other_user = MagicMock()
        obj = MockObject(user=owner)
        request = MockRequest(method='GET', user=other_user)
        assert perm.has_object_permission(request, None, obj) is False


@pytest.mark.unit
class TestIsAdminUserHasPermission:
    """Tests cho IsAdminUser.has_permission()."""

    def test_staff_user_returns_true(self):
        """is_staff=True → True."""
        perm = IsAdminUser()
        user = MagicMock()
        user.is_authenticated = True
        user.is_staff = True
        request = MockRequest(method='GET', user=user)
        assert perm.has_permission(request, None) is True

    def test_non_staff_user_returns_false(self):
        """is_staff=False → False."""
        perm = IsAdminUser()
        user = MagicMock()
        user.is_authenticated = True
        user.is_staff = False
        request = MockRequest(method='GET', user=user)
        assert perm.has_permission(request, None) is False

    def test_unauthenticated_returns_false(self):
        """Unauthenticated → False."""
        perm = IsAdminUser()
        request = MockRequest(method='GET', user=AnonymousUser())
        assert perm.has_permission(request, None) is False
