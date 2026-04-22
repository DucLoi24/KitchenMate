"""
Property-based tests cho accounts app.
Feature: phase-4-api-endpoints
"""
import uuid
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from hypothesis import given, settings, assume
from hypothesis import strategies as st
from hypothesis.extra.django import TestCase as HypothesisTestCase

from apps.recipes.models import Recipe

User = get_user_model()


def make_user(email=None, password='testpass123'):
    email = email or f'user_{uuid.uuid4().hex[:8]}@test.com'
    return User.objects.create_user(
        username=email, email=email, full_name='Test User', password=password
    )


def make_recipe(user, visibility='PUBLIC', title='Test Recipe'):
    return Recipe.objects.create(user=user, title=title, visibility=visibility)


# Feature: phase-4-api-endpoints, Property 2: User recipes chi tra ve PUBLIC
class UserRecipesViewPropertyTest(HypothesisTestCase):
    """Property 2: GET /api/accounts/{id}/recipes/ chi tra ve PUBLIC."""

    @given(
        public_count=st.integers(min_value=0, max_value=5),
        private_count=st.integers(min_value=0, max_value=3),
        pending_count=st.integers(min_value=0, max_value=3),
    )
    @settings(max_examples=30)
    def test_user_recipes_only_returns_public(self, public_count, private_count, pending_count):
        """
        Voi bat ky so luong recipe voi cac visibility khac nhau,
        GET /api/accounts/{id}/recipes/ phai chi tra ve PUBLIC.
        """
        user = make_user()
        client = APIClient()

        for i in range(public_count):
            make_recipe(user, 'PUBLIC', f'Public {i}')
        for i in range(private_count):
            make_recipe(user, 'PRIVATE', f'Private {i}')
        for i in range(pending_count):
            make_recipe(user, 'PENDING', f'Pending {i}')

        response = client.get(f'/api/accounts/{user.pk}/recipes/')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['success'])

        results = response.data['data']['results']
        for recipe in results:
            self.assertEqual(recipe['visibility'], 'PUBLIC')

        self.assertEqual(len(results), public_count)


# Feature: phase-4-api-endpoints, Property 3: User stats recipe_count khop thuc te
class UserStatsViewPropertyTest(HypothesisTestCase):
    """Property 3: recipe_count trong stats phai bang so luong PUBLIC recipe."""

    @given(
        public_count=st.integers(min_value=0, max_value=5),
        private_count=st.integers(min_value=0, max_value=3),
    )
    @settings(max_examples=30)
    def test_user_stats_recipe_count_matches_public(self, public_count, private_count):
        """
        recipe_count phai bang dung so luong cong thuc PUBLIC cua user.
        """
        user = make_user()
        client = APIClient()

        for i in range(public_count):
            make_recipe(user, 'PUBLIC', f'Public {i}')
        for i in range(private_count):
            make_recipe(user, 'PRIVATE', f'Private {i}')

        response = client.get(f'/api/accounts/{user.pk}/stats/')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['recipe_count'], public_count)


# Feature: phase-4-api-endpoints, Property 1: Profile update round-trip
class ProfileUpdateRoundTripTest(HypothesisTestCase):
    """Property 1: PATCH /api/accounts/me/ -> GET /api/accounts/me/ phai tra ve dung du lieu."""

    @given(
        full_name=st.text(min_size=1, max_size=50, alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd', 'Zs'))),
        bio=st.text(min_size=0, max_size=200),
    )
    @settings(max_examples=30)
    def test_profile_update_round_trip(self, full_name, bio):
        """
        Sau khi PATCH profile, GET lai phai tra ve dung du lieu da cap nhat.
        """
        assume(full_name.strip())
        # DRF CharField mac dinh trim_whitespace=True, nen bo qua bio chi co whitespace
        assume(bio == bio.strip())
        user = make_user()
        client = APIClient()
        client.force_authenticate(user=user)

        patch_data = {'full_name': full_name.strip(), 'bio': bio}
        patch_resp = client.patch('/api/accounts/me/', patch_data, format='json')
        self.assertEqual(patch_resp.status_code, 200)

        get_resp = client.get('/api/accounts/me/')
        self.assertEqual(get_resp.status_code, 200)
        self.assertEqual(get_resp.data['data']['full_name'], full_name.strip())
        self.assertEqual(get_resp.data['data']['bio'], bio)
