"""
Unit Tests — Recommendation Algorithm PBT (Phase 11)
Property-Based Testing cho calculate_recipe_score và get_recommendations.
Dùng Hypothesis để sinh dữ liệu ngẫu nhiên và kiểm tra invariants.
"""
import pytest
from unittest.mock import MagicMock
from hypothesis import given, settings as hyp_settings, assume
from hypothesis import strategies as st

from apps.kitchen.services.recommendation_engine import (
    calculate_recipe_score,
    get_recommendations,
    PENALTY,
)


# ==============================================================================
# HELPERS — Tạo mock objects cho recommendation engine
# ==============================================================================

def make_mock_ingredient(ingredient_id, category):
    """Tạo mock ingredient với id và category."""
    ing = MagicMock()
    ing.id = ingredient_id
    ing.category = category
    ing.name = f'Ingredient_{ingredient_id}'
    return ing


def make_mock_recipe_ingredient(ingredient_id, category):
    """Tạo mock RecipeIngredient."""
    ri = MagicMock()
    ri.ingredient_id = ingredient_id
    ri.ingredient = make_mock_ingredient(ingredient_id, category)
    return ri


def make_mock_recipe(recipe_id, recipe_ingredients):
    """Tạo mock Recipe với danh sách recipe_ingredients."""
    recipe = MagicMock()
    recipe.id = recipe_id
    recipe.recipe_ingredients.all.return_value = recipe_ingredients
    return recipe


# Strategies cho Hypothesis
NON_STAPLE_CATEGORIES = ['PROTEIN', 'CARB', 'VEG', 'SPICE', 'OTHER']
ALL_CATEGORIES = NON_STAPLE_CATEGORIES + ['STAPLE']

ingredient_id_strategy = st.integers(min_value=1, max_value=10000)
category_strategy = st.sampled_from(NON_STAPLE_CATEGORIES)
non_negative_int_strategy = st.integers(min_value=0, max_value=20)


# ==============================================================================
# PROPERTY 1: STAPLE ingredients không ảnh hưởng score
# ==============================================================================

@pytest.mark.unit
@pytest.mark.pbt
class TestSTAPLEIgnored:
    """Property 1: STAPLE ingredients bị bỏ qua hoàn toàn."""

    @given(
        staple_ids=st.lists(
            st.integers(min_value=1, max_value=1000),
            min_size=1,
            max_size=10,
            unique=True,
        )
    )
    @hyp_settings(max_examples=50)
    def test_staple_ingredients_do_not_affect_score(self, staple_ids):
        """Recipe chỉ có STAPLE ingredients, pantry rỗng → score == 0, missing == []."""
        recipe_ingredients = [
            make_mock_recipe_ingredient(ing_id, 'STAPLE')
            for ing_id in staple_ids
        ]
        recipe = make_mock_recipe(recipe_id=1, recipe_ingredients=recipe_ingredients)
        pantry_ingredient_ids = set()  # Pantry rỗng
        saved_recipe_ids = set()

        score, missing = calculate_recipe_score(recipe, pantry_ingredient_ids, saved_recipe_ids)

        assert score == 0, f"STAPLE ingredients không được ảnh hưởng score, nhưng score={score}"
        assert missing == [], f"STAPLE ingredients không được xuất hiện trong missing, nhưng missing={missing}"


# ==============================================================================
# PROPERTY 2: +20 điểm mỗi ingredient match
# ==============================================================================

@pytest.mark.unit
@pytest.mark.pbt
class TestMatchScoreLinear:
    """Property 2: Match score tuyến tính — +20 mỗi ingredient có trong pantry."""

    @given(
        ingredient_ids=st.lists(
            st.integers(min_value=1, max_value=1000),
            min_size=1,
            max_size=15,
            unique=True,
        ),
        category=category_strategy,
    )
    @hyp_settings(max_examples=50)
    def test_match_score_is_n_times_20(self, ingredient_ids, category):
        """N non-STAPLE ingredients, tất cả có trong pantry → score == N * 20."""
        recipe_ingredients = [
            make_mock_recipe_ingredient(ing_id, category)
            for ing_id in ingredient_ids
        ]
        recipe = make_mock_recipe(recipe_id=1, recipe_ingredients=recipe_ingredients)
        pantry_ingredient_ids = set(ingredient_ids)  # Tất cả có trong pantry
        saved_recipe_ids = set()

        score, missing = calculate_recipe_score(recipe, pantry_ingredient_ids, saved_recipe_ids)
        n = len(ingredient_ids)

        assert score == n * 20, f"N={n} matches phải cho score={n * 20}, nhưng score={score}"
        assert missing == [], f"Không có missing khi tất cả có trong pantry"


