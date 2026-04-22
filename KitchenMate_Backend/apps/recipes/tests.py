"""
Property-based tests cho recipes app.
Feature: phase-4-api-endpoints
"""
import uuid
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from hypothesis import given, settings, assume
from hypothesis import strategies as st
from hypothesis.extra.django import TestCase as HypothesisTestCase

from apps.ingredients.models import Ingredient
from .models import Recipe, RecipeIngredient

User = get_user_model()


def make_user():
    email = f'user_{uuid.uuid4().hex[:8]}@test.com'
    return User.objects.create_user(username=email, email=email, full_name='Test', password='pass123')


def make_recipe(user, visibility='PUBLIC'):
    return Recipe.objects.create(user=user, title=f'Recipe {uuid.uuid4().hex[:6]}', visibility=visibility)


def make_ingredient(name=None, category='OTHER'):
    name = name or f'ing_{uuid.uuid4().hex[:6]}'
    return Ingredient.objects.create(name=name, status='APPROVED', category=category)


# Feature: phase-4-api-endpoints, Property 7: Recipes list chi tra ve PUBLIC
class RecipesListPropertyTest(HypothesisTestCase):
    """Property 7: GET /api/recipes/ chi tra ve PUBLIC."""

    @given(
        public_count=st.integers(min_value=1, max_value=5),
        private_count=st.integers(min_value=0, max_value=3),
        pending_count=st.integers(min_value=0, max_value=3),
    )
    @settings(max_examples=30, deadline=None)
    def test_list_only_returns_public(self, public_count, private_count, pending_count):
        user = make_user()
        for _ in range(public_count):
            make_recipe(user, 'PUBLIC')
        for _ in range(private_count):
            make_recipe(user, 'PRIVATE')
        for _ in range(pending_count):
            make_recipe(user, 'PENDING')

        client = APIClient()
        response = client.get('/api/recipes/')
        self.assertEqual(response.status_code, 200)
        results = response.data['data']['results']
        for r in results:
            self.assertEqual(r['visibility'], 'PUBLIC')


# Feature: phase-4-api-endpoints, Property 8: Recipe moi tao co visibility=PRIVATE
class RecipeCreatePropertyTest(HypothesisTestCase):
    """Property 8: Recipe tao qua POST phai co visibility=PRIVATE."""

    @given(title=st.text(min_size=1, max_size=50, alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd', 'Zs'))))
    @settings(max_examples=20, deadline=None)
    def test_new_recipe_has_private_visibility(self, title):
        assume(title.strip())
        user = make_user()
        client = APIClient()
        client.force_authenticate(user=user)

        response = client.post('/api/recipes/', {'title': title.strip()}, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['data']['visibility'], 'PRIVATE')
        self.assertEqual(str(response.data['data']['user']['id']), str(user.pk))


# Feature: phase-4-api-endpoints, Property 9: PRIVATE recipe chi owner moi xem duoc
class RecipePrivateAccessPropertyTest(HypothesisTestCase):
    """Property 9: PRIVATE recipe tra ve 404 voi non-owner."""

    @settings(max_examples=20)
    def test_private_recipe_returns_404_for_non_owner(self):
        owner = make_user()
        other = make_user()
        recipe = make_recipe(owner, 'PRIVATE')

        client = APIClient()
        # Non-owner nhan 404
        client.force_authenticate(user=other)
        response = client.get(f'/api/recipes/{recipe.pk}/')
        self.assertEqual(response.status_code, 404)

        # Owner nhan 200
        client.force_authenticate(user=owner)
        response = client.get(f'/api/recipes/{recipe.pk}/')
        self.assertEqual(response.status_code, 200)

        # Unauthenticated nhan 404
        client.logout()
        response = client.get(f'/api/recipes/{recipe.pk}/')
        self.assertEqual(response.status_code, 404)


# Feature: phase-4-api-endpoints, Property 10: my-recipes tra ve tat ca recipes cua user
class MyRecipesPropertyTest(HypothesisTestCase):
    """Property 10: my-recipes tra ve tat ca recipes cua user (moi visibility)."""

    @given(
        public_count=st.integers(min_value=0, max_value=3),
        private_count=st.integers(min_value=0, max_value=3),
        pending_count=st.integers(min_value=0, max_value=3),
    )
    @settings(max_examples=20, deadline=None)
    def test_my_recipes_returns_all_visibilities(self, public_count, private_count, pending_count):
        user = make_user()
        total = public_count + private_count + pending_count
        for _ in range(public_count):
            make_recipe(user, 'PUBLIC')
        for _ in range(private_count):
            make_recipe(user, 'PRIVATE')
        for _ in range(pending_count):
            make_recipe(user, 'PENDING')

        client = APIClient()
        client.force_authenticate(user=user)
        response = client.get('/api/recipes/my-recipes/')
        self.assertEqual(response.status_code, 200)

        results = response.data['data']['results']
        self.assertEqual(len(results), total)
        for r in results:
            self.assertEqual(str(r['user']), str(user.pk))


# Feature: phase-4-api-endpoints, Property 11: Publish chuyen PRIVATE sang PENDING
class PublishPropertyTest(HypothesisTestCase):
    """Property 11: POST publish chuyen PRIVATE -> PENDING."""

    @settings(max_examples=20)
    def test_publish_changes_private_to_pending(self):
        user = make_user()
        recipe = make_recipe(user, 'PRIVATE')

        client = APIClient()
        client.force_authenticate(user=user)
        response = client.post(f'/api/recipes/{recipe.pk}/publish/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['data']['visibility'], 'PENDING')

        recipe.refresh_from_db()
        self.assertEqual(recipe.visibility, 'PENDING')

    @settings(max_examples=10)
    def test_publish_non_private_returns_400(self):
        user = make_user()
        recipe = make_recipe(user, 'PUBLIC')

        client = APIClient()
        client.force_authenticate(user=user)
        response = client.post(f'/api/recipes/{recipe.pk}/publish/')
        self.assertEqual(response.status_code, 400)
