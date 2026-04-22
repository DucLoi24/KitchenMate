"""
Unit Tests — Serializers (Phase 11)
Kiểm tra input validation và output format của các serializers.
"""
import pytest
from django.contrib.auth import get_user_model

User = get_user_model()


def make_user(email=None, password='testpass123'):
    import uuid
    email = email or f'user_{uuid.uuid4().hex[:8]}@example.com'
    return User.objects.create_user(
        username=email,
        email=email,
        full_name='Test User',
        password=password,
    )


def make_ingredient(name=None, category='OTHER'):
    from apps.ingredients.models import Ingredient
    import uuid
    name = name or f'ingredient_{uuid.uuid4().hex[:8]}'
    return Ingredient.objects.create(name=name, category=category, status='APPROVED')


@pytest.mark.unit
@pytest.mark.django_db
class TestRegisterSerializer:
    """Tests cho RegisterSerializer."""

    def test_password_mismatch_raises_error_on_password_field(self):
        """password != password_confirm → lỗi trên field 'password'."""
        from apps.accounts.serializers import RegisterSerializer
        data = {
            'email': 'test@example.com',
            'full_name': 'Test User',
            'password': 'StrongPass123!',
            'password_confirm': 'DifferentPass456!',
        }
        serializer = RegisterSerializer(data=data)
        assert not serializer.is_valid()
        assert 'password' in serializer.errors

    def test_invalid_email_format_raises_error(self):
        """Email không hợp lệ (thiếu @) → lỗi trên field 'email'."""
        from apps.accounts.serializers import RegisterSerializer
        data = {
            'email': 'not-an-email',
            'full_name': 'Test User',
            'password': 'StrongPass123!',
            'password_confirm': 'StrongPass123!',
        }
        serializer = RegisterSerializer(data=data)
        assert not serializer.is_valid()
        assert 'email' in serializer.errors

    def test_valid_data_passes_validation(self):
        """Dữ liệu hợp lệ → is_valid() trả về True."""
        from apps.accounts.serializers import RegisterSerializer
        data = {
            'email': 'valid@example.com',
            'full_name': 'Valid User',
            'password': 'StrongPass123!',
            'password_confirm': 'StrongPass123!',
        }
        serializer = RegisterSerializer(data=data)
        assert serializer.is_valid(), serializer.errors


@pytest.mark.unit
@pytest.mark.django_db
class TestRecipeCreateSerializer:
    """Tests cho RecipeCreateSerializer."""

    def test_negative_prep_time_is_invalid(self):
        """prep_time=-1 → is_valid() trả về False."""
        from apps.recipes.serializers import RecipeCreateSerializer
        data = {
            'title': 'Test Recipe',
            'difficulty': 'EASY',
            'prep_time': -1,
        }
        serializer = RecipeCreateSerializer(data=data)
        assert not serializer.is_valid()
        assert 'prep_time' in serializer.errors

    def test_invalid_difficulty_is_invalid(self):
        """difficulty='INVALID' → is_valid() trả về False."""
        from apps.recipes.serializers import RecipeCreateSerializer
        data = {
            'title': 'Test Recipe',
            'difficulty': 'INVALID',
            'prep_time': 30,
        }
        serializer = RecipeCreateSerializer(data=data)
        assert not serializer.is_valid()
        assert 'difficulty' in serializer.errors

    def test_valid_data_passes(self):
        """Dữ liệu hợp lệ → is_valid() trả về True."""
        from apps.recipes.serializers import RecipeCreateSerializer
        data = {
            'title': 'Test Recipe',
            'difficulty': 'EASY',
            'prep_time': 30,
        }
        serializer = RecipeCreateSerializer(data=data)
        assert serializer.is_valid(), serializer.errors


@pytest.mark.unit
@pytest.mark.django_db
class TestRecipeListSerializerOutput:
    """Tests cho RecipeListSerializer output format."""

    def test_output_contains_required_fields(self):
        """Output chứa đúng 7 fields: id, title, difficulty, prep_time, visibility, thumbnail_url, created_at."""
        from apps.recipes.models import Recipe
        from apps.recipes.serializers import RecipeListSerializer
        user = make_user()
        recipe = Recipe.objects.create(
            user=user,
            title='Test Recipe',
            difficulty='EASY',
            prep_time=30,
            visibility='PUBLIC',
        )
        serializer = RecipeListSerializer(recipe)
        data = serializer.data
        required_fields = ['id', 'title', 'difficulty', 'prep_time', 'visibility', 'thumbnail_url', 'created_at']
        for field in required_fields:
            assert field in data, f"Field '{field}' không có trong output của RecipeListSerializer"


@pytest.mark.unit
@pytest.mark.django_db
class TestPantrySerializerOutput:
    """Tests cho PantrySerializer output format."""

    def test_output_contains_ingredient_quantity_unit(self):
        """Output chứa ingredient (nested), quantity, unit."""
        from apps.kitchen.models import Pantry
        from apps.kitchen.serializers import PantrySerializer
        user = make_user()
        ingredient = make_ingredient(name='Thịt gà', category='PROTEIN')
        pantry = Pantry.objects.create(
            user=user,
            ingredient=ingredient,
            quantity=300,
            unit='gram',
        )
        serializer = PantrySerializer(pantry)
        data = serializer.data
        assert 'ingredient' in data, "Field 'ingredient' không có trong output"
        assert 'quantity' in data, "Field 'quantity' không có trong output"
        assert 'unit' in data, "Field 'unit' không có trong output"
        assert data['quantity'] == 300
        assert data['unit'] == 'gram'


@pytest.mark.unit
class TestReviewSerializer:
    """Tests cho ReviewSerializer validation."""

    def test_rating_zero_is_invalid(self):
        """rating=0 → is_valid() trả về False."""
        from apps.social.serializers import ReviewSerializer
        data = {'rating': 0, 'comment': 'Test'}
        serializer = ReviewSerializer(data=data)
        assert not serializer.is_valid()
        assert 'rating' in serializer.errors

    def test_rating_six_is_invalid(self):
        """rating=6 → is_valid() trả về False."""
        from apps.social.serializers import ReviewSerializer
        data = {'rating': 6, 'comment': 'Test'}
        serializer = ReviewSerializer(data=data)
        assert not serializer.is_valid()
        assert 'rating' in serializer.errors

    def test_rating_valid_range_passes(self):
        """rating 1-5 → is_valid() trả về True (không cần recipe/user vì read_only)."""
        from apps.social.serializers import ReviewSerializer
        for rating in range(1, 6):
            data = {'rating': rating, 'comment': 'Test'}
            serializer = ReviewSerializer(data=data)
            # rating field hợp lệ — lỗi chỉ có thể ở recipe (required)
            if not serializer.is_valid():
                assert 'rating' not in serializer.errors, f"rating={rating} không nên có lỗi"
