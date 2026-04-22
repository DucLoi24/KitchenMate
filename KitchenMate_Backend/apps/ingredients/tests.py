"""
Property-based tests cho ingredients app.
Feature: phase-4-api-endpoints
"""
import uuid
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from hypothesis import given, settings, assume
from hypothesis import strategies as st
from hypothesis.extra.django import TestCase as HypothesisTestCase

from .models import Ingredient

User = get_user_model()


def make_user():
    email = f'user_{uuid.uuid4().hex[:8]}@test.com'
    return User.objects.create_user(username=email, email=email, full_name='Test', password='pass123')


def make_ingredient(name, status='APPROVED', category='OTHER', user=None):
    return Ingredient.objects.create(name=name, status=status, category=category, created_by=user)


# Feature: phase-4-api-endpoints, Property 4: Ingredients list chi tra ve APPROVED
class IngredientsListPropertyTest(HypothesisTestCase):
    """Property 4: GET /api/ingredients/ chi tra ve APPROVED."""

    @given(
        approved_count=st.integers(min_value=1, max_value=5),
        pending_count=st.integers(min_value=0, max_value=3),
        rejected_count=st.integers(min_value=0, max_value=3),
    )
    @settings(max_examples=30)
    def test_list_only_returns_approved(self, approved_count, pending_count, rejected_count):
        """
        Voi bat ky tap hop ingredients, list endpoint chi tra ve APPROVED.
        """
        prefix = uuid.uuid4().hex[:6]
        for i in range(approved_count):
            make_ingredient(f'{prefix}_approved_{i}', 'APPROVED')
        for i in range(pending_count):
            make_ingredient(f'{prefix}_pending_{i}', 'PENDING')
        for i in range(rejected_count):
            make_ingredient(f'{prefix}_rejected_{i}', 'REJECTED')

        client = APIClient()
        response = client.get('/api/ingredients/')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['success'])

        results = response.data['data']['results']
        for item in results:
            self.assertEqual(item['status'], 'APPROVED')


# Feature: phase-4-api-endpoints, Property 5: Search ingredients — ket qua phai APPROVED va chua keyword
class IngredientsSearchPropertyTest(HypothesisTestCase):
    """Property 5: Search chi tra ve APPROVED va chua keyword."""

    @given(keyword=st.text(min_size=2, max_size=8, alphabet='abcdefghijklmnopqrstuvwxyz'))
    @settings(max_examples=20)
    def test_search_returns_approved_with_keyword(self, keyword):
        """
        Tat ca ket qua search phai co status=APPROVED va name chua keyword.
        """
        prefix = uuid.uuid4().hex[:4]
        make_ingredient(f'{prefix}_{keyword}_approved', 'APPROVED')
        make_ingredient(f'{prefix}_{keyword}_pending', 'PENDING')

        client = APIClient()
        response = client.get(f'/api/ingredients/search/?q={keyword}')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['success'])

        for item in response.data['data']:
            self.assertEqual(item['status'], 'APPROVED')
            self.assertIn(keyword.lower(), item['name'].lower())

    def test_search_empty_q_returns_empty_list(self):
        """Neu q rong, tra ve danh sach rong."""
        client = APIClient()
        response = client.get('/api/ingredients/search/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['data'], [])


# Feature: phase-4-api-endpoints, Property 6: Ingredient moi tao co status=PENDING
class IngredientCreatePropertyTest(HypothesisTestCase):
    """Property 6: Ingredient moi tao qua POST phai co status=PENDING."""

    @given(
        name_suffix=st.text(min_size=3, max_size=10, alphabet='abcdefghijklmnopqrstuvwxyz'),
        category=st.sampled_from(['PROTEIN', 'CARB', 'VEG', 'SPICE', 'OTHER']),
    )
    @settings(max_examples=20)
    def test_new_ingredient_has_pending_status(self, name_suffix, category):
        """
        Ingredient tao qua API phai co status=PENDING va created_by=request.user.
        """
        user = make_user()
        client = APIClient()
        client.force_authenticate(user=user)

        name = f'test_{uuid.uuid4().hex[:4]}_{name_suffix}'
        response = client.post('/api/ingredients/', {'name': name, 'category': category}, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['status'], 'PENDING')
        self.assertEqual(response.data['data']['created_by'], user.pk)
