import uuid

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.recipes.models import Recipe


User = get_user_model()


@pytest.mark.django_db
def test_recipe_list_returns_author_avatar_url():
    email = f'user_{uuid.uuid4().hex[:8]}@test.com'
    user = User.objects.create_user(
        username=email,
        email=email,
        full_name='Nguoi nau bep',
        password='pass123',
        avatar_url='/media/avatars/custom-avatar.jpg',
    )
    recipe = Recipe.objects.create(
        user=user,
        title='Cong thuc co avatar',
        visibility='PUBLIC',
    )

    response = APIClient().get('/api/recipes/')

    assert response.status_code == 200
    result = next(
        item for item in response.data['data']['results']
        if str(item['id']) == str(recipe.id)
    )
    assert result['user_name'] == 'Nguoi nau bep'
    assert result['user_avatar'] == '/media/avatars/custom-avatar.jpg'
