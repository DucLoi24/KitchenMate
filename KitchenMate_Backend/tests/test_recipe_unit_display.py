import pytest
from django.contrib.auth import get_user_model

from apps.ingredients.models import Ingredient, Unit
from apps.recipes.models import Recipe, RecipeIngredient
from apps.recipes.serializers import RecipeDetailSerializer
from apps.kitchen.services.recommendation_engine import calculate_recipe_score

User = get_user_model()


@pytest.fixture
def recipe_user(db):
    return User.objects.create_user(
        username='recipe-unit-user',
        email='recipe-unit@example.com',
        password='pass123',
        full_name='Recipe Unit User',
    )


@pytest.mark.django_db
def test_recipe_detail_includes_dynamic_unit_display(recipe_user):
    unit = Unit.objects.create(name='Chén', slug='chen')
    ingredient = Ingredient.objects.create(
        name='Gạo nếp',
        category='CARB',
        status='APPROVED',
        default_unit=unit,
    )
    ingredient.allowed_units.set([unit])
    recipe = Recipe.objects.create(user=recipe_user, title='Xôi', visibility='PUBLIC')
    RecipeIngredient.objects.create(
        recipe=recipe,
        ingredient=ingredient,
        quantity=2,
        unit='chen',
    )

    data = RecipeDetailSerializer(recipe).data

    assert data['recipe_ingredients'][0]['unit'] == 'chen'
    assert data['recipe_ingredients'][0]['unit_display'] == 'Chén'


@pytest.mark.django_db
def test_missing_ingredients_include_dynamic_unit_display(recipe_user):
    unit = Unit.objects.create(name='Lon', slug='lon')
    ingredient = Ingredient.objects.create(
        name='Nước cốt dừa',
        category='OTHER',
        status='APPROVED',
        default_unit=unit,
    )
    ingredient.allowed_units.set([unit])
    recipe = Recipe.objects.create(user=recipe_user, title='Chè', visibility='PUBLIC')
    RecipeIngredient.objects.create(
        recipe=recipe,
        ingredient=ingredient,
        quantity=1,
        unit='lon',
    )

    score, missing = calculate_recipe_score(
        recipe,
        pantry_ingredient_ids=set(),
        saved_recipe_ids=set(),
        unit_display_map={'lon': 'Lon'},
    )

    assert score < 0
    assert missing[0]['unit'] == 'lon'
    assert missing[0]['unit_display'] == 'Lon'