# ==============================================================================
# PROPERTY 3: Penalty đúng theo category
# ==============================================================================

@pytest.mark.unit
@pytest.mark.pbt
class TestPenaltyByCategory:
    """Property 3: Penalty invariant theo category."""

    @given(category=category_strategy)
    @hyp_settings(max_examples=20)
    def test_penalty_correct_for_each_category(self, category):
        """Recipe với 1 ingredient missing → score == PENALTY[category]."""
        ingredient_id = 999
        recipe_ingredients = [make_mock_recipe_ingredient(ingredient_id, category)]
        recipe = make_mock_recipe(recipe_id=1, recipe_ingredients=recipe_ingredients)
        pantry_ingredient_ids = set()  # Ingredient không có trong pantry
        saved_recipe_ids = set()

        score, missing = calculate_recipe_score(recipe, pantry_ingredient_ids, saved_recipe_ids)
        expected_penalty = PENALTY.get(category, -25)

        assert score == expected_penalty, (
            f"Category={category}: expected score={expected_penalty}, got score={score}"
        )
        assert len(missing) == 1, "Phải có đúng 1 missing ingredient"
        assert missing[0]['category'] == category


# ==============================================================================
# PROPERTY 4: +50 Affinity Bonus khi recipe trong Collection
# ==============================================================================

@pytest.mark.unit
@pytest.mark.pbt
class TestAffinityBonus:
    """Property 4: Affinity Bonus cộng đúng +50."""

    @given(
        ingredient_ids=st.lists(
            st.integers(min_value=1, max_value=500),
            min_size=0,
            max_size=5,
            unique=True,
        ),
        category=category_strategy,
    )
    @hyp_settings(max_examples=50)
    def test_affinity_bonus_adds_50(self, ingredient_ids, category):
        """score_with_affinity == score_without_affinity + 50."""
        recipe_id = 42
        recipe_ingredients = [
            make_mock_recipe_ingredient(ing_id, category)
            for ing_id in ingredient_ids
        ]
        recipe = make_mock_recipe(recipe_id=recipe_id, recipe_ingredients=recipe_ingredients)
        pantry_ingredient_ids = set(ingredient_ids)  # Tất cả có trong pantry

        # Tính score không có affinity
        score_without, _ = calculate_recipe_score(recipe, pantry_ingredient_ids, set())
        # Tính score có affinity
        score_with, _ = calculate_recipe_score(recipe, pantry_ingredient_ids, {recipe_id})

        assert score_with == score_without + 50, (
            f"Affinity bonus phải là +50: {score_with} != {score_without} + 50"
        )

    @given(
        ingredient_ids=st.lists(
            st.integers(min_value=1, max_value=500),
            min_size=0,
            max_size=5,
            unique=True,
        ),
    )
    @hyp_settings(max_examples=30)
    def test_no_affinity_when_recipe_not_in_collection(self, ingredient_ids):
        """Recipe không trong Collection → score không thay đổi do affinity."""
        recipe_id = 42
        other_recipe_id = 99  # Khác recipe_id
        recipe_ingredients = [
            make_mock_recipe_ingredient(ing_id, 'OTHER')
            for ing_id in ingredient_ids
        ]
        recipe = make_mock_recipe(recipe_id=recipe_id, recipe_ingredients=recipe_ingredients)
        pantry_ingredient_ids = set(ingredient_ids)

        score_without, _ = calculate_recipe_score(recipe, pantry_ingredient_ids, set())
        score_with_other, _ = calculate_recipe_score(
            recipe, pantry_ingredient_ids, {other_recipe_id}
        )

        assert score_without == score_with_other, (
            "Score không được thay đổi khi recipe không trong Collection"
        )


# ==============================================================================
# PROPERTY 5: Ordering invariant
# ==============================================================================

