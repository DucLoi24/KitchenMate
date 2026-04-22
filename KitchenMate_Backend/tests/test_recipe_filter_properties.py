"""
Property-based tests cho RecipeFilter (Phase 9: Search & Filter).
Dùng Hypothesis để kiểm tra các invariants của bộ lọc công thức.
"""
import pytest
from hypothesis import given, settings as h_settings, HealthCheck
from hypothesis import strategies as st
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

from apps.recipes.models import Recipe, RecipeIngredient
from apps.ingredients.models import Ingredient

User = get_user_model()

# ==============================================================================
# HELPERS
# ==============================================================================

def make_user(email, username):
    """Tạo hoặc lấy user theo email."""
    user, _ = User.objects.get_or_create(
        email=email,
        defaults={'username': username, 'full_name': 'Test User'}
    )
    user.set_password('testpass123')
    user.save()
    return user


def make_recipe(user, title='Test Recipe', difficulty='EASY', prep_time=30, visibility='PUBLIC'):
    """Tạo recipe với các tham số cho trước."""
    return Recipe.objects.create(
        user=user,
        title=title,
        description='Mô tả test',
        difficulty=difficulty,
        prep_time=prep_time,
        visibility=visibility,
    )


def make_ingredient(name, status='APPROVED'):
    """Tạo hoặc lấy ingredient theo tên."""
    ing, _ = Ingredient.objects.get_or_create(
        name=name,
        defaults={'category': 'OTHER', 'status': status}
    )
    return ing


def attach_ingredient(recipe, ingredient, quantity=1.0, unit='g'):
    """Gắn ingredient vào recipe qua RecipeIngredient."""
    return RecipeIngredient.objects.create(
        recipe=recipe,
        ingredient=ingredient,
        quantity=quantity,
        unit=unit,
    )


def get_recipe_ids(response):
    """Trích xuất danh sách id từ response API."""
    data = response.json()
    results = data.get('data', {}).get('results', [])
    return [r['id'] for r in results]


# ==============================================================================
# PROPERTY TESTS
# ==============================================================================

@pytest.mark.django_db(transaction=True)
@given(difficulty=st.sampled_from(['EASY', 'MEDIUM', 'HARD']))
@h_settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture], deadline=None)
def test_difficulty_filter_correctness(difficulty, db):
    """
    # Feature: phase-9-search-filter, Property 1: Difficulty filter chỉ trả về recipes đúng difficulty
    For any difficulty hợp lệ, tất cả recipes trong kết quả phải có đúng difficulty đó.
    Validates: Req 1.1, 1.2, 1.3
    """
    user = make_user('prop1@example.com', 'prop1user')
    client = APIClient()
    client.force_authenticate(user=user)

    # Tạo recipe cho mỗi difficulty để đảm bảo có dữ liệu
    for diff in ['EASY', 'MEDIUM', 'HARD']:
        make_recipe(user, title=f'Recipe {diff} prop1', difficulty=diff, visibility='PUBLIC')

    response = client.get(f'/api/recipes/?difficulty={difficulty}')
    assert response.status_code == 200

    data = response.json()
    results = data.get('data', {}).get('results', [])

    # Tất cả kết quả phải có đúng difficulty được yêu cầu
    for recipe in results:
        assert recipe['difficulty'] == difficulty, (
            f"Kết quả có difficulty={recipe['difficulty']}, mong đợi {difficulty}"
        )

    # Cleanup
    Recipe.objects.filter(user=user).delete()


@pytest.mark.django_db(transaction=True)
@given(
    prep_min=st.integers(min_value=1, max_value=60),
    prep_max=st.integers(min_value=1, max_value=120),
)
@h_settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture], deadline=None)
def test_prep_time_range_filter(prep_min, prep_max, db):
    """
    # Feature: phase-9-search-filter, Property 2: prep_time range filter đúng bounds
    For any (prep_time_min, prep_time_max), tất cả kết quả phải có prep_time trong [min, max].
    Validates: Req 2.1, 2.2, 2.3, 2.6
    """
    # Đảm bảo min <= max
    lo, hi = min(prep_min, prep_max), max(prep_min, prep_max)

    user = make_user('prop2@example.com', 'prop2user')
    client = APIClient()
    client.force_authenticate(user=user)

    # Tạo recipes với prep_time trải đều để có dữ liệu đa dạng
    for t in [lo - 1, lo, (lo + hi) // 2, hi, hi + 1]:
        if t >= 1:
            make_recipe(user, title=f'Recipe prep {t} prop2', prep_time=t, visibility='PUBLIC')

    response = client.get(f'/api/recipes/?prep_time_min={lo}&prep_time_max={hi}')
    assert response.status_code == 200

    data = response.json()
    results = data.get('data', {}).get('results', [])

    for recipe in results:
        pt = recipe.get('prep_time')
        assert pt is not None, "prep_time không được None trong kết quả filter"
        assert lo <= pt <= hi, (
            f"prep_time={pt} nằm ngoài khoảng [{lo}, {hi}]"
        )

    # Cleanup
    Recipe.objects.filter(user=user).delete()


@pytest.mark.django_db(transaction=True)
@given(
    keyword=st.text(
        min_size=2, max_size=10,
        alphabet=st.sampled_from('abcdefghijklmnopqrstuvwxyz')
    )
)
@h_settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture], deadline=None)
def test_title_search_case_insensitive(keyword, db):
    """
    # Feature: phase-9-search-filter, Property 3: Title search case-insensitive
    Kết quả filter theo title=keyword.upper() phải giống hệt title=keyword.lower().
    Validates: Req 3.1, 3.2
    """
    user = make_user('prop3@example.com', 'prop3user')
    client = APIClient()
    client.force_authenticate(user=user)

    # Tạo recipe có title chứa keyword
    make_recipe(user, title=f'Món {keyword} ngon', visibility='PUBLIC')

    response_upper = client.get(f'/api/recipes/?title={keyword.upper()}')
    response_lower = client.get(f'/api/recipes/?title={keyword.lower()}')

    assert response_upper.status_code == 200
    assert response_lower.status_code == 200

    ids_upper = set(get_recipe_ids(response_upper))
    ids_lower = set(get_recipe_ids(response_lower))

    assert ids_upper == ids_lower, (
        f"Kết quả upper ({len(ids_upper)}) khác lower ({len(ids_lower)}) với keyword='{keyword}'"
    )

    # Cleanup
    Recipe.objects.filter(user=user).delete()


