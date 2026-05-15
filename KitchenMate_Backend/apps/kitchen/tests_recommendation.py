"""
Property-based tests cho Recommendation Engine.
Feature: phase-6-recommendation-algorithm
"""
import uuid
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from hypothesis import given, settings, assume
from hypothesis import strategies as st
from hypothesis.extra.django import TestCase as HypothesisTestCase

from apps.ingredients.models import Ingredient
from apps.recipes.models import Recipe, RecipeCategory, RecipeIngredient
from apps.social.models import Collection, CollectionRecipe
from .models import Pantry
from .services.recommendation_engine import calculate_recipe_score, PENALTY

User = get_user_model()


# ─── Helpers ────────────────────────────────────────────────────────────────

def make_user():
    email = f'user_{uuid.uuid4().hex[:8]}@test.com'
    return User.objects.create_user(username=email, email=email, full_name='Test', password='pass123')


def make_ingredient(category='OTHER', status='APPROVED'):
    return Ingredient.objects.create(
        name=f'ing_{uuid.uuid4().hex[:8]}', status=status, category=category
    )


def make_recipe_with_ingredients(user, ingredients, visibility='PUBLIC'):
    """Tao recipe voi danh sach ingredients."""
    recipe = Recipe.objects.create(
        user=user, title=f'Recipe {uuid.uuid4().hex[:6]}', visibility=visibility
    )
    for ing in ingredients:
        RecipeIngredient.objects.create(recipe=recipe, ingredient=ing, quantity=1.0, unit='g')
    return recipe


def add_to_pantry(user, ingredient, quantity=1.0):
    return Pantry.objects.create(user=user, ingredient=ingredient, quantity=quantity, unit='g')


def _prefetch_recipe(recipe_pk):
    """Lay recipe instance da prefetch recipe_ingredients__ingredient."""
    return Recipe.objects.prefetch_related('recipe_ingredients__ingredient').get(pk=recipe_pk)


# ─── Property 14: COOK_NOW chi tra ve recipes co du nguyen lieu ──────────────

class CookNowPropertyTest(HypothesisTestCase):
    """Property 14: COOK_NOW chi tra ve recipes co missing_count == 0."""

    @given(st.just(None))
    @settings(max_examples=20, deadline=None)
    def test_cook_now_only_returns_complete_recipes(self, _):
        """
        Tat ca ket qua COOK_NOW phai co missing_ingredients rong.
        """
        user = make_user()
        client = APIClient()
        client.force_authenticate(user=user)

        # Tao 2 ingredients, them vao pantry
        ing1 = make_ingredient('PROTEIN')
        ing2 = make_ingredient('VEG')
        add_to_pantry(user, ing1)
        add_to_pantry(user, ing2)

        # Recipe co du nguyen lieu
        make_recipe_with_ingredients(user, [ing1, ing2], 'PUBLIC')

        # Recipe thieu nguyen lieu
        ing3 = make_ingredient('CARB')
        make_recipe_with_ingredients(user, [ing1, ing3], 'PUBLIC')

        response = client.post('/api/recommendations/suggest/', {'mode': 'COOK_NOW'}, format='json')
        self.assertEqual(response.status_code, 200)

        for item in response.data['data']:
            self.assertEqual(len(item['missing_ingredients']), 0)


# ─── Property 15: ADD_MORE thoa man dieu kien missing va score ───────────────

class AddMorePropertyTest(HypothesisTestCase):
    """Property 15: ADD_MORE chi tra ve recipes co missing <= 2 VA score >= 0."""

    @given(st.just(None))
    @settings(max_examples=20, deadline=None)
    def test_add_more_satisfies_conditions(self, _):
        """
        Tat ca ket qua ADD_MORE phai co len(missing) <= 2 va score >= 0.
        """
        user = make_user()
        client = APIClient()
        client.force_authenticate(user=user)

        ing1 = make_ingredient('SPICE')
        ing2 = make_ingredient('SPICE')
        add_to_pantry(user, ing1)

        # Recipe thieu 1 SPICE (penalty -10, match +20 -> score = 10 >= 0)
        make_recipe_with_ingredients(user, [ing1, ing2], 'PUBLIC')

        response = client.post('/api/recommendations/suggest/', {'mode': 'ADD_MORE'}, format='json')
        self.assertEqual(response.status_code, 200)

        for item in response.data['data']:
            self.assertLessEqual(len(item['missing_ingredients']), 2)
            self.assertGreaterEqual(item['score'], 0)