@pytest.mark.unit
@pytest.mark.pbt
@pytest.mark.django_db
class TestOrderingInvariant:
    """Property 5: Kết quả sắp xếp score giảm dần."""

    def test_get_recommendations_sorted_descending(self):
        """Kết quả từ get_recommendations được sắp xếp theo score giảm dần."""
        from django.contrib.auth import get_user_model
        from apps.recipes.models import Recipe, RecipeIngredient
        from apps.ingredients.models import Ingredient

        User = get_user_model()
        import uuid

        # Tạo user và ingredients
        user = User.objects.create_user(
            username=f'rec_user_{uuid.uuid4().hex[:6]}@test.com',
            email=f'rec_user_{uuid.uuid4().hex[:6]}@test.com',
            full_name='Rec User',
            password='pass123',
        )
        protein = Ingredient.objects.create(
            name=f'Protein_{uuid.uuid4().hex[:6]}', category='PROTEIN', status='APPROVED'
        )
        carb = Ingredient.objects.create(
            name=f'Carb_{uuid.uuid4().hex[:6]}', category='CARB', status='APPROVED'
        )

        # Tạo recipe 1: có protein trong pantry → score cao hơn
        recipe1 = Recipe.objects.create(
            user=user, title='Recipe 1', difficulty='EASY', prep_time=30, visibility='PUBLIC'
        )
        RecipeIngredient.objects.create(recipe=recipe1, ingredient=protein, quantity=100, unit='g')

        # Tạo recipe 2: thiếu carb → score thấp hơn
        recipe2 = Recipe.objects.create(
            user=user, title='Recipe 2', difficulty='EASY', prep_time=30, visibility='PUBLIC'
        )
        RecipeIngredient.objects.create(recipe=recipe2, ingredient=carb, quantity=100, unit='g')

        # Thêm protein vào pantry
        from apps.kitchen.models import Pantry
        Pantry.objects.create(user=user, ingredient=protein, quantity=500, unit='g')

        results = get_recommendations(user, 'ADD_MORE')
        scores = [r['score'] for r in results]

        for i in range(len(scores) - 1):
            assert scores[i] >= scores[i + 1], (
                f"Kết quả phải sắp xếp giảm dần: scores[{i}]={scores[i]} < scores[{i+1}]={scores[i+1]}"
            )


# ==============================================================================
# PROPERTY 6: COOK_NOW filter invariant
# ==============================================================================

@pytest.mark.unit
@pytest.mark.pbt
@pytest.mark.django_db
class TestCookNowFilter:
    """Property 6: COOK_NOW chỉ trả về missing_count == 0."""

    def test_cook_now_only_returns_zero_missing(self):
        """Với mode=COOK_NOW, tất cả kết quả có len(missing_ingredients) == 0."""
        from django.contrib.auth import get_user_model
        from apps.recipes.models import Recipe, RecipeIngredient
        from apps.ingredients.models import Ingredient
        from apps.kitchen.models import Pantry

        User = get_user_model()
        import uuid

        user = User.objects.create_user(
            username=f'cn_user_{uuid.uuid4().hex[:6]}@test.com',
            email=f'cn_user_{uuid.uuid4().hex[:6]}@test.com',
            full_name='CN User',
            password='pass123',
        )
        protein = Ingredient.objects.create(
            name=f'Protein_cn_{uuid.uuid4().hex[:6]}', category='PROTEIN', status='APPROVED'
        )
        carb = Ingredient.objects.create(
            name=f'Carb_cn_{uuid.uuid4().hex[:6]}', category='CARB', status='APPROVED'
        )

        # Recipe có đủ nguyên liệu
        recipe_complete = Recipe.objects.create(
            user=user, title='Complete Recipe', difficulty='EASY', prep_time=30, visibility='PUBLIC'
        )
        RecipeIngredient.objects.create(recipe=recipe_complete, ingredient=protein, quantity=100, unit='g')

        # Recipe thiếu nguyên liệu
        recipe_incomplete = Recipe.objects.create(
            user=user, title='Incomplete Recipe', difficulty='EASY', prep_time=30, visibility='PUBLIC'
        )
        RecipeIngredient.objects.create(recipe=recipe_incomplete, ingredient=carb, quantity=100, unit='g')

        # Chỉ có protein trong pantry
        Pantry.objects.create(user=user, ingredient=protein, quantity=500, unit='g')

        results = get_recommendations(user, 'COOK_NOW')

        for item in results:
            assert len(item['missing_ingredients']) == 0, (
                f"COOK_NOW chỉ trả về recipe có missing_count=0, "
                f"nhưng recipe '{item['recipe'].title}' có {len(item['missing_ingredients'])} missing"
            )


# ==============================================================================
# PROPERTY 7: ADD_MORE filter invariant
# ==============================================================================

