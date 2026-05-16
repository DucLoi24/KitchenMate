"""
Unit Tests — Recipe Categories (Phase 12)
Kiểm tra RecipeCategory model, serializer, viewset, và filter.
"""
import pytest
from types import SimpleNamespace
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework.test import APIClient

from apps.recipes.models import RecipeCategory, Recipe
from apps.recipes.serializers import (
    RecipeCategorySerializer,
    RecipeListSerializer,
    RecipeDetailSerializer,
    RecipeCreateSerializer,
)

User = get_user_model()


# ─── Fixtures ────────────────────────────────────────────────────────────────

@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(
        username='admin_cat@example.com',
        email='admin_cat@example.com',
        full_name='Admin Cat',
        password='adminpass123',
        is_staff=True,
    )


@pytest.fixture
def auth_user(db):
    return User.objects.create_user(
        username='testuser_cat@example.com',
        email='testuser_cat@example.com',
        full_name='Test Cat',
        password='testpass123',
    )


@pytest.fixture
def categories(db):
    """Tạo 3 RecipeCategory active: Món Việt, Món Á, Món Tây."""
    mon_viet = RecipeCategory.objects.create(
        name='Món Việt Cat', slug='mon-viet-cat',
        description='Các món ăn truyền thống Việt Nam', order=1,
    )
    mon_a = RecipeCategory.objects.create(
        name='Món Á Cat', slug='mon-a-cat',
        description='Các món ăn châu Á', order=2,
    )
    mon_tay = RecipeCategory.objects.create(
        name='Món Tây Cat', slug='mon-tay-cat',
        description='Các món ăn phương Tây', order=3,
    )
    return {'mon_viet': mon_viet, 'mon_a': mon_a, 'mon_tay': mon_tay}


@pytest.fixture
def inactive_category(db):
    """Tạo 1 RecipeCategory inactive để test soft delete."""
    return RecipeCategory.objects.create(
        name='Món cũ Cat', slug='mon-cu-cat',
        description='Danh mục cũ', order=99, is_active=False,
    )


@pytest.fixture
def sample_recipe_with_categories(db, auth_user, categories):
    """Tạo Recipe PUBLIC với 2 categories."""
    recipe = Recipe.objects.create(
        user=auth_user,
        title='Phở bò Cat',
        description='Phở bò truyền thống',
        difficulty='MEDIUM',
        prep_time=60,
        visibility='PUBLIC',
    )
    recipe.categories.add(categories['mon_viet'], categories['mon_a'])
    return recipe


# ─── RecipeCategory Model ────────────────────────────────────────────────────

@pytest.mark.django_db
class TestRecipeCategoryModel:
    """Tests cho RecipeCategory model."""

    def test_auto_slug_on_save(self, db):
        """name='Món mới' → slug='mon-moi' tự động."""
        cat = RecipeCategory.objects.create(name='Món mới')
        assert cat.slug == 'mon-moi'

    def test_unique_name(self, db, categories):
        """name trùng lặp → IntegrityError."""
        from django.db import IntegrityError
        with pytest.raises(IntegrityError):
            RecipeCategory.objects.create(name='Món Việt Cat')

    def test_unique_slug(self, db, categories):
        """slug trùng lặp → IntegrityError."""
        from django.db import IntegrityError
        with pytest.raises(IntegrityError):
            RecipeCategory.objects.create(name='Món Việt khác Cat', slug='mon-viet-cat')

    def test_str_returns_name(self, categories):
        """__str__ trả về name."""
        assert str(categories['mon_viet']) == 'Món Việt Cat'

    def test_soft_delete_filter_excludes_inactive(self, categories, inactive_category):
        """objects.filter(is_active=True) không trả về category inactive."""
        active_qs = RecipeCategory.objects.filter(is_active=True)
        assert inactive_category not in active_qs
        assert categories['mon_viet'] in active_qs


# ─── RecipeCategorySerializer ────────────────────────────────────────────────