class RecommendationFilterPaginationTest(HypothesisTestCase):
    """Suggestion API filter theo danh mục động, thời gian nấu và phân trang."""

    def test_suggest_filters_by_active_recipe_category_from_backend(self):
        user = make_user()
        client = APIClient()
        client.force_authenticate(user=user)

        ingredient = make_ingredient('PROTEIN')
        add_to_pantry(user, ingredient)
        category_target = RecipeCategory.objects.create(
            name=f'Món test {uuid.uuid4().hex[:6]}',
            slug=f'mon-test-{uuid.uuid4().hex[:6]}',
            is_active=True,
        )
        category_other = RecipeCategory.objects.create(
            name=f'Món khác {uuid.uuid4().hex[:6]}',
            slug=f'mon-khac-{uuid.uuid4().hex[:6]}',
            is_active=True,
        )

        recipe_target = make_recipe_with_ingredients(user, [ingredient], 'PUBLIC')
        recipe_target.title = 'Recipe đúng danh mục'
        recipe_target.prep_time = 20
        recipe_target.save(update_fields=['title', 'prep_time'])
        recipe_target.categories.add(category_target)

        recipe_other = make_recipe_with_ingredients(user, [ingredient], 'PUBLIC')
        recipe_other.title = 'Recipe sai danh mục'
        recipe_other.prep_time = 20
        recipe_other.save(update_fields=['title', 'prep_time'])
        recipe_other.categories.add(category_other)

        response = client.post(
            '/api/recommendations/suggest/',
            {
                'mode': 'COOK_NOW',
                'categories': [str(category_target.id)],
                'page': 1,
                'page_size': 10,
            },
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        titles = [item['recipe']['title'] for item in response.data['data']['results']]
        self.assertIn('Recipe đúng danh mục', titles)
        self.assertNotIn('Recipe sai danh mục', titles)
        self.assertEqual(response.data['data']['count'], 1)

    def test_suggest_filters_by_cooking_time_and_returns_numbered_pages(self):
        user = make_user()
        client = APIClient()
        client.force_authenticate(user=user)

        ingredient = make_ingredient('VEG')
        add_to_pantry(user, ingredient)

        for index, prep_time in enumerate([10, 20, 25, 45]):
            recipe = make_recipe_with_ingredients(user, [ingredient], 'PUBLIC')
            recipe.title = f'Recipe {index}'
            recipe.prep_time = prep_time
            recipe.save(update_fields=['title', 'prep_time'])

        response = client.post(
            '/api/recommendations/suggest/',
            {
                'mode': 'COOK_NOW',
                'cooking_time': [30],
                'page': 2,
                'page_size': 1,
            },
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['data']['count'], 2)
        self.assertEqual(len(response.data['data']['results']), 1)
        self.assertIsNotNone(response.data['data']['previous'])
        self.assertIsNone(response.data['data']['next'])
        result_titles = {item['recipe']['title'] for item in response.data['data']['results']}
        self.assertTrue(result_titles.issubset({'Recipe 1', 'Recipe 2'}))


# ─── Property 16: STAPLE ingredients khong anh huong den score ──────────────

class StapleIgnoredPropertyTest(HypothesisTestCase):
    """Property 16: STAPLE ingredients khong anh huong den score."""

    @given(st.just(None))
    @settings(max_examples=20, deadline=None)
    def test_staple_ingredients_ignored_in_scoring(self, _):
        """
        Them hoac bo STAPLE ingredients khong thay doi score.
        """
        user = make_user()
        ing_protein = make_ingredient('PROTEIN')
        ing_staple = make_ingredient('STAPLE')

        pantry_ids = {ing_protein.pk}
        saved_ids = set()

        # Recipe chi co PROTEIN
        recipe1 = Recipe.objects.create(user=user, title='R1', visibility='PUBLIC')
        RecipeIngredient.objects.create(recipe=recipe1, ingredient=ing_protein, quantity=1, unit='g')

        # Recipe co PROTEIN + STAPLE
        recipe2 = Recipe.objects.create(user=user, title='R2', visibility='PUBLIC')
        RecipeIngredient.objects.create(recipe=recipe2, ingredient=ing_protein, quantity=1, unit='g')
        RecipeIngredient.objects.create(recipe=recipe2, ingredient=ing_staple, quantity=1, unit='g')

        r1 = _prefetch_recipe(recipe1.pk)
        r2 = _prefetch_recipe(recipe2.pk)

        score1, missing1 = calculate_recipe_score(r1, pantry_ids, saved_ids)
        score2, missing2 = calculate_recipe_score(r2, pantry_ids, saved_ids)

        # Score phai bang nhau (STAPLE khong tinh)
        self.assertEqual(score1, score2)
        self.assertEqual(len(missing1), len(missing2))


# ─── Property 17: Scoring algorithm dung theo cong thuc ─────────────────────

class ScoringAlgorithmPropertyTest(HypothesisTestCase):
    """Property 17: Score = sum(+20 match) + sum(penalty missing) + 50 affinity."""

    @given(
        category=st.sampled_from(['PROTEIN', 'CARB', 'VEG', 'OTHER', 'SPICE']),
        has_in_pantry=st.booleans(),
        has_affinity=st.booleans(),
    )
    @settings(max_examples=30, deadline=None)
    def test_scoring_formula_correct(self, category, has_in_pantry, has_affinity):
        """
        Score phai bang dung cong thuc: match*20 + penalty + affinity.
        """
        user = make_user()
        ingredient = make_ingredient(category)

        recipe = Recipe.objects.create(user=user, title=f'R_{uuid.uuid4().hex[:4]}', visibility='PUBLIC')
        RecipeIngredient.objects.create(recipe=recipe, ingredient=ingredient, quantity=1, unit='g')

        pantry_ids = {ingredient.pk} if has_in_pantry else set()
        saved_ids = {recipe.pk} if has_affinity else set()

        r = _prefetch_recipe(recipe.pk)
        score, missing = calculate_recipe_score(r, pantry_ids, saved_ids)

        expected = 0
        if has_in_pantry:
            expected += 20
        else:
            expected += PENALTY.get(category, -25)

        if has_affinity:
            expected += 50

        self.assertEqual(score, expected)
        if has_in_pantry:
            self.assertEqual(len(missing), 0)
        else:
            self.assertEqual(len(missing), 1)
            self.assertEqual(missing[0]['category'], category)


# ─── Property 18: exclude_ingredients loai tru dung ─────────────────────────

class ExcludeIngredientsPropertyTest(HypothesisTestCase):
    """Property 18: exclude_ingredients loai tru tat ca recipes chua ingredient do."""

    @given(st.just(None))
    @settings(max_examples=20, deadline=None)
    def test_exclude_ingredients_filters_correctly(self, _):
        """
        Khong co ket qua nao chua ingredient trong exclude list.
        """
        user = make_user()
        client = APIClient()
        client.force_authenticate(user=user)

        ing_excluded = make_ingredient('PROTEIN')
        ing_ok = make_ingredient('VEG')
        add_to_pantry(user, ing_ok)

        # Recipe chua ingredient bi loai tru
        make_recipe_with_ingredients(user, [ing_excluded, ing_ok], 'PUBLIC')
        # Recipe khong chua ingredient bi loai tru
        make_recipe_with_ingredients(user, [ing_ok], 'PUBLIC')

        response = client.post('/api/recommendations/suggest/', {
            'mode': 'ADD_MORE',
            'exclude_ingredients': [ing_excluded.pk]
        }, format='json')
        self.assertEqual(response.status_code, 200)

        for item in response.data['data']:
            ingredient_ids = [m['id'] for m in item['missing_ingredients']]
            self.assertNotIn(ing_excluded.pk, ingredient_ids)
