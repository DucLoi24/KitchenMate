"""
Integration tests (example-based) cho Phase 10: Statistics & Analytics.
Kiểm tra các trường hợp cụ thể của User Stats và Recipe Stats endpoints.
"""
import uuid
import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

from apps.recipes.models import Recipe
from apps.social.models import Review, Collection, CollectionRecipe

User = get_user_model()

# ==============================================================================
# FIXTURES
# ==============================================================================

@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def user(db):
    u = User.objects.create_user(
        email='stats_owner@example.com',
        username='stats_owner',
        full_name='Stats Owner',
        password='testpass123',
    )
    return u


@pytest.fixture
def other_user(db):
    u = User.objects.create_user(
        email='stats_other@example.com',
        username='stats_other',
        full_name='Other User',
        password='testpass123',
    )
    return u


@pytest.fixture
def public_recipe(user):
    return Recipe.objects.create(
        user=user,
        title='Công thức công khai',
        description='Mô tả',
        difficulty='EASY',
        prep_time=30,
        visibility='PUBLIC',
    )


@pytest.fixture
def private_recipe(user):
    return Recipe.objects.create(
        user=user,
        title='Công thức riêng tư',
        description='Mô tả',
        difficulty='EASY',
        prep_time=30,
        visibility='PRIVATE',
    )


# ==============================================================================
# USER STATS TESTS
# ==============================================================================

@pytest.mark.django_db
def test_user_stats_not_found(client):
    """Test 7.2: GET /api/accounts/{id}/stats/ với user không tồn tại → HTTP 404"""
    fake_id = uuid.uuid4()
    response = client.get(f'/api/accounts/{fake_id}/stats/')
    assert response.status_code == 404


@pytest.mark.django_db
def test_user_stats_empty_data(client, user):
    """Test 7.3: User không có data → recipe_count=0, total_likes=0, average_rating=null"""
    response = client.get(f'/api/accounts/{user.pk}/stats/')
    assert response.status_code == 200

    data = response.json()['data']
    assert data['recipe_count'] == 0
    assert data['total_likes'] == 0
    assert data['average_rating'] is None


@pytest.mark.django_db
def test_user_stats_has_all_fields(client, user):
    """Test 7.4: Response có đầy đủ 3 fields: recipe_count, total_likes, average_rating"""
    response = client.get(f'/api/accounts/{user.pk}/stats/')
    assert response.status_code == 200

    data = response.json()['data']
    assert 'recipe_count' in data
    assert 'total_likes' in data
    assert 'average_rating' in data


@pytest.mark.django_db
def test_user_stats_no_auth_required(client, user):
    """Test 7.5: GET /api/accounts/{id}/stats/ không cần auth → HTTP 200"""
    # client không có auth token
    response = client.get(f'/api/accounts/{user.pk}/stats/')
    assert response.status_code == 200
    assert response.json()['success'] is True


@pytest.mark.django_db
def test_user_stats_counts_correctly(client, user, other_user, public_recipe):
    """Kiểm tra recipe_count, total_likes, average_rating với dữ liệu thực tế."""
    # Tạo thêm 1 PRIVATE recipe (không được đếm vào recipe_count)
    Recipe.objects.create(
        user=user, title='Private', description='', difficulty='EASY',
        prep_time=10, visibility='PRIVATE'
    )

    # other_user lưu public_recipe vào collection
    collection = Collection.objects.create(user=other_user, name='My Collection')
    CollectionRecipe.objects.create(collection=collection, recipe=public_recipe)

    # other_user review public_recipe với rating=4
    Review.objects.create(user=other_user, recipe=public_recipe, rating=4)

    response = client.get(f'/api/accounts/{user.pk}/stats/')
    assert response.status_code == 200

    data = response.json()['data']
    assert data['recipe_count'] == 1       # chỉ PUBLIC
    assert data['total_likes'] == 1        # 1 CollectionRecipe
    assert data['average_rating'] == 4.0   # round(4/1, 2)


# ==============================================================================
# RECIPE STATS TESTS
# ==============================================================================

@pytest.mark.django_db
def test_recipe_stats_public_no_auth(client, public_recipe):
    """Test 7.6: GET /api/recipes/{id}/stats/ với recipe PUBLIC, không auth → HTTP 200 với đầy đủ fields"""
    response = client.get(f'/api/recipes/{public_recipe.pk}/stats/')
    assert response.status_code == 200

    data = response.json()
    assert data['success'] is True
    stats = data['data']
    assert 'recipe_id' in stats
    assert 'average_rating' in stats
    assert 'review_count' in stats
    assert 'view_count' in stats
    assert 'save_count' in stats
    assert stats['recipe_id'] == str(public_recipe.pk)


@pytest.mark.django_db
def test_recipe_stats_private_no_auth(client, private_recipe):
    """Test 7.7: GET /api/recipes/{id}/stats/ với recipe PRIVATE, không auth → HTTP 404"""
    response = client.get(f'/api/recipes/{private_recipe.pk}/stats/')
    assert response.status_code == 404


@pytest.mark.django_db
def test_recipe_stats_private_owner(client, user, private_recipe):
    """Test 7.8: GET /api/recipes/{id}/stats/ với recipe PRIVATE, là owner → HTTP 200"""
    client.force_authenticate(user=user)
    response = client.get(f'/api/recipes/{private_recipe.pk}/stats/')
    assert response.status_code == 200
    assert response.json()['success'] is True


@pytest.mark.django_db
def test_recipe_stats_not_found(client):
    """Test 7.9: GET /api/recipes/{id}/stats/ với UUID không tồn tại → HTTP 404"""
    fake_id = uuid.uuid4()
    response = client.get(f'/api/recipes/{fake_id}/stats/')
    assert response.status_code == 404


@pytest.mark.django_db
def test_recipe_stats_no_reviews(client, public_recipe):
    """Test 7.10: Recipe chưa có review → average_rating=null, review_count=0"""
    response = client.get(f'/api/recipes/{public_recipe.pk}/stats/')
    assert response.status_code == 200

    stats = response.json()['data']
    assert stats['average_rating'] is None
    assert stats['review_count'] == 0


@pytest.mark.django_db
def test_view_count_not_increment_private(client, user, private_recipe):
    """Test 7.11: GET /api/recipes/{id}/ với recipe PRIVATE → view_count không tăng"""
    initial_count = private_recipe.view_count

    # Không auth → 404
    response = client.get(f'/api/recipes/{private_recipe.pk}/')
    assert response.status_code == 404

    private_recipe.refresh_from_db()
    assert private_recipe.view_count == initial_count


@pytest.mark.django_db
def test_view_count_increments_public(client, public_recipe):
    """Test 7.12: GET /api/recipes/{id}/ với recipe PUBLIC → view_count tăng 1 trong database"""
    initial_count = public_recipe.view_count

    response = client.get(f'/api/recipes/{public_recipe.pk}/')
    assert response.status_code == 200

    public_recipe.refresh_from_db()
    assert public_recipe.view_count == initial_count + 1
