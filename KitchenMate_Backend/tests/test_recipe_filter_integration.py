"""
Integration tests (example-based) cho RecipeFilter (Phase 9: Search & Filter).
Kiểm tra các trường hợp cụ thể: no params, invalid values, empty strings, pagination.
"""
import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

from apps.recipes.models import Recipe, RecipeIngredient
from apps.ingredients.models import Ingredient

User = get_user_model()


# ==============================================================================
# FIXTURES
# ==============================================================================

@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(
        username='filteruser',
        email='filteruser@example.com',
        password='testpass123',
        full_name='Filter User'
    )


@pytest.fixture
def auth_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture
def public_recipes(db, user):
    """Tạo 3 PUBLIC recipes với các difficulty và prep_time khác nhau."""
    r1 = Recipe.objects.create(
        user=user, title='Phở bò', difficulty='EASY', prep_time=20, visibility='PUBLIC'
    )
    r2 = Recipe.objects.create(
        user=user, title='Bún bò Huế', difficulty='MEDIUM', prep_time=45, visibility='PUBLIC'
    )
    r3 = Recipe.objects.create(
        user=user, title='Cơm tấm sườn', difficulty='HARD', prep_time=60, visibility='PUBLIC'
    )
    return [r1, r2, r3]


@pytest.fixture
def private_recipe(db, user):
    """Tạo 1 PRIVATE recipe — không được xuất hiện trong list."""
    return Recipe.objects.create(
        user=user, title='Bí mật gia đình', difficulty='EASY', prep_time=10, visibility='PRIVATE'
    )


# ==============================================================================
# HELPERS
# ==============================================================================

def get_results(response):
    return response.json().get('data', {}).get('results', [])


def get_result_ids(response):
    return {r['id'] for r in get_results(response)}


# ==============================================================================
# INTEGRATION TESTS
# ==============================================================================

@pytest.mark.django_db
def test_no_params_returns_all_public(auth_client, public_recipes, private_recipe):
    """
    Filter không có params → trả về tất cả PUBLIC recipes, không bao gồm PRIVATE.
    Validates: Req 1.4, 2.4, 3.3
    """
    response = auth_client.get('/api/recipes/')
    assert response.status_code == 200

    ids = get_result_ids(response)
    public_ids = {str(r.id) for r in public_recipes}
    private_id = str(private_recipe.id)

    assert public_ids.issubset(ids), "Thiếu PUBLIC recipe trong kết quả"
    assert private_id not in ids, "PRIVATE recipe không được xuất hiện"


@pytest.mark.django_db
def test_invalid_difficulty_returns_400(auth_client, public_recipes):
    """
    difficulty không hợp lệ → HTTP 400.
    Validates: Req 1.5
    """
    response = auth_client.get('/api/recipes/?difficulty=INVALID')
    assert response.status_code == 400


@pytest.mark.django_db
def test_invalid_prep_time_min_returns_400(auth_client, public_recipes):
    """
    prep_time_min không phải số → HTTP 400.
    Validates: Req 2.5
    """
    response = auth_client.get('/api/recipes/?prep_time_min=abc')
    assert response.status_code == 400


@pytest.mark.django_db
def test_invalid_prep_time_max_returns_400(auth_client, public_recipes):
    """
    prep_time_max không phải số → HTTP 400.
    Validates: Req 2.5
    """
    response = auth_client.get('/api/recipes/?prep_time_max=xyz')
    assert response.status_code == 400


@pytest.mark.django_db
def test_empty_title_returns_all_public(auth_client, public_recipes):
    """
    title= rỗng → trả về tất cả PUBLIC recipes (không áp dụng filter).
    Validates: Req 3.3
    """
    response = auth_client.get('/api/recipes/?title=')
    assert response.status_code == 200

    ids = get_result_ids(response)
    public_ids = {str(r.id) for r in public_recipes}
    assert public_ids.issubset(ids)


@pytest.mark.django_db
def test_nonexistent_title_returns_empty(auth_client, public_recipes):
    """
    title=xyz_khong_ton_tai → HTTP 200 với data rỗng.
    Validates: Req 3.4
    """
    response = auth_client.get('/api/recipes/?title=xyz_khong_ton_tai_abc123')
    assert response.status_code == 200
    assert get_results(response) == []


@pytest.mark.django_db
def test_empty_ingredient_returns_all_public(auth_client, public_recipes):
    """
    ingredient= rỗng → trả về tất cả PUBLIC recipes.
    Validates: Req 4.2
    """
    response = auth_client.get('/api/recipes/?ingredient=')
    assert response.status_code == 200

    ids = get_result_ids(response)
    public_ids = {str(r.id) for r in public_recipes}
    assert public_ids.issubset(ids)


@pytest.mark.django_db
def test_nonexistent_ingredient_returns_empty(auth_client, public_recipes):
    """
    ingredient=xyz_khong_ton_tai → HTTP 200 với data rỗng.
    Validates: Req 4.3
    """
    response = auth_client.get('/api/recipes/?ingredient=xyz_khong_ton_tai_abc123')
    assert response.status_code == 200
    assert get_results(response) == []


@pytest.mark.django_db
def test_pagination_works_after_filter(db, user, api_client):
    """
    Pagination vẫn hoạt động sau khi filter.
    Validates: Req 5.4
    """
    api_client.force_authenticate(user=user)

    # Tạo 15 PUBLIC EASY recipes để vượt page size mặc định (thường 10)
    for i in range(15):
        Recipe.objects.create(
            user=user,
            title=f'Món dễ số {i}',
            difficulty='EASY',
            prep_time=10 + i,
            visibility='PUBLIC'
        )

    response = api_client.get('/api/recipes/?difficulty=EASY')
    assert response.status_code == 200

    data = response.json().get('data', {})
    # Phải có pagination fields
    assert 'count' in data
    assert 'results' in data
    assert data['count'] >= 15

    # Cleanup
    Recipe.objects.filter(user=user).delete()


@pytest.mark.django_db
def test_ingredient_filter_finds_correct_recipe(db, user, api_client):
    """
    ingredient=thịt bò → trả về recipe có nguyên liệu chứa 'thịt bò'.
    Validates: Req 4.1, 4.4
    """
    api_client.force_authenticate(user=user)

    recipe_with_ing = Recipe.objects.create(
        user=user, title='Bò lúc lắc', difficulty='MEDIUM', prep_time=30, visibility='PUBLIC'
    )
    recipe_without_ing = Recipe.objects.create(
        user=user, title='Canh chua', difficulty='EASY', prep_time=20, visibility='PUBLIC'
    )

    ing = Ingredient.objects.create(name='Thịt bò tươi', category='PROTEIN', status='APPROVED')
    RecipeIngredient.objects.create(recipe=recipe_with_ing, ingredient=ing, quantity=200, unit='g')

    response = api_client.get('/api/recipes/?ingredient=thịt bò')
    assert response.status_code == 200

    ids = get_result_ids(response)
    assert str(recipe_with_ing.id) in ids
    assert str(recipe_without_ing.id) not in ids

    # Cleanup
    RecipeIngredient.objects.filter(recipe=recipe_with_ing).delete()
    recipe_with_ing.delete()
    recipe_without_ing.delete()
    ing.delete()
