"""
Performance Tests — Phase 11
Kiểm tra response time và N+1 query với dữ liệu lớn.
Chạy riêng: pytest -m performance
"""
import time
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()

RECIPES_URL = '/api/recipes/'
PANTRY_URL = '/api/kitchen/pantry/'
RECOMMENDATIONS_URL = '/api/recommendations/suggest/'


def make_user(email=None, is_staff=False):
    import uuid
    email = email or f'perf_user_{uuid.uuid4().hex[:8]}@example.com'
    return User.objects.create_user(
        username=email,
        email=email,
        full_name='Perf User',
        password='testpass123',
        is_staff=is_staff,
    )


def make_ingredient(name=None, category='OTHER'):
    from apps.ingredients.models import Ingredient
    import uuid
    name = name or f'perf_ing_{uuid.uuid4().hex[:8]}'
    return Ingredient.objects.create(name=name, category=category, status='APPROVED')


@pytest.mark.performance
@pytest.mark.django_db
class TestRecommendationAPIResponseTime:
    """Test 13.2: Recommendation API — Response time với 1000 recipes."""

    def test_recommendation_completes_within_5_seconds(self):
        """Với 1000 Recipe PUBLIC, POST /api/recommendations/suggest/ hoàn thành trong 5 giây."""
        from apps.recipes.models import Recipe

        user = make_user()
        ingredient = make_ingredient(name='Perf Protein', category='PROTEIN')

        # Bulk create 1000 recipes
        recipes_to_create = [
            Recipe(
                user=user,
                title=f'Perf Recipe {i}',
                difficulty='EASY',
                prep_time=30,
                visibility='PUBLIC',
            )
            for i in range(1000)
        ]
        Recipe.objects.bulk_create(recipes_to_create)

        client = APIClient()
        client.force_authenticate(user=user)

        start = time.time()
        response = client.post(RECOMMENDATIONS_URL, {'mode': 'COOK_NOW'}, format='json')
        elapsed = time.time() - start

        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert elapsed < 5.0, f"Response time {elapsed:.2f}s vượt quá 5 giây"


@pytest.mark.performance
@pytest.mark.django_db
class TestRecommendationAPINPlusOneQuery:
    """Test 13.3: Recommendation API — N+1 query check với 1000 recipes."""

    def test_recommendation_query_count_does_not_grow_linearly(self):
        """Kiểm tra query count với 10 recipes vs 1000 recipes không tăng tuyến tính."""
        from apps.recipes.models import Recipe
        from django.test.utils import CaptureQueriesContext
        from django.db import connection

        user = make_user()

        # Tạo 10 recipes
        Recipe.objects.bulk_create([
            Recipe(user=user, title=f'Small {i}', difficulty='EASY', prep_time=30, visibility='PUBLIC')
            for i in range(10)
        ])

        client = APIClient()
        client.force_authenticate(user=user)

        with CaptureQueriesContext(connection) as ctx_small:
            response_small = client.post(RECOMMENDATIONS_URL, {'mode': 'COOK_NOW'}, format='json')
        assert response_small.status_code == 200
        queries_small = len(ctx_small)

        # Tạo thêm 990 recipes (tổng 1000)
        Recipe.objects.bulk_create([
            Recipe(user=user, title=f'Large {i}', difficulty='EASY', prep_time=30, visibility='PUBLIC')
            for i in range(990)
        ])

        with CaptureQueriesContext(connection) as ctx_large:
            response_large = client.post(RECOMMENDATIONS_URL, {'mode': 'COOK_NOW'}, format='json')
        assert response_large.status_code == 200
        queries_large = len(ctx_large)

        # Với prefetch_related đúng, query count không nên tăng 100x
        # Cho phép tăng tối đa 10x (nếu có N+1 thì sẽ tăng ~100x)
        assert queries_large < queries_small * 10, (
            f"N+1 problem: queries tăng từ {queries_small} (10 recipes) "
            f"lên {queries_large} (1000 recipes) — tỷ lệ {queries_large/queries_small:.1f}x"
        )


