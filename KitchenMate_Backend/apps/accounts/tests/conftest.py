"""
conftest.py — Fixtures cho accounts app tests.
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()


@pytest.fixture
def api_client():
    """Trả về DRF APIClient chưa xác thực."""
    return APIClient()