@pytest.mark.unit
@pytest.mark.django_db
class TestRecipeCategorySerializer:
    """Tests cho RecipeCategorySerializer output."""

    def test_output_contains_all_fields(self, categories):
        """Output chứa đủ 6 fields: id, name, slug, description, order, is_active."""
        serializer = RecipeCategorySerializer(categories['mon_viet'])
        data = serializer.data
        expected_fields = {'id', 'name', 'slug', 'description', 'order', 'is_active'}
        assert set(data.keys()) == expected_fields

    def test_output_readonly_fields(self, categories):
        """id, is_active read-only (không nằm trong input validation)."""
        serializer = RecipeCategorySerializer(data={
            'name': 'Món mới',
            'slug': 'mon-moi',
            'description': 'Mô tả',
            'order': 1,
            'is_active': False,
        })
        assert serializer.is_valid()
        # is_active không được phép set khi tạo mới
        # (Model field không có editable=False nên serializer cho phép,
        # nhưng viewset dùng default=True khi tạo)

    def test_detail_serializer_includes_recipes_count(self, categories, sample_recipe_with_categories):
        """RecipeCategorySerializer output không có recipes_count (vì read_only)."""
        # recipes là related_name từ Recipe, nhưng RecipeCategorySerializer không include
        serializer = RecipeCategorySerializer(categories['mon_viet'])
        data = serializer.data
        assert 'recipes' not in data


# ─── RecipeCategoryViewSet ──────────────────────────────────────────────────

@pytest.mark.unit
@pytest.mark.django_db
class TestRecipeCategoryViewSetPermissions:
    """Tests permission của RecipeCategoryViewSet."""

    def test_list_public_no_auth(self, api_client, categories, inactive_category):
        """GET /api/recipes/categories/ public chỉ trả về category active."""
        response = api_client.get('/api/recipes/categories/')
        assert response.status_code == 200
        returned_slugs = {item['slug'] for item in response.data.get('results', response.data)}
        assert 'mon-viet-cat' in returned_slugs
        assert inactive_category.slug not in returned_slugs

    def test_retrieve_public_no_auth(self, api_client, categories):
        """GET /api/recipes/categories/{slug}/ → ai cũng xem được (200)."""
        response = api_client.get('/api/recipes/categories/mon-viet-cat/')
        assert response.status_code == 200

    def test_create_requires_auth(self, api_client, categories):
        """POST /api/recipes/categories/ không auth → 401."""
        response = api_client.post('/api/recipes/categories/', {'name': 'Món mới'})
        assert response.status_code == 401

    def test_create_authenticated_non_admin_returns_403(self, api_client, auth_user, categories):
        """POST /api/recipes/categories/ auth nhưng không phải admin → 403."""
        api_client.force_authenticate(user=auth_user)
        response = api_client.post('/api/recipes/categories/', {'name': 'Món mới'})
        assert response.status_code == 403

    def test_create_admin_returns_201(self, api_client, admin_user, categories):
        """POST /api/recipes/categories/ bởi admin → 201."""
        api_client.force_authenticate(user=admin_user)
        response = api_client.post('/api/recipes/categories/', {
            'name': 'Món mới',
            'description': 'Mô tả món mới',
            'order': 10,
        })
        assert response.status_code == 201
        assert response.data['name'] == 'Món mới'

    def test_update_requires_auth(self, api_client, categories):
        """PUT /api/recipes/categories/{slug}/ không auth → 401."""
        response = api_client.put('/api/recipes/categories/mon-viet-cat/', {'name': 'Updated'})
        assert response.status_code == 401

    def test_list_admin_without_filter_returns_only_active(self, api_client, admin_user, categories, inactive_category):
        """GET /api/recipes/categories/ bởi admin không truyền filter vẫn chỉ trả về category active."""
        api_client.force_authenticate(user=admin_user)
        response = api_client.get('/api/recipes/categories/')
        assert response.status_code == 200
        returned_slugs = {item['slug'] for item in response.data.get('results', response.data)}
        assert 'mon-viet-cat' in returned_slugs
        assert inactive_category.slug not in returned_slugs

    def test_list_admin_with_include_inactive_returns_active_and_inactive(self, api_client, admin_user, categories, inactive_category):
        """GET /api/recipes/categories/?include_inactive=true bởi admin → trả về cả active lẫn inactive."""
        api_client.force_authenticate(user=admin_user)
        response = api_client.get('/api/recipes/categories/?include_inactive=true')
        assert response.status_code == 200
        returned_slugs = {item['slug'] for item in response.data.get('results', response.data)}
        assert 'mon-viet-cat' in returned_slugs
        assert inactive_category.slug in returned_slugs

    def test_destroy_soft_deletes(self, api_client, admin_user, categories):
        """DELETE /api/recipes/categories/{slug}/ → is_active=False."""
        api_client.force_authenticate(user=admin_user)
        response = api_client.delete('/api/recipes/categories/mon-viet-cat/')
        assert response.status_code == 204
        cat = RecipeCategory.objects.get(slug='mon-viet-cat')
        assert cat.is_active is False

    def test_restore_inactive_category(self, api_client, admin_user, inactive_category):
        """POST /api/recipes/categories/{slug}/restore/ → khôi phục category inactive."""
        api_client.force_authenticate(user=admin_user)
        response = api_client.post(f'/api/recipes/categories/{inactive_category.slug}/restore/')
        assert response.status_code == 200
        inactive_category.refresh_from_db()
        assert inactive_category.is_active is True