@pytest.mark.performance
@pytest.mark.django_db
class TestRecipeListQueryCount:
    """Test 13.4: Recipe list — Query count không tăng tuyến tính (N+1 check)."""

    def test_recipe_list_query_count_invariant(self, django_assert_num_queries):
        """Query count khi lấy 10 recipe == query count khi lấy 50 recipe."""
        from apps.recipes.models import Recipe

        user = make_user()

        # Tạo 10 recipes
        Recipe.objects.bulk_create([
            Recipe(user=user, title=f'Recipe {i}', difficulty='EASY', prep_time=30, visibility='PUBLIC')
            for i in range(10)
        ])

        client = APIClient()

        # Đếm queries với 10 recipes
        from django.test.utils import CaptureQueriesContext
        from django.db import connection

        with CaptureQueriesContext(connection) as ctx_10:
            response_10 = client.get(RECIPES_URL)
        assert response_10.status_code == 200
        query_count_10 = len(ctx_10)

        # Tạo thêm 40 recipes (tổng 50)
        Recipe.objects.bulk_create([
            Recipe(user=user, title=f'Recipe Extra {i}', difficulty='EASY', prep_time=30, visibility='PUBLIC')
            for i in range(40)
        ])

        with CaptureQueriesContext(connection) as ctx_50:
            response_50 = client.get(RECIPES_URL)
        assert response_50.status_code == 200
        query_count_50 = len(ctx_50)

        assert query_count_10 == query_count_50, (
            f"N+1 problem: query count tăng từ {query_count_10} (10 recipes) "
            f"lên {query_count_50} (50 recipes)"
        )


@pytest.mark.performance
@pytest.mark.django_db
class TestPantryListQueryOptimization:
    """Test 13.5: Pantry list — Query optimization với 100 items."""

    def test_pantry_list_uses_at_most_5_queries(self, django_assert_num_queries):
        """Với 100 Pantry items, GET /api/kitchen/pantry/ ≤ 5 SQL queries."""
        from apps.kitchen.models import Pantry
        from apps.ingredients.models import Ingredient

        user = make_user()

        # Bulk create 100 ingredients và pantry items
        ingredients = Ingredient.objects.bulk_create([
            Ingredient(name=f'Pantry Ing {i}', category='OTHER', status='APPROVED')
            for i in range(100)
        ])
        Pantry.objects.bulk_create([
            Pantry(user=user, ingredient=ing, quantity=100, unit='gram')
            for ing in ingredients
        ])

        client = APIClient()
        client.force_authenticate(user=user)

        with django_assert_num_queries(5, exact=False):
            response = client.get(PANTRY_URL)

        assert response.status_code == 200


@pytest.mark.performance
@pytest.mark.django_db
class TestUserStatsQueryOptimization:
    """Test 13.6: User stats — Query optimization."""

    def test_user_stats_uses_at_most_5_queries(self, django_assert_num_queries):
        """GET /api/accounts/{id}/stats/ ≤ 5 SQL queries."""
        from apps.recipes.models import Recipe
        from apps.social.models import Review

        user = make_user()
        reviewer = make_user()

        # Tạo nhiều recipes và reviews
        recipes = Recipe.objects.bulk_create([
            Recipe(user=user, title=f'Stats Recipe {i}', difficulty='EASY', prep_time=30, visibility='PUBLIC')
            for i in range(20)
        ])
        Review.objects.bulk_create([
            Review(user=reviewer, recipe=recipe, rating=4)
            for recipe in recipes[:10]
        ])

        client = APIClient()
        client.force_authenticate(user=user)

        with django_assert_num_queries(5, exact=False):
            response = client.get(f'/api/accounts/{user.id}/stats/')

        assert response.status_code == 200