@pytest.mark.django_db(transaction=True)
@given(
    keyword=st.text(
        min_size=3, max_size=8,
        alphabet=st.sampled_from('abcdefghijklmnopqrstuvwxyz')
    )
)
@h_settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture], deadline=None)
def test_ingredient_filter_no_duplicate(keyword, db):
    """
    # Feature: phase-9-search-filter, Property 4: Ingredient filter correctness và no duplicate
    Recipe có nhiều ingredients khớp keyword chỉ xuất hiện đúng một lần trong kết quả.
    Validates: Req 4.1, 4.5, 7.2
    """
    user = make_user('prop4@example.com', 'prop4user')
    client = APIClient()
    client.force_authenticate(user=user)

    recipe = make_recipe(user, title='Recipe nhiều nguyên liệu prop4', visibility='PUBLIC')

    # Tạo nhiều ingredients đều chứa keyword
    for i in range(3):
        ing = make_ingredient(f'{keyword}_ing_{i}_prop4')
        attach_ingredient(recipe, ing)

    response = client.get(f'/api/recipes/?ingredient={keyword}')
    assert response.status_code == 200

    ids = get_recipe_ids(response)
    recipe_id = str(recipe.id)

    # Recipe phải xuất hiện trong kết quả (có ít nhất 1 ingredient khớp)
    assert recipe_id in ids, f"Recipe không xuất hiện trong kết quả filter ingredient='{keyword}'"

    # Recipe chỉ xuất hiện đúng một lần (không duplicate)
    assert ids.count(recipe_id) == 1, (
        f"Recipe xuất hiện {ids.count(recipe_id)} lần, mong đợi đúng 1 lần"
    )

    # Cleanup
    RecipeIngredient.objects.filter(recipe=recipe).delete()
    Recipe.objects.filter(id=recipe.id).delete()
    Ingredient.objects.filter(name__contains=f'{keyword}_ing_').delete()


@pytest.mark.django_db(transaction=True)
@given(
    difficulty=st.sampled_from(['EASY', 'MEDIUM', 'HARD']),
    prep_min=st.integers(min_value=1, max_value=30),
    prep_max=st.integers(min_value=31, max_value=120),
)
@h_settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture], deadline=None)
def test_combined_filters_and_logic(difficulty, prep_min, prep_max, db):
    """
    # Feature: phase-9-search-filter, Property 5: Combined filters áp dụng AND logic
    Tất cả kết quả phải thỏa mãn TẤT CẢ điều kiện filter đồng thời (AND, không phải OR).
    Validates: Req 5.1, 5.2, 5.3
    """
    user = make_user('prop5@example.com', 'prop5user')
    client = APIClient()
    client.force_authenticate(user=user)

    # Tạo recipe thỏa mãn tất cả điều kiện
    mid_prep = (prep_min + prep_max) // 2
    make_recipe(
        user,
        title='Recipe AND logic prop5',
        difficulty=difficulty,
        prep_time=mid_prep,
        visibility='PUBLIC'
    )
    # Tạo recipe chỉ thỏa một điều kiện (không được xuất hiện trong kết quả)
    other_diff = 'MEDIUM' if difficulty != 'MEDIUM' else 'HARD'
    make_recipe(
        user,
        title='Recipe sai difficulty prop5',
        difficulty=other_diff,
        prep_time=mid_prep,
        visibility='PUBLIC'
    )

    response = client.get(
        f'/api/recipes/?difficulty={difficulty}&prep_time_min={prep_min}&prep_time_max={prep_max}'
    )
    assert response.status_code == 200

    data = response.json()
    results = data.get('data', {}).get('results', [])

    for recipe in results:
        # Phải thỏa mãn difficulty
        assert recipe['difficulty'] == difficulty, (
            f"difficulty={recipe['difficulty']} không khớp filter={difficulty}"
        )
        # Phải thỏa mãn prep_time range
        pt = recipe.get('prep_time')
        if pt is not None:
            assert prep_min <= pt <= prep_max, (
                f"prep_time={pt} nằm ngoài [{prep_min}, {prep_max}]"
            )

    # Cleanup
    Recipe.objects.filter(user=user).delete()