@pytest.mark.unit
@pytest.mark.pbt
@pytest.mark.django_db
class TestAddMoreFilter:
    """Property 7: ADD_MORE chỉ trả về missing_count <= 2 AND score >= 0."""

    def test_add_more_filter_invariant(self):
        """Với mode=ADD_MORE, tất cả kết quả có missing_count <= 2 và score >= 0."""
        from django.contrib.auth import get_user_model
        from apps.recipes.models import Recipe, RecipeIngredient
        from apps.ingredients.models import Ingredient
        from apps.kitchen.models import Pantry

        User = get_user_model()
        import uuid

        user = User.objects.create_user(
            username=f'am_user_{uuid.uuid4().hex[:6]}@test.com',
            email=f'am_user_{uuid.uuid4().hex[:6]}@test.com',
            full_name='AM User',
            password='pass123',
        )

        # Tạo nhiều ingredients
        ingredients = []
        for i in range(5):
            ing = Ingredient.objects.create(
                name=f'Ing_am_{i}_{uuid.uuid4().hex[:4]}', category='VEG', status='APPROVED'
            )
            ingredients.append(ing)

        # Recipe có 1 missing (VEG -50) + 2 match (+40) → score = -10 < 0 → bị loại
        recipe_bad = Recipe.objects.create(
            user=user, title='Bad Recipe', difficulty='EASY', prep_time=30, visibility='PUBLIC'
        )
        RecipeIngredient.objects.create(recipe=recipe_bad, ingredient=ingredients[0], quantity=100, unit='g')
        RecipeIngredient.objects.create(recipe=recipe_bad, ingredient=ingredients[1], quantity=100, unit='g')
        RecipeIngredient.objects.create(recipe=recipe_bad, ingredient=ingredients[2], quantity=100, unit='g')

        # Chỉ có ingredients[1] và [2] trong pantry
        Pantry.objects.create(user=user, ingredient=ingredients[1], quantity=100, unit='g')
        Pantry.objects.create(user=user, ingredient=ingredients[2], quantity=100, unit='g')

        results = get_recommendations(user, 'ADD_MORE')

        for item in results:
            missing_count = len(item['missing_ingredients'])
            score = item['score']
            assert missing_count <= 2, f"ADD_MORE: missing_count={missing_count} > 2"
            assert score >= 0, f"ADD_MORE: score={score} < 0"


# ==============================================================================
# PROPERTY 8: Exclusion invariant
# ==============================================================================

@pytest.mark.unit
@pytest.mark.pbt
@pytest.mark.django_db
class TestExclusionInvariant:
    """Property 8: exclude_ingredient_ids loại trừ đúng recipe."""

    def test_excluded_ingredients_not_in_results(self):
        """Recipe chứa excluded ingredient không xuất hiện trong kết quả."""
        from django.contrib.auth import get_user_model
        from apps.recipes.models import Recipe, RecipeIngredient
        from apps.ingredients.models import Ingredient
        from apps.kitchen.models import Pantry

        User = get_user_model()
        import uuid

        user = User.objects.create_user(
            username=f'ex_user_{uuid.uuid4().hex[:6]}@test.com',
            email=f'ex_user_{uuid.uuid4().hex[:6]}@test.com',
            full_name='Ex User',
            password='pass123',
        )
        excluded_ing = Ingredient.objects.create(
            name=f'Excluded_{uuid.uuid4().hex[:6]}', category='PROTEIN', status='APPROVED'
        )
        normal_ing = Ingredient.objects.create(
            name=f'Normal_{uuid.uuid4().hex[:6]}', category='VEG', status='APPROVED'
        )

        # Recipe chứa excluded ingredient
        recipe_excluded = Recipe.objects.create(
            user=user, title='Excluded Recipe', difficulty='EASY', prep_time=30, visibility='PUBLIC'
        )
        RecipeIngredient.objects.create(recipe=recipe_excluded, ingredient=excluded_ing, quantity=100, unit='g')

        # Recipe không chứa excluded ingredient
        recipe_normal = Recipe.objects.create(
            user=user, title='Normal Recipe', difficulty='EASY', prep_time=30, visibility='PUBLIC'
        )
        RecipeIngredient.objects.create(recipe=recipe_normal, ingredient=normal_ing, quantity=100, unit='g')

        # Thêm cả 2 vào pantry để đảm bảo cả 2 có thể xuất hiện
        Pantry.objects.create(user=user, ingredient=excluded_ing, quantity=100, unit='g')
        Pantry.objects.create(user=user, ingredient=normal_ing, quantity=100, unit='g')

        results = get_recommendations(user, 'COOK_NOW', exclude_ingredient_ids=[excluded_ing.id])

        result_recipe_ids = [item['recipe'].id for item in results]
        assert recipe_excluded.id not in result_recipe_ids, (
            "Recipe chứa excluded ingredient không được xuất hiện trong kết quả"
        )
