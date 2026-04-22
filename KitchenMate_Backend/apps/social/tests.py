"""
Property-based tests cho social app.
Feature: phase-4-api-endpoints
"""
import uuid
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from hypothesis import given, settings
from hypothesis import strategies as st
from hypothesis.extra.django import TestCase as HypothesisTestCase

from apps.recipes.models import Recipe
from .models import Review, Collection, CollectionRecipe

User = get_user_model()


def make_user():
    email = f'user_{uuid.uuid4().hex[:8]}@test.com'
    return User.objects.create_user(username=email, email=email, full_name='Test', password='pass123')


def make_recipe(user, visibility='PUBLIC'):
    return Recipe.objects.create(user=user, title=f'Recipe {uuid.uuid4().hex[:6]}', visibility=visibility)


def make_review(user, recipe, rating=5):
    return Review.objects.create(user=user, recipe=recipe, rating=rating)


def make_collection(user, name=None):
    return Collection.objects.create(user=user, name=name or f'Col {uuid.uuid4().hex[:4]}')


# Feature: phase-4-api-endpoints, Property 19: Reviews list thuoc dung recipe
class ReviewsListPropertyTest(HypothesisTestCase):
    """Property 19: GET /api/social/recipes/{recipe_id}/reviews/ chi tra ve reviews cua recipe do."""

    @given(
        review_count=st.integers(min_value=1, max_value=5),
        other_review_count=st.integers(min_value=1, max_value=3),
    )
    @settings(max_examples=20, deadline=None)
    def test_reviews_belong_to_correct_recipe(self, review_count, other_review_count):
        """
        Tat ca reviews trong response phai co recipe = recipe_id trong URL.
        """
        owner = make_user()
        recipe = make_recipe(owner, 'PUBLIC')
        other_recipe = make_recipe(owner, 'PUBLIC')

        for _ in range(review_count):
            reviewer = make_user()
            make_review(reviewer, recipe)

        for _ in range(other_review_count):
            reviewer = make_user()
            make_review(reviewer, other_recipe)

        client = APIClient()
        response = client.get(f'/api/social/recipes/{recipe.pk}/reviews/')
        self.assertEqual(response.status_code, 200)

        results = response.data['data']['results']
        self.assertEqual(len(results), review_count)
        for review in results:
            self.assertEqual(str(review['recipe']), str(recipe.pk))

    @settings(max_examples=10)
    def test_duplicate_review_returns_400(self):
        """Mot user chi duoc review mot recipe mot lan."""
        owner = make_user()
        reviewer = make_user()
        recipe = make_recipe(owner, 'PUBLIC')
        make_review(reviewer, recipe, rating=4)

        client = APIClient()
        client.force_authenticate(user=reviewer)
        response = client.post(
            f'/api/social/recipes/{recipe.pk}/reviews/',
            {'rating': 5},
            format='json'
        )
        self.assertEqual(response.status_code, 400)


# Feature: phase-4-api-endpoints, Property 20: Collection data isolation giua users
class CollectionIsolationPropertyTest(HypothesisTestCase):
    """Property 20: GET /api/social/collections/ chi tra ve collections cua user hien tai."""

    @given(
        user1_cols=st.integers(min_value=1, max_value=4),
        user2_cols=st.integers(min_value=1, max_value=4),
    )
    @settings(max_examples=20, deadline=None)
    def test_collection_isolation_between_users(self, user1_cols, user2_cols):
        """
        Moi user chi thay collections cua chinh ho.
        """
        user1 = make_user()
        user2 = make_user()

        for _ in range(user1_cols):
            make_collection(user1)
        for _ in range(user2_cols):
            make_collection(user2)

        client = APIClient()

        client.force_authenticate(user=user1)
        resp1 = client.get('/api/social/collections/')
        self.assertEqual(resp1.status_code, 200)
        results1 = resp1.data['data']['results']
        self.assertEqual(len(results1), user1_cols)

        client.force_authenticate(user=user2)
        resp2 = client.get('/api/social/collections/')
        self.assertEqual(resp2.status_code, 200)
        results2 = resp2.data['data']['results']
        self.assertEqual(len(results2), user2_cols)