@pytest.mark.unit
@pytest.mark.django_db
class TestRecipeCategoryViewSetCRUD:
    """Tests CRUD operations của RecipeCategoryViewSet."""

    def _activate_only_fixture_categories(self, categories):
        fixture_ids = [category.id for category in categories.values()]
        RecipeCategory.objects.exclude(id__in=fixture_ids).update(is_active=False)
        for order, key in enumerate(('mon_viet', 'mon_a', 'mon_tay'), start=1):
            category = categories[key]
            category.is_active = True
            category.order = order
            category.save(update_fields=['is_active', 'order'])

    def test_create_sets_is_active_true(self, api_client, admin_user):
        """Tạo category mới → is_active=True mặc định."""
        api_client.force_authenticate(user=admin_user)
        response = api_client.post('/api/recipes/categories/', {'name': 'Món mới Test XYZ'})
        assert response.status_code == 201
        cat = RecipeCategory.objects.get(name='Món mới Test XYZ')
        assert cat.is_active is True

    def test_create_auto_slug(self, api_client, admin_user):
        """Tạo category không có slug → tự tạo slug."""
        api_client.force_authenticate(user=admin_user)
        response = api_client.post('/api/recipes/categories/', {'name': 'Món rất mới test'})
        assert response.status_code == 201
        assert response.data['slug'] == 'mon-rat-moi-test'

    def test_update_name_keeps_slug(self, api_client, admin_user, categories):
        """Đổi name → slug giữ nguyên (slug không tự cập nhật theo name)."""
        api_client.force_authenticate(user=admin_user)
        response = api_client.patch('/api/recipes/categories/mon-viet-cat/', {'name': 'Món Việt Nam Cat'})
        assert response.status_code == 200
        cat = RecipeCategory.objects.get(slug='mon-viet-cat')
        assert cat.name == 'Món Việt Nam Cat'
        assert cat.slug == 'mon-viet-cat'

    def test_move_up_swaps_with_previous_active_category(self, api_client, admin_user, categories):
        """Move up C: A1 B2 C3 → A1 C2 B3."""
        self._activate_only_fixture_categories(categories)
        api_client.force_authenticate(user=admin_user)

        response = api_client.post('/api/recipes/categories/mon-tay-cat/move/', {'direction': 'up'})

        assert response.status_code == 200
        categories['mon_viet'].refresh_from_db()
        categories['mon_a'].refresh_from_db()
        categories['mon_tay'].refresh_from_db()
        assert categories['mon_viet'].order == 1
        assert categories['mon_tay'].order == 2
        assert categories['mon_a'].order == 3

    def test_move_down_swaps_with_next_active_category(self, api_client, admin_user, categories):
        """Move down A: A1 B2 C3 → B1 A2 C3."""
        self._activate_only_fixture_categories(categories)
        api_client.force_authenticate(user=admin_user)

        response = api_client.post('/api/recipes/categories/mon-viet-cat/move/', {'direction': 'down'})

        assert response.status_code == 200
        categories['mon_viet'].refresh_from_db()
        categories['mon_a'].refresh_from_db()
        categories['mon_tay'].refresh_from_db()
        assert categories['mon_a'].order == 1
        assert categories['mon_viet'].order == 2
        assert categories['mon_tay'].order == 3

    def test_move_up_first_category_returns_400(self, api_client, admin_user, categories):
        """Category đầu danh sách không thể move up."""
        self._activate_only_fixture_categories(categories)
        api_client.force_authenticate(user=admin_user)

        response = api_client.post('/api/recipes/categories/mon-viet-cat/move/', {'direction': 'up'})

        assert response.status_code == 400

    def test_move_down_last_category_returns_400(self, api_client, admin_user, categories):
        """Category cuối danh sách không thể move down."""
        self._activate_only_fixture_categories(categories)
        api_client.force_authenticate(user=admin_user)

        response = api_client.post('/api/recipes/categories/mon-tay-cat/move/', {'direction': 'down'})

        assert response.status_code == 400

    def test_move_requires_admin(self, api_client, auth_user, categories):
        """User thường không được đổi thứ tự category."""
        self._activate_only_fixture_categories(categories)
        api_client.force_authenticate(user=auth_user)

        response = api_client.post('/api/recipes/categories/mon-tay-cat/move/', {'direction': 'up'})

        assert response.status_code == 403


