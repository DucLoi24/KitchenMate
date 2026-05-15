import pytest
from django.contrib.auth import get_user_model

from apps.recipes.models import Recipe
from apps.social.models import Review


User = get_user_model()


@pytest.mark.django_db
def test_public_profile_recipes_include_computed_average_rating(api_client):
    author = User.objects.create_user(
        username='author-rating@example.com',
        email='author-rating@example.com',
        full_name='Tac gia rating',
        password='testpass123',
    )
    reviewer = User.objects.create_user(
        username='reviewer-rating@example.com',
        email='reviewer-rating@example.com',
        full_name='Nguoi danh gia',
        password='testpass123',
    )
    reviewed_recipe = Recipe.objects.create(
        user=author,
        title='Mon co danh gia',
        description='Co diem trung binh',
        visibility='PUBLIC',
        prep_time=20,
    )
    unrated_recipe = Recipe.objects.create(
        user=author,
        title='Mon chua co danh gia',
        description='Chua co diem',
        visibility='PUBLIC',
        prep_time=10,
    )
    Review.objects.create(
        user=reviewer,
        recipe=reviewed_recipe,
        rating=4,
        comment='On',
    )

    response = api_client.get(f'/api/accounts/{author.pk}/recipes/')

    assert response.status_code == 200
    recipes = {
        item['id']: item
        for item in response.data['data']['results']
    }
    assert recipes[str(reviewed_recipe.pk)]['avg_rating'] == 4.0
    assert recipes[str(unrated_recipe.pk)]['avg_rating'] is None
