import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient

from apps.recipes.models import Recipe
from apps.social.models import Collection, CollectionRecipe, Review


User = get_user_model()


def make_user(email):
    return User.objects.create_user(
        username=email,
        email=email,
        full_name=email.split('@')[0],
        password='testpass123',
    )


def make_public_recipe(user, title, created_at):
    recipe = Recipe.objects.create(
        user=user,
        title=title,
        description=f'Mo ta {title}',
        difficulty='EASY',
        prep_time=20,
        visibility='PUBLIC',
    )
    Recipe.objects.filter(pk=recipe.pk).update(created_at=created_at)
    recipe.refresh_from_db()
    return recipe


def recipe_titles(response):
    return [item['title'] for item in response.data['data']['results']]


@pytest.mark.django_db
def test_recipe_list_orders_by_average_rating_desc():
    owner = make_user('owner-rating@example.com')
    reviewer_one = make_user('reviewer-one@example.com')
    reviewer_two = make_user('reviewer-two@example.com')
    now = timezone.now()
    high_rating = make_public_recipe(owner, 'Canh chua ca linh', now - timezone.timedelta(days=2))
    low_rating = make_public_recipe(owner, 'Rau luoc cham kho quet', now - timezone.timedelta(days=1))

    Review.objects.create(user=reviewer_one, recipe=high_rating, rating=5)
    Review.objects.create(user=reviewer_two, recipe=low_rating, rating=2)

    response = APIClient().get('/api/recipes/', {'ordering': '-avg_rating'})

    assert response.status_code == 200
    assert recipe_titles(response)[:2] == ['Canh chua ca linh', 'Rau luoc cham kho quet']


@pytest.mark.django_db
def test_recipe_list_orders_by_save_count_desc():
    owner = make_user('owner-save@example.com')
    saver_one = make_user('saver-one@example.com')
    saver_two = make_user('saver-two@example.com')
    now = timezone.now()
    many_saves = make_public_recipe(owner, 'Bun bo Hue dac biet', now - timezone.timedelta(days=2))
    few_saves = make_public_recipe(owner, 'Trung chien hanh', now - timezone.timedelta(days=1))

    collection_one = Collection.objects.create(user=saver_one, name='Mon cuoi tuan')
    collection_two = Collection.objects.create(user=saver_two, name='Mon gia dinh')
    CollectionRecipe.objects.create(collection=collection_one, recipe=many_saves)
    CollectionRecipe.objects.create(collection=collection_two, recipe=many_saves)
    CollectionRecipe.objects.create(collection=collection_one, recipe=few_saves)

    response = APIClient().get('/api/recipes/', {'ordering': '-save_count'})

    assert response.status_code == 200
    assert recipe_titles(response)[:2] == ['Bun bo Hue dac biet', 'Trung chien hanh']
