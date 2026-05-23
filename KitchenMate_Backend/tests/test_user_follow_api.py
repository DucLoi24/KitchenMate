import uuid

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient


User = get_user_model()


def make_user(full_name='Test User'):
    email = f'user_{uuid.uuid4().hex[:12]}@example.com'
    return User.objects.create_user(
        username=email,
        email=email,
        full_name=full_name,
        password='testpass123',
    )


@pytest.mark.django_db
def test_authenticated_user_can_follow_and_stats_reflect_relation():
    follower = make_user('Nguoi theo doi')
    target = make_user('Dau bep')
    client = APIClient()
    client.force_authenticate(user=follower)

    response = client.post(f'/api/accounts/{target.id}/follow/')

    assert response.status_code == 201
    assert response.data['success'] is True
    assert response.data['data']['is_following'] is True

    target_stats = client.get(f'/api/accounts/{target.id}/stats/')
    assert target_stats.status_code == 200
    assert target_stats.data['data']['followers_count'] == 1
    assert target_stats.data['data']['is_following'] is True

    follower_stats = client.get(f'/api/accounts/{follower.id}/stats/')
    assert follower_stats.status_code == 200
    assert follower_stats.data['data']['following_count'] == 1


@pytest.mark.django_db
def test_authenticated_user_cannot_follow_self():
    user = make_user('Tu theo doi')
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.post(f'/api/accounts/{user.id}/follow/')

    assert response.status_code == 400
    assert response.data['success'] is False
    assert response.data['error']['message'] == 'Bạn không thể theo dõi chính mình.'


@pytest.mark.django_db
def test_duplicate_follow_does_not_create_duplicate_relation():
    follower = make_user('Nguoi theo doi')
    target = make_user('Dau bep')
    client = APIClient()
    client.force_authenticate(user=follower)

    first_response = client.post(f'/api/accounts/{target.id}/follow/')
    second_response = client.post(f'/api/accounts/{target.id}/follow/')

    assert first_response.status_code == 201
    assert second_response.status_code == 200
    assert second_response.data['data']['is_following'] is True

    followers_response = client.get(f'/api/accounts/{target.id}/followers/')
    assert followers_response.status_code == 200
    assert followers_response.data['data']['count'] == 1


@pytest.mark.django_db
def test_authenticated_user_can_unfollow():
    follower = make_user('Nguoi theo doi')
    target = make_user('Dau bep')
    client = APIClient()
    client.force_authenticate(user=follower)
    client.post(f'/api/accounts/{target.id}/follow/')

    response = client.delete(f'/api/accounts/{target.id}/follow/')

    assert response.status_code == 200
    assert response.data['success'] is True
    assert response.data['data']['is_following'] is False

    target_stats = client.get(f'/api/accounts/{target.id}/stats/')
    assert target_stats.data['data']['followers_count'] == 0
    assert target_stats.data['data']['is_following'] is False


@pytest.mark.django_db
def test_followers_and_following_lists_are_public_and_paginated():
    follower_one = make_user('Nguoi mot')
    follower_two = make_user('Nguoi hai')
    target = make_user('Dau bep')

    auth_client = APIClient()
    for follower in (follower_one, follower_two):
        auth_client.force_authenticate(user=follower)
        auth_client.post(f'/api/accounts/{target.id}/follow/')

    public_client = APIClient()
    followers_response = public_client.get(f'/api/accounts/{target.id}/followers/')
    following_response = public_client.get(f'/api/accounts/{follower_one.id}/following/')

    assert followers_response.status_code == 200
    assert followers_response.data['success'] is True
    assert followers_response.data['data']['count'] == 2
    follower_ids = {item['id'] for item in followers_response.data['data']['results']}
    assert str(follower_one.id) in follower_ids
    assert str(follower_two.id) in follower_ids

    assert following_response.status_code == 200
    assert following_response.data['success'] is True
    assert following_response.data['data']['count'] == 1
    assert following_response.data['data']['results'][0]['id'] == str(target.id)
    assert following_response.data['data']['results'][0]['followers_count'] == 2
    assert following_response.data['data']['results'][0]['is_following'] is False

@pytest.mark.django_db
def test_user_search_finds_active_users_by_full_name_without_exposing_email():
    target = make_user('Dau bep nha que')
    make_user('Nguoi khac')
    client = APIClient()

    response = client.get('/api/accounts/search/', {'q': 'nha que'})

    assert response.status_code == 200
    assert response.data['success'] is True
    assert response.data['data']['count'] == 1
    result = response.data['data']['results'][0]
    assert result['id'] == str(target.id)
    assert result['full_name'] == 'Dau bep nha que'
    assert 'email' not in result

@pytest.mark.django_db
def test_user_search_finds_user_by_uuid_with_at_prefix():
    target = make_user('Dau bep tim bang id')
    client = APIClient()

    response = client.get('/api/accounts/search/', {'q': f'@{target.id}'})

    assert response.status_code == 200
    assert response.data['data']['count'] == 1
    assert response.data['data']['results'][0]['id'] == str(target.id)

@pytest.mark.django_db
def test_user_search_finds_user_by_bare_uuid():
    target = make_user('Dau bep uuid')
    client = APIClient()

    response = client.get('/api/accounts/search/', {'q': str(target.id)})

    assert response.status_code == 200
    assert response.data['data']['count'] == 1
    assert response.data['data']['results'][0]['id'] == str(target.id)

@pytest.mark.django_db
def test_user_search_ignores_inactive_users_even_when_uuid_matches():
    target = make_user('Nguoi da khoa')
    target.is_active = False
    target.save(update_fields=['is_active'])
    client = APIClient()

    response = client.get('/api/accounts/search/', {'q': f'@{target.id}'})

    assert response.status_code == 200
    assert response.data['data']['count'] == 0
    assert response.data['data']['results'] == []

@pytest.mark.django_db
def test_user_search_marks_following_status_for_authenticated_user():
    follower = make_user('Nguoi theo doi')
    target = make_user('Dau bep duoc theo doi')
    User.objects.create_user(
        username=f'extra_{uuid.uuid4().hex[:12]}@example.com',
        email=f'extra_{uuid.uuid4().hex[:12]}@example.com',
        full_name='Dau bep chua theo doi',
        password='testpass123',
    )
    client = APIClient()
    client.force_authenticate(user=follower)
    client.post(f'/api/accounts/{target.id}/follow/')

    response = client.get('/api/accounts/search/', {'q': 'Dau bep duoc theo doi'})

    assert response.status_code == 200
    assert response.data['data']['count'] == 1
    result = response.data['data']['results'][0]
    assert result['id'] == str(target.id)
    assert result['is_following'] is True
    assert result['followers_count'] == 1

@pytest.mark.django_db
def test_user_search_invalid_at_uuid_returns_empty_results():
    client = APIClient()

    response = client.get('/api/accounts/search/', {'q': '@khong-phai-uuid'})

    assert response.status_code == 200
    assert response.data['data']['count'] == 0
    assert response.data['data']['results'] == []
