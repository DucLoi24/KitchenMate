"""
conftest.py — Shared fixtures cho toàn bộ test suite Phase 11.
"""
import os
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')


def pytest_configure(config):
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')


User = get_user_model()


@pytest.fixture
def api_client():
    """Trả về DRF APIClient chưa xác thực."""
    return APIClient()


@pytest.fixture
def auth_user(db, api_client):
    """Tạo user thường và gắn credentials vào api_client."""
    user = User.objects.create_user(
        username='testuser@example.com',
        email='testuser@example.com',
        full_name='Test User',
        password='testpass123',
    )
    api_client.force_authenticate(user=user)
    return user


@pytest.fixture
def admin_user(db):
    """Tạo user với is_staff=True."""
    user = User.objects.create_user(
        username='admin@example.com',
        email='admin@example.com',
        full_name='Admin User',
        password='adminpass123',
        is_staff=True,
    )
    return user


@pytest.fixture
def sample_ingredient(db):
    """Tạo dict gồm 4 ingredient: PROTEIN, CARB, VEG, STAPLE."""
    from apps.ingredients.models import Ingredient
    protein = Ingredient.objects.create(name='Thịt bò', category='PROTEIN', status='APPROVED')
    carb = Ingredient.objects.create(name='Gạo', category='CARB', status='APPROVED')
    veg = Ingredient.objects.create(name='Rau cải', category='VEG', status='APPROVED')
    staple = Ingredient.objects.create(name='Muối', category='STAPLE', status='APPROVED')
    return {
        'PROTEIN': protein,
        'CARB': carb,
        'VEG': veg,
        'STAPLE': staple,
    }


@pytest.fixture
def sample_recipe(db, auth_user, sample_ingredient):
    """Tạo Recipe PRIVATE thuộc auth_user, có RecipeIngredient."""
    from apps.recipes.models import Recipe, RecipeIngredient
    recipe = Recipe.objects.create(
        user=auth_user,
        title='Công thức test',
        description='Mô tả test',
        difficulty='EASY',
        prep_time=30,
        visibility='PRIVATE',
    )
    RecipeIngredient.objects.create(
        recipe=recipe,
        ingredient=sample_ingredient['PROTEIN'],
        quantity=200,
        unit='gram',
    )
    return recipe


@pytest.fixture
def sample_pantry(db, auth_user, sample_ingredient):
    """Tạo Pantry item cho auth_user với ingredient PROTEIN."""
    from apps.kitchen.models import Pantry
    pantry = Pantry.objects.create(
        user=auth_user,
        ingredient=sample_ingredient['PROTEIN'],
        quantity=500,
        unit='gram',
    )
    return pantry
