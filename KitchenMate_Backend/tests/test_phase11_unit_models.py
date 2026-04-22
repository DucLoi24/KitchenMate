"""
Unit Tests — Model Validation & Constraints (Phase 11)
Kiểm tra tính toàn vẹn dữ liệu ở tầng model và database.
"""
import pytest
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError

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


def make_recipe(user, visibility='PRIVATE'):
    from apps.recipes.models import Recipe
    return Recipe.objects.create(
        user=user,
        title='Test Recipe',
        difficulty='EASY',
        prep_time=30,
        visibility=visibility,
    )


@pytest.mark.unit
@pytest.mark.django_db
class TestReviewConstraints:
    """Tests cho Review model — unique constraint và rating validator."""

    def test_review_unique_constraint_raises_integrity_error(self):
        """Tạo 2 Review từ cùng user cho cùng recipe → IntegrityError."""
        from apps.social.models import Review
        user = make_user()
        recipe = make_recipe(user)
        Review.objects.create(user=user, recipe=recipe, rating=4)
        with pytest.raises(IntegrityError):
            Review.objects.create(user=user, recipe=recipe, rating=3)

    def test_review_rating_zero_raises_validation_error(self):
        """rating=0 → ValidationError."""
        from apps.social.models import Review
        user = make_user()
        recipe = make_recipe(user)
        review = Review(user=user, recipe=recipe, rating=0)
        with pytest.raises(ValidationError):
            review.full_clean()

    def test_review_rating_six_raises_validation_error(self):
        """rating=6 → ValidationError."""
        from apps.social.models import Review
        user = make_user()
        recipe = make_recipe(user)
        review = Review(user=user, recipe=recipe, rating=6)
        with pytest.raises(ValidationError):
            review.full_clean()

    def test_review_rating_valid_range(self):
        """rating 1-5 đều hợp lệ."""
        from apps.social.models import Review
        user = make_user()
        recipe = make_recipe(user)
        for rating in range(1, 6):
            r = Review(user=user, recipe=recipe, rating=rating)
            r.full_clean()  # Không raise


@pytest.mark.unit
@pytest.mark.django_db
class TestPantryConstraints:
    """Tests cho Pantry model — unique constraint."""

    def test_pantry_unique_constraint_raises_integrity_error(self):
        """Tạo 2 Pantry items với cùng (user, ingredient) → IntegrityError."""
        from apps.kitchen.models import Pantry
        user = make_user()
        ingredient = make_ingredient()
        Pantry.objects.create(user=user, ingredient=ingredient, quantity=100, unit='gram')
        with pytest.raises(IntegrityError):
            Pantry.objects.create(user=user, ingredient=ingredient, quantity=200, unit='gram')


@pytest.mark.unit
@pytest.mark.django_db
class TestCollectionRecipeConstraints:
    """Tests cho CollectionRecipe model — unique constraint."""

    def test_collection_recipe_unique_constraint_raises_integrity_error(self):
        """Tạo 2 CollectionRecipe với cùng (collection, recipe) → IntegrityError."""
        from apps.social.models import Collection, CollectionRecipe
        user = make_user()
        recipe = make_recipe(user)
        collection = Collection.objects.create(user=user, name='Test Collection')
        CollectionRecipe.objects.create(collection=collection, recipe=recipe)
        with pytest.raises(IntegrityError):
            CollectionRecipe.objects.create(collection=collection, recipe=recipe)


@pytest.mark.unit
@pytest.mark.django_db
class TestRecipeStepOrdering:
    """Tests cho RecipeStep Meta ordering."""

    def test_recipe_steps_ordered_by_step_number(self):
        """Tạo steps thứ tự ngẫu nhiên, query lại → đúng thứ tự step_number."""
        from apps.recipes.models import RecipeStep
        user = make_user()
        recipe = make_recipe(user)
        # Tạo theo thứ tự ngẫu nhiên: 3, 1, 2
        RecipeStep.objects.create(recipe=recipe, step_number=3, instruction='Bước 3')
        RecipeStep.objects.create(recipe=recipe, step_number=1, instruction='Bước 1')
        RecipeStep.objects.create(recipe=recipe, step_number=2, instruction='Bước 2')

        steps = list(recipe.steps.all())
        step_numbers = [s.step_number for s in steps]
        assert step_numbers == sorted(step_numbers), "Steps phải được sắp xếp theo step_number tăng dần"


@pytest.mark.unit
@pytest.mark.django_db
class TestUserEmailConstraint:
    """Tests cho User model — email unique constraint."""

    def test_user_email_unique_raises_integrity_error(self):
        """Tạo 2 User với cùng email → IntegrityError."""
        email = 'duplicate@example.com'
        make_user(email=email)
        with pytest.raises(IntegrityError):
            User.objects.create_user(
                username='other_username',
                email=email,
                full_name='Other User',
                password='pass123',
            )


@pytest.mark.unit
@pytest.mark.django_db
class TestIngredientCategoryChoices:
    """Tests cho Ingredient category choices."""

    def test_all_valid_categories_accepted(self):
        """Tất cả 6 category hợp lệ được chấp nhận."""
        from apps.ingredients.models import Ingredient
        valid_categories = ['PROTEIN', 'CARB', 'VEG', 'SPICE', 'STAPLE', 'OTHER']
        for i, cat in enumerate(valid_categories):
            ing = Ingredient(name=f'Ingredient_{cat}_{i}', category=cat)
            ing.full_clean()  # Không raise

    def test_invalid_category_raises_validation_error(self):
        """Category ngoài danh sách → ValidationError."""
        from apps.ingredients.models import Ingredient
        ing = Ingredient(name='Invalid Cat Ingredient', category='INVALID_CATEGORY')
        with pytest.raises(ValidationError):
            ing.full_clean()


@pytest.mark.unit
@pytest.mark.django_db
class TestRecipePrepTimeValidator:
    """Tests cho Recipe.prep_time MinValueValidator."""

    def test_prep_time_zero_raises_validation_error(self):
        """prep_time=0 → ValidationError (MinValueValidator(1))."""
        from apps.recipes.models import Recipe
        user = make_user()
        recipe = Recipe(
            user=user,
            title='Test',
            difficulty='EASY',
            prep_time=0,
        )
        with pytest.raises(ValidationError):
            recipe.full_clean()

    def test_prep_time_negative_raises_validation_error(self):
        """prep_time=-1 → ValidationError."""
        from apps.recipes.models import Recipe
        user = make_user()
        recipe = Recipe(
            user=user,
            title='Test',
            difficulty='EASY',
            prep_time=-1,
        )
        with pytest.raises(ValidationError):
            recipe.full_clean()

    def test_prep_time_positive_valid(self):
        """prep_time=1 → hợp lệ."""
        from apps.recipes.models import Recipe
        user = make_user()
        recipe = Recipe(
            user=user,
            title='Test',
            difficulty='EASY',
            prep_time=1,
        )
        recipe.full_clean()  # Không raise
