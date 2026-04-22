"""
Property-based tests cho Phase 10: Statistics & Analytics.
Dùng Hypothesis để kiểm tra các invariants của stats endpoints.
"""
import pytest
from hypothesis import given, settings as h_settings, HealthCheck
from hypothesis import strategies as st
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

from apps.recipes.models import Recipe
from apps.social.models import Review, Collection, CollectionRecipe

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


def make_recipe(user, visibility='PUBLIC', title='Test Recipe'):
    """Tạo recipe với visibility cho trước."""
    return Recipe.objects.create(
        user=user,
        title=title,
        description='Mô tả test',
        difficulty='EASY',
        prep_time=30,
        visibility=visibility,
    )


def make_review(reviewer, recipe, rating):
    """Tạo review cho recipe."""
    return Review.objects.create(
        user=reviewer,
        recipe=recipe,
        rating=rating,
        comment='Test review',
    )


def make_collection_recipe(owner, recipe):
    """Tạo CollectionRecipe — lưu recipe vào collection của owner."""
    collection, _ = Collection.objects.get_or_create(
        user=owner,
        name='Test Collection',
    )
    cr, _ = CollectionRecipe.objects.get_or_create(
        collection=collection,
        recipe=recipe,
    )
    return cr


# ==============================================================================
# PROPERTY TESTS
# ==============================================================================

@pytest.mark.django_db(transaction=True)
@given(
    n_public=st.integers(min_value=0, max_value=10),
    n_private=st.integers(min_value=0, max_value=10),
)
@h_settings(max_examples=50, suppress_health_check=[HealthCheck.function_scoped_fixture], deadline=None)
def test_recipe_count_only_public(n_public, n_private, db):
    """
    # Feature: phase-10-statistics-analytics, Property 1
    For any user với N PUBLIC + M PRIVATE recipes, recipe_count phải bằng đúng N.
    Validates: Req 7.1, 8.1
    """
    user = make_user('p10_prop1@example.com', 'p10prop1user')
    client = APIClient()

    # Tạo N PUBLIC recipes
    for i in range(n_public):
        make_recipe(user, visibility='PUBLIC', title=f'Public {i} p1')

    # Tạo M PRIVATE recipes
    for i in range(n_private):
        make_recipe(user, visibility='PRIVATE', title=f'Private {i} p1')

    response = client.get(f'/api/accounts/{user.pk}/stats/')
    assert response.status_code == 200

    data = response.json()
    assert data['success'] is True
    assert data['data']['recipe_count'] == n_public, (
        f"recipe_count={data['data']['recipe_count']}, mong đợi {n_public} "
        f"(có {n_private} PRIVATE không được đếm)"
    )

    # Cleanup
    Recipe.objects.filter(user=user).delete()


@pytest.mark.django_db(transaction=True)
@given(n_saves=st.integers(min_value=0, max_value=10))
@h_settings(max_examples=50, suppress_health_check=[HealthCheck.function_scoped_fixture], deadline=None)
def test_total_likes_equals_collection_recipe_count(n_saves, db):
    """
    # Feature: phase-10-statistics-analytics, Property 2
    For any user với M CollectionRecipe liên kết, total_likes phải bằng đúng M.
    Validates: Req 1.1, 7.2, 8.2
    """
    owner = make_user('p10_prop2_owner@example.com', 'p10prop2owner')
    client = APIClient()

    # Tạo recipe của owner
    recipe = make_recipe(owner, visibility='PUBLIC', title='Recipe for saves p2')

    # Tạo M users khác nhau lưu recipe này
    for i in range(n_saves):
        saver = make_user(f'p10_prop2_saver{i}@example.com', f'p10prop2saver{i}')
        make_collection_recipe(saver, recipe)

    response = client.get(f'/api/accounts/{owner.pk}/stats/')
    assert response.status_code == 200

    data = response.json()
    assert data['success'] is True
    assert data['data']['total_likes'] == n_saves, (
        f"total_likes={data['data']['total_likes']}, mong đợi {n_saves}"
    )

    # Cleanup
    CollectionRecipe.objects.filter(recipe=recipe).delete()
    Recipe.objects.filter(id=recipe.id).delete()