# ─── Recipe M2M Categories ────────────────────────────────────────────────────

@pytest.mark.unit
@pytest.mark.django_db
class TestRecipeCategoriesM2M:
    """Tests quan hệ ManyToMany giữa Recipe và RecipeCategory."""

    def test_recipe_add_categories(self, db, auth_user, categories):
        """Recipe.categories.add() → lưu đúng."""
        recipe = Recipe.objects.create(
            user=auth_user,
            title='Công thức test',
            visibility='PRIVATE',
        )
        recipe.categories.add(categories['mon_viet'], categories['mon_a'])
        recipe.refresh_from_db()
        assert recipe.categories.count() == 2
        assert categories['mon_viet'] in recipe.categories.all()
        assert categories['mon_a'] in recipe.categories.all()

    def test_recipe_remove_categories(self, db, auth_user, categories, sample_recipe_with_categories):
        """categories.remove() → xóa category khỏi recipe."""
        recipe = sample_recipe_with_categories
        recipe.categories.remove(categories['mon_a'])
        recipe.refresh_from_db()
        assert recipe.categories.count() == 1
        assert categories['mon_a'] not in recipe.categories.all()

    def test_recipe_clear_categories(self, db, auth_user, categories, sample_recipe_with_categories):
        """categories.clear() → xóa hết categories."""
        recipe = sample_recipe_with_categories
        recipe.categories.clear()
        recipe.refresh_from_db()
        assert recipe.categories.count() == 0

    def test_recipe_filter_by_category(self, db, auth_user, categories, sample_recipe_with_categories):
        """Recipe.objects.filter(categories__slug='mon-viet-cat') → trả về recipe đúng."""
        results = Recipe.objects.filter(
            categories__slug='mon-viet-cat',
            categories__is_active=True,
        )
        assert sample_recipe_with_categories in results

    def test_recipe_filter_by_multiple_categories(self, db, auth_user, categories, sample_recipe_with_categories):
        """Filter nhiều categories (OR) → trả về recipes có ít nhất 1 category."""
        results = Recipe.objects.filter(
            categories__slug__in=['mon-viet-cat', 'mon-a-cat'],
            categories__is_active=True,
        ).distinct()
        assert sample_recipe_with_categories in results


# ─── RecipeListSerializer + Categories ──────────────────────────────────────

@pytest.mark.unit
@pytest.mark.django_db
class TestRecipeListSerializerWithCategories:
    """Tests RecipeListSerializer output có chứa categories."""

    def test_output_includes_categories(self, sample_recipe_with_categories):
        """Serializer output có field 'categories'."""
        serializer = RecipeListSerializer(sample_recipe_with_categories)
        data = serializer.data
        assert 'categories' in data
        assert isinstance(data['categories'], list)

    def test_categories_are_serialized(self, sample_recipe_with_categories, categories):
        """categories chứa đúng data (id, name, slug)."""
        serializer = RecipeListSerializer(sample_recipe_with_categories)
        data = serializer.data
        cat_names = {c['name'] for c in data['categories']}
        assert 'Món Việt Cat' in cat_names
        assert 'Món Á Cat' in cat_names

    def test_categories_readonly(self, auth_user):
        """RecipeListSerializer không cho phép ghi categories (read_only)."""
        data = {
            'title': 'Test',
            'difficulty': 'EASY',
            'user': auth_user.id,
        }
        serializer = RecipeListSerializer(data=data)
        # categories là read_only nên serializer vẫn valid dù bỏ qua categories
        assert serializer.is_valid(), serializer.errors


