"""
Property-based tests tong quat — Response format va Pagination.
Feature: phase-4-api-endpoints
"""
import uuid
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from hypothesis import given, settings
from hypothesis import strategies as st
from hypothesis.extra.django import TestCase as HypothesisTestCase

from apps.recipes.models import Recipe
from apps.ingredients.models import Ingredient

User = get_user_model()


def make_user():
    email = f'user_{uuid.uuid4().hex[:8]}@test.com'
    return User.objects.create_user(username=email, email=email, full_name='Test', password='pass123')


# Feature: phase-4-api-endpoints, Property 21: Response format nhat quan
class ResponseFormatPropertyTest(HypothesisTestCase):
    """Property 21: Moi response thanh cong phai co success=true va truong data."""

    LIST_ENDPOINTS = [
        '/api/ingredients/',
        '/api/recipes/',
    ]

    @settings(max_examples=10)
    def test_success_responses_have_consistent_format(self):
        """
        Tat ca list endpoint thanh cong phai co success=True va data.
        """
        client = APIClient()
        for endpoint in self.LIST_ENDPOINTS:
            response = client.get(endpoint)
            self.assertIn(response.status_code, [200, 201])
            self.assertIn('success', response.data)
            self.assertTrue(response.data['success'])
            self.assertIn('data', response.data)

    @settings(max_examples=10)
    def test_authenticated_endpoints_have_consistent_format(self):
        """
        Endpoint yeu cau auth cung phai co format nhat quan.
        """
        user = make_user()
        client = APIClient()
        client.force_authenticate(user=user)

        endpoints = [
            '/api/accounts/me/',
            '/api/kitchen/pantry/',
            '/api/kitchen/shopping-list/',
            '/api/social/collections/',
            '/api/recipes/my-recipes/',
        ]
        for endpoint in endpoints:
            response = client.get(endpoint)
            self.assertIn(response.status_code, [200, 201])
            self.assertIn('success', response.data)
            self.assertTrue(response.data['success'])
            self.assertIn('data', response.data)


# Feature: phase-4-api-endpoints, Property 22: Pagination fields day du
class PaginationPropertyTest(HypothesisTestCase):
    """Property 22: Moi list endpoint phai co day du pagination fields."""

    @settings(max_examples=10)
    def test_list_endpoints_have_pagination_fields(self):
        """
        data cua list endpoint phai co count, next, previous, results.
        """
        # Tao du lieu de dam bao co ket qua
        user = make_user()
        Recipe.objects.create(user=user, title='Test Recipe', visibility='PUBLIC')
        Ingredient.objects.create(name=f'ing_{uuid.uuid4().hex[:6]}', status='APPROVED', category='OTHER')

        client = APIClient()
        client.force_authenticate(user=user)

        list_endpoints = [
            '/api/ingredients/',
            '/api/recipes/',
            '/api/kitchen/pantry/',
            '/api/kitchen/shopping-list/',
            '/api/social/collections/',
            '/api/recipes/my-recipes/',
        ]

        for endpoint in list_endpoints:
            response = client.get(endpoint)
            self.assertEqual(response.status_code, 200, f'Failed for {endpoint}')
            data = response.data.get('data', {})
            self.assertIn('count', data, f'Missing count in {endpoint}')
            self.assertIn('next', data, f'Missing next in {endpoint}')
            self.assertIn('previous', data, f'Missing previous in {endpoint}')
            self.assertIn('results', data, f'Missing results in {endpoint}')