@pytest.mark.django_db(transaction=True)
@given(ratings=st.lists(st.integers(min_value=1, max_value=5), min_size=0, max_size=10))
@h_settings(max_examples=50, suppress_health_check=[HealthCheck.function_scoped_fixture], deadline=None)
def test_average_rating_correctness(ratings, db):
    """
    # Feature: phase-10-statistics-analytics, Property 3
    For any list ratings hợp lệ [1-5], average_rating == round(sum/len, 2).
    Khi không có rating, average_rating == null.
    Validates: Req 2.1, 2.2, 2.4, 8.3
    """
    owner = make_user('p10_prop3_owner@example.com', 'p10prop3owner')
    client = APIClient()

    recipe = make_recipe(owner, visibility='PUBLIC', title='Recipe for ratings p3')

    # Tạo reviewers và reviews
    for i, rating in enumerate(ratings):
        reviewer = make_user(f'p10_prop3_rev{i}@example.com', f'p10prop3rev{i}')
        make_review(reviewer, recipe, rating)

    response = client.get(f'/api/accounts/{owner.pk}/stats/')
    assert response.status_code == 200

    data = response.json()
    assert data['success'] is True
    actual = data['data']['average_rating']

    if not ratings:
        assert actual is None, f"average_rating phải là null khi không có review, nhận được {actual}"
    else:
        expected = round(sum(ratings) / len(ratings), 2)
        assert actual == expected, (
            f"average_rating={actual}, mong đợi {expected} từ ratings={ratings}"
        )

    # Cleanup
    Review.objects.filter(recipe=recipe).delete()
    Recipe.objects.filter(id=recipe.id).delete()


@pytest.mark.django_db(transaction=True)
@given(k=st.integers(min_value=1, max_value=10))
@h_settings(max_examples=50, suppress_health_check=[HealthCheck.function_scoped_fixture], deadline=None)
def test_view_count_increments_correctly(k, db):
    """
    # Feature: phase-10-statistics-analytics, Property 4
    Sau K lần gọi GET /api/recipes/{id}/ trên PUBLIC recipe, view_count tăng đúng K.
    PRIVATE recipe không tăng view_count.
    Validates: Req 4.1, 4.2, 7.5, 8.4
    """
    user = make_user('p10_prop4@example.com', 'p10prop4user')
    client = APIClient()

    # Test PUBLIC recipe
    public_recipe = make_recipe(user, visibility='PUBLIC', title='Public recipe p4')
    initial_count = public_recipe.view_count  # = 0

    for _ in range(k):
        response = client.get(f'/api/recipes/{public_recipe.pk}/')
        assert response.status_code == 200

    public_recipe.refresh_from_db()
    assert public_recipe.view_count == initial_count + k, (
        f"view_count={public_recipe.view_count}, mong đợi {initial_count + k} sau {k} lần xem"
    )

    # Test PRIVATE recipe — view_count không được tăng
    private_recipe = make_recipe(user, visibility='PRIVATE', title='Private recipe p4')
    initial_private_count = private_recipe.view_count  # = 0

    for _ in range(k):
        # Không auth → 404, không tăng view_count
        response = client.get(f'/api/recipes/{private_recipe.pk}/')
        assert response.status_code == 404

    private_recipe.refresh_from_db()
    assert private_recipe.view_count == initial_private_count, (
        f"PRIVATE recipe view_count={private_recipe.view_count}, mong đợi {initial_private_count} (không đổi)"
    )

    # Cleanup
    Recipe.objects.filter(user=user).delete()


@pytest.mark.django_db(transaction=True)
@given(n_saves=st.integers(min_value=0, max_value=10))
@h_settings(max_examples=50, suppress_health_check=[HealthCheck.function_scoped_fixture], deadline=None)
def test_save_count_equals_collection_recipe(n_saves, db):
    """
    # Feature: phase-10-statistics-analytics, Property 5
    save_count trong Recipe Stats phải bằng đúng số CollectionRecipe liên kết với recipe.
    Validates: Req 5.2, 7.3, 8.5
    """
    owner = make_user('p10_prop5_owner@example.com', 'p10prop5owner')
    client = APIClient()

    recipe = make_recipe(owner, visibility='PUBLIC', title='Recipe for save_count p5')

    # Tạo S users lưu recipe này
    for i in range(n_saves):
        saver = make_user(f'p10_prop5_saver{i}@example.com', f'p10prop5saver{i}')
        make_collection_recipe(saver, recipe)

    response = client.get(f'/api/recipes/{recipe.pk}/stats/')
    assert response.status_code == 200

    data = response.json()
    assert data['success'] is True
    assert data['data']['save_count'] == n_saves, (
        f"save_count={data['data']['save_count']}, mong đợi {n_saves}"
    )

    # Cleanup
    CollectionRecipe.objects.filter(recipe=recipe).delete()
    Recipe.objects.filter(id=recipe.id).delete()