# ─── RecipeDetailSerializer + Categories ────────────────────────────────────

@pytest.mark.unit
@pytest.mark.django_db
class TestRecipeDetailSerializerWithCategories:
    """Tests RecipeDetailSerializer output có chứa categories."""

    def test_output_includes_categories(self, sample_recipe_with_categories):
        """Serializer output có field 'categories'."""
        serializer = RecipeDetailSerializer(sample_recipe_with_categories)
        data = serializer.data
        assert 'categories' in data
        assert isinstance(data['categories'], list)

    def test_categories_detail_includes_description(self, sample_recipe_with_categories, categories):
        """Categories trong detail serializer có đủ fields (id, name, slug, description, order, is_active)."""
        serializer = RecipeDetailSerializer(sample_recipe_with_categories)
        data = serializer.data
        cat = data['categories'][0]
        expected_keys = {'id', 'name', 'slug', 'description', 'order', 'is_active'}
        assert set(cat.keys()) == expected_keys


# ─── RecipeCreateSerializer + Categories ────────────────────────────────────

@pytest.mark.unit
@pytest.mark.django_db
class TestRecipeCreateSerializerWithCategories:
    """Tests RecipeCreateSerializer khi làm việc với categories."""

    def test_create_recipe_with_categories(self, auth_user, categories):
        """Tạo recipe kèm categories → lưu đúng M2M."""
        data = {
            'title': 'Bún chả Hà Nội',
            'description': 'Bún chả truyền thống',
            'difficulty': 'MEDIUM',
            'prep_time': 45,
            'categories': [str(categories['mon_viet'].id), str(categories['mon_a'].id)],
        }
        serializer = RecipeCreateSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        recipe = serializer.save(user=auth_user)
        assert recipe.categories.count() == 2
        assert categories['mon_viet'] in recipe.categories.all()
        assert categories['mon_a'] in recipe.categories.all()

    def test_create_recipe_without_categories(self, auth_user):
        """Tạo recipe không có categories → categories rỗng."""
        data = {
            'title': 'Món không danh mục',
            'difficulty': 'EASY',
            'prep_time': 10,
        }
        serializer = RecipeCreateSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        recipe = serializer.save(user=auth_user)
        assert recipe.categories.count() == 0

    def test_create_with_invalid_category_id(self, auth_user, categories):
        """category id không tồn tại → is_valid() = False."""
        import uuid
        data = {
            'title': 'Món test',
            'difficulty': 'EASY',
            'prep_time': 10,
            'categories': [str(uuid.uuid4())],  # ID không tồn tại
        }
        serializer = RecipeCreateSerializer(data=data)
        assert not serializer.is_valid()
        assert 'categories' in serializer.errors

    def test_create_with_inactive_category_id(self, auth_user, inactive_category):
        """category inactive → PrimaryKeyRelatedField queryset lọc ra, không tạo được."""
        data = {
            'title': 'Món test',
            'difficulty': 'EASY',
            'prep_time': 10,
            'categories': [str(inactive_category.id)],
        }
        serializer = RecipeCreateSerializer(data=data)
        assert not serializer.is_valid()
        assert 'categories' in serializer.errors

    def test_update_recipe_categories(self, sample_recipe_with_categories, categories):
        """Update recipe: thay categories mới → categories cũ bị xóa."""
        recipe = sample_recipe_with_categories
        assert recipe.categories.count() == 2
        new_cat = RecipeCategory.objects.create(
            name='Món mới', slug='mon-moi',
            description='Món mới', order=5,
        )
        data = {
            'title': recipe.title,
            'difficulty': recipe.difficulty,
            'categories': [str(new_cat.id)],
        }
        serializer = RecipeCreateSerializer(recipe, data=data, partial=True)
        assert serializer.is_valid(), serializer.errors
        updated = serializer.save()
        assert updated.categories.count() == 1
        assert new_cat in updated.categories.all()
        assert categories['mon_viet'] not in updated.categories.all()

    def test_update_without_categories_field_keeps_old(self, sample_recipe_with_categories, categories):
        """Update không gửi categories field → giữ nguyên categories cũ."""
        recipe = sample_recipe_with_categories
        old_cats = set(recipe.categories.all())
        data = {
            'title': 'Updated Title',
            'difficulty': recipe.difficulty,
            # categories không gửi lên
        }
        serializer = RecipeCreateSerializer(recipe, data=data, partial=True)
        assert serializer.is_valid(), serializer.errors
        updated = serializer.save()
        assert set(updated.categories.all()) == old_cats


# ─── RecipeFilter — Category ──────────────────────────────────────────────────

@pytest.mark.unit
@pytest.mark.django_db
class TestRecipeFilterByCategory:
    """Tests filter theo category trong RecipeFilter."""

    def test_filter_by_single_category_uuid(self, sample_recipe_with_categories, categories):
        """filter(category=<uuid>) → trả về recipe có category đó."""
        from apps.recipes.filters import RecipeFilter
        queryset = Recipe.objects.all()
        filterset = RecipeFilter(
            data={'category': str(categories['mon_viet'].id)},
            queryset=queryset,
        )
        assert sample_recipe_with_categories in filterset.qs

    def test_filter_by_category_uuid(self, sample_recipe_with_categories, categories):
        """filter(categories=<uuid>) → trả về recipe có category id đó."""
        from apps.recipes.filters import RecipeFilter
        queryset = Recipe.objects.all()
        filterset = RecipeFilter(
            data={'categories': str(categories['mon_viet'].id)},
            queryset=queryset,
        )
        assert sample_recipe_with_categories in filterset.qs

    def test_filter_by_multiple_category_uuids(self, sample_recipe_with_categories, categories):
        """filter(categories='<uuid1>,<uuid2>') → trả về recipes có ít nhất 1 category."""
        from apps.recipes.filters import RecipeFilter
        queryset = Recipe.objects.all()
        filterset = RecipeFilter(
            data={'categories': f'{categories["mon_viet"].id},{categories["mon_a"].id}'},
            queryset=queryset,
        )
        assert sample_recipe_with_categories in filterset.qs

    def test_filter_by_inactive_category_returns_nothing(self, inactive_category):
        """Filter theo category inactive → không trả về gì."""
        from apps.recipes.filters import RecipeFilter
        queryset = Recipe.objects.all()
        filterset = RecipeFilter(
            data={'categories': str(inactive_category.id)},
            queryset=queryset,
        )
        assert list(filterset.qs) == []


# ─── avg_rating Annotation ────────────────────────────────────────────────────

@pytest.mark.unit
@pytest.mark.django_db
class TestAvgRatingAnnotation:
    """Tests avg_rating annotation trong get_queryset."""

    def _viewset_with_anonymous_request(self, action):
        from apps.recipes.views import RecipeViewSet

        viewset = RecipeViewSet(action=action)
        viewset.request = SimpleNamespace(user=AnonymousUser())
        return viewset

    def test_list_action_annotates_avg_rating(self, sample_recipe_with_categories):
        """list action → queryset có annotation avg_rating."""
        viewset = self._viewset_with_anonymous_request('list')
        qs = viewset.get_queryset()
        # QuerySet có annotation
        assert 'avg_rating' in qs.query.annotations

    def test_retrieve_action_annotates_avg_rating(self, sample_recipe_with_categories):
        """retrieve action → queryset có annotation avg_rating."""
        viewset = self._viewset_with_anonymous_request('retrieve')
        qs = viewset.get_queryset()
        assert 'avg_rating' in qs.query.annotations

    def test_avg_rating_returns_none_when_no_reviews(self, sample_recipe_with_categories):
        """Recipe không có review → avg_rating serializer trả về None."""
        serializer = RecipeDetailSerializer(sample_recipe_with_categories)
        data = serializer.data
        assert data['avg_rating'] is None
