"""
Integration Tests cho Upload Endpoints.
Test toàn bộ luồng upload qua HTTP: avatar, thumbnail, step media, cooksnap.
Bao gồm: permission checks, cleanup, error cases.
"""
import io
import os
import pytest
from PIL import Image
from django.test import override_settings
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import User
from apps.recipes.models import Recipe, RecipeStep, RecipeStepMedia
from apps.recipes.serializers import RecipeCreateSerializer
from apps.social.models import Review


# ============================================================
# Helpers
# ============================================================

def create_test_image_file(name='test.jpg', width=100, height=100, fmt='JPEG') -> SimpleUploadedFile:
    """Tạo ảnh JPEG/PNG thật bằng Pillow, trả về SimpleUploadedFile để pass MIME type check."""
    img = Image.new('RGB', (width, height), color=(255, 0, 0))
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    content_type = 'image/jpeg' if fmt == 'JPEG' else 'image/png'
    return SimpleUploadedFile(name, buf.getvalue(), content_type=content_type)

def create_test_video_file(name='step.mp4') -> SimpleUploadedFile:
    """Tạo file MP4 tối thiểu đủ để test upload video."""
    content = b'\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00mp42isom' + b'\x00' * 128
    return SimpleUploadedFile(name, content, content_type='video/mp4')


def get_auth_client(user) -> APIClient:
    """Tạo APIClient đã authenticate với JWT token."""
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return client


# ============================================================
# Fixtures
# ============================================================

@pytest.fixture
def user_a(db):
    return User.objects.create_user(
        username='user_a',
        email='user_a@test.com',
        password='testpass123',
        full_name='User A'
    )


@pytest.fixture
def user_b(db):
    return User.objects.create_user(
        username='user_b',
        email='user_b@test.com',
        password='testpass123',
        full_name='User B'
    )


@pytest.fixture
def recipe_a(db, user_a):
    """Recipe thuộc về user_a."""
    return Recipe.objects.create(
        user=user_a,
        title='Phở bò',
        description='Công thức phở bò truyền thống',
        difficulty='EASY'
    )


@pytest.fixture
def step_a(db, recipe_a):
    """RecipeStep thuộc recipe_a."""
    return RecipeStep.objects.create(
        recipe=recipe_a,
        step_number=1,
        instruction='Đun nước dùng'
    )


@pytest.fixture
def review_a(db, user_a, recipe_a):
    """Review của user_a cho recipe_a."""
    return Review.objects.create(
        user=user_a,
        recipe=recipe_a,
        rating=5,
        comment='Ngon lắm!'
    )


# ============================================================
# Task 7.1: Test luồng upload thành công
# ============================================================

@pytest.mark.django_db
def test_avatar_upload_success(user_a, tmp_path):
    """POST /api/accounts/me/avatar/ với file hợp lệ → 200 + url được cập nhật."""
    with override_settings(MEDIA_ROOT=str(tmp_path)):
        client = get_auth_client(user_a)

        response = client.post(
            '/api/accounts/me/avatar/',
            {'file': create_test_image_file('avatar.jpg')},
            format='multipart'
        )

        assert response.status_code == 200
        assert 'url' in response.data
        assert response.data['url'].startswith('/media/avatars/')
        assert response.data['url'].endswith('.jpg')
        assert 'message' in response.data

        # Kiểm tra DB được cập nhật
        user_a.refresh_from_db()
        assert user_a.avatar_url == response.data['url']


@pytest.mark.django_db
def test_recipe_thumbnail_upload_success(user_a, recipe_a, tmp_path):
    """POST /api/recipes/{id}/thumbnail/ với file hợp lệ → 200."""
    with override_settings(MEDIA_ROOT=str(tmp_path)):
        client = get_auth_client(user_a)

        response = client.post(
            f'/api/recipes/{recipe_a.id}/thumbnail/',
            {'file': create_test_image_file('thumb.jpg')},
            format='multipart'
        )

        assert response.status_code == 200
        assert 'url' in response.data
        assert response.data['url'].startswith('/media/recipes/thumbnails/')

        recipe_a.refresh_from_db()
        assert recipe_a.thumbnail_url == response.data['url']


@pytest.mark.django_db
def test_step_media_upload_success(user_a, recipe_a, step_a, tmp_path):
    """POST /api/recipes/{id}/steps/{step_id}/media/ với file hợp lệ → 200."""
    with override_settings(MEDIA_ROOT=str(tmp_path)):
        client = get_auth_client(user_a)

        response = client.post(
            f'/api/recipes/{recipe_a.id}/steps/{step_a.id}/media/',
            {'file': create_test_image_file('step.jpg')},
            format='multipart'
        )

        assert response.status_code == 200
        assert 'url' in response.data
        assert response.data['url'].startswith('/media/recipes/steps/')

        step_a.refresh_from_db()
        assert step_a.media_url == response.data['url']

@pytest.mark.django_db
def test_step_media_upload_accepts_multiple_image_and_video_files(user_a, recipe_a, step_a, tmp_path):
    """POST nhiều file cho một step → tạo nhiều media item theo thứ tự upload."""
    with override_settings(MEDIA_ROOT=str(tmp_path)):
        client = get_auth_client(user_a)

        response = client.post(
            f'/api/recipes/{recipe_a.id}/steps/{step_a.id}/media/',
            {
                'files': [
                    create_test_image_file('step-image.jpg'),
                    create_test_video_file('step-video.mp4'),
                ]
            },
            format='multipart'
        )

        assert response.status_code == 200
        assert response.data['message'] == 'Cập nhật media bước thực hiện thành công'
        assert len(response.data['media']) == 2
        assert response.data['media'][0]['media_type'] == 'IMAGE'
        assert response.data['media'][1]['media_type'] == 'VIDEO'

        media_items = list(RecipeStepMedia.objects.filter(step=step_a).order_by('order'))
        assert len(media_items) == 2
        assert media_items[0].media_url.startswith('/media/recipes/steps/')
        assert media_items[0].media_type == 'IMAGE'
        assert media_items[1].media_url.startswith('/media/recipes/steps/')
        assert media_items[1].media_type == 'VIDEO'

@pytest.mark.django_db
def test_recipe_update_preserves_step_media_items_when_step_id_is_sent(user_a, recipe_a, step_a):
    """Update recipe text/step order không làm mất media đã upload của step đó."""
    RecipeStepMedia.objects.create(
        step=step_a,
        media_url='/media/recipes/steps/existing.jpg',
        media_type='IMAGE',
        order=1,
        original_name='existing.jpg',
    )

    serializer = RecipeCreateSerializer(
        recipe_a,
        data={
            'title': 'Phở bò cập nhật',
            'description': recipe_a.description,
            'difficulty': recipe_a.difficulty,
            'prep_time': recipe_a.prep_time,
            'thumbnail_url': recipe_a.thumbnail_url,
            'visibility': recipe_a.visibility,
            'steps': [
                {
                    'id': step_a.id,
                    'step_number': 1,
                    'instruction': 'Đun nước dùng trong 60 phút',
                    'media_url': step_a.media_url,
                }
            ],
        },
        partial=True,
    )

    assert serializer.is_valid(), serializer.errors
    serializer.save()

    new_step = recipe_a.steps.get(step_number=1)
    media_items = list(new_step.media_items.all())
    assert len(media_items) == 1
    assert media_items[0].media_url == '/media/recipes/steps/existing.jpg'


@pytest.mark.django_db
def test_cooksnap_upload_success(user_a, review_a, tmp_path):
    """POST /api/social/reviews/{id}/cooksnap/ với file hợp lệ → 200."""
    with override_settings(MEDIA_ROOT=str(tmp_path)):
        client = get_auth_client(user_a)

        response = client.post(
            f'/api/social/reviews/{review_a.id}/cooksnap/',
            {'file': create_test_image_file('cooksnap.jpg')},
            format='multipart'
        )

        assert response.status_code == 200
        assert 'url' in response.data
        assert response.data['url'].startswith('/media/cooksnaps/')

        review_a.refresh_from_db()
        assert review_a.cooksnap_url == response.data['url']


# ============================================================
# Task 7.2: Test permission — user B không upload được cho resource của user A
# ============================================================

@pytest.mark.django_db
def test_recipe_thumbnail_upload_forbidden_for_non_owner(user_b, recipe_a, tmp_path):
    """User B không thể upload thumbnail cho recipe của user A → 403."""
    with override_settings(MEDIA_ROOT=str(tmp_path)):
        client = get_auth_client(user_b)

        response = client.post(
            f'/api/recipes/{recipe_a.id}/thumbnail/',
            {'file': create_test_image_file('thumb.jpg')},
            format='multipart'
        )

        assert response.status_code == 403


@pytest.mark.django_db
def test_step_media_upload_forbidden_for_non_owner(user_b, recipe_a, step_a, tmp_path):
    """User B không thể upload step media cho recipe của user A → 403."""
    with override_settings(MEDIA_ROOT=str(tmp_path)):
        client = get_auth_client(user_b)

        response = client.post(
            f'/api/recipes/{recipe_a.id}/steps/{step_a.id}/media/',
            {'file': create_test_image_file('step.jpg')},
            format='multipart'
        )

        assert response.status_code == 403


@pytest.mark.django_db
def test_cooksnap_upload_forbidden_for_non_owner(user_b, review_a, tmp_path):
    """User B không thể upload cooksnap cho review của user A → 403."""
    with override_settings(MEDIA_ROOT=str(tmp_path)):
        client = get_auth_client(user_b)

        response = client.post(
            f'/api/social/reviews/{review_a.id}/cooksnap/',
            {'file': create_test_image_file('cooksnap.jpg')},
            format='multipart'
        )

        assert response.status_code == 403


@pytest.mark.django_db
def test_avatar_upload_requires_authentication(tmp_path):
    """Upload avatar không có token → 401."""
    with override_settings(MEDIA_ROOT=str(tmp_path)):
        client = APIClient()

        response = client.post(
            '/api/accounts/me/avatar/',
            {'file': create_test_image_file('avatar.jpg')},
            format='multipart'
        )

        assert response.status_code == 401


# ============================================================
# Task 7.3: Test cleanup — file cũ bị xóa sau khi upload file mới
# ============================================================

@pytest.mark.django_db
def test_avatar_old_file_deleted_on_new_upload(user_a, tmp_path):
    """Upload avatar lần 2 → file avatar cũ bị xóa khỏi disk."""
    with override_settings(MEDIA_ROOT=str(tmp_path)):
        client = get_auth_client(user_a)

        # Upload lần 1
        response1 = client.post(
            '/api/accounts/me/avatar/',
            {'file': create_test_image_file('avatar1.jpg')},
            format='multipart'
        )
        assert response1.status_code == 200

        old_url = response1.data['url']
        # URL dạng '/media/avatars/xxx.jpg' → strip '/media/' → 'avatars/xxx.jpg'
        old_relative = old_url[len('/media/'):]
        old_path = os.path.join(str(tmp_path), old_relative)
        assert os.path.exists(old_path), "File lần 1 phải tồn tại"

        # Upload lần 2
        response2 = client.post(
            '/api/accounts/me/avatar/',
            {'file': create_test_image_file('avatar2.jpg')},
            format='multipart'
        )
        assert response2.status_code == 200

        # File cũ phải bị xóa
        assert not os.path.exists(old_path), "File cũ phải bị xóa sau khi upload mới"

        # File mới phải tồn tại
        new_url = response2.data['url']
        new_relative = new_url[len('/media/'):]
        new_path = os.path.join(str(tmp_path), new_relative)
        assert os.path.exists(new_path), "File mới phải tồn tại"


# ============================================================
# Task 7.4: Test error cases
# ============================================================

@pytest.mark.django_db
def test_upload_no_file_returns_400(user_a, tmp_path):
    """Upload không có file → 400."""
    with override_settings(MEDIA_ROOT=str(tmp_path)):
        client = get_auth_client(user_a)
        response = client.post('/api/accounts/me/avatar/', {}, format='multipart')
        assert response.status_code == 400
        assert 'error' in response.data


@pytest.mark.django_db
def test_upload_wrong_type_returns_400(user_a, tmp_path):
    """Upload file .gif → 400."""
    with override_settings(MEDIA_ROOT=str(tmp_path)):
        client = get_auth_client(user_a)
        fake_gif = SimpleUploadedFile('image.gif', b'GIF89a fake gif content', content_type='image/gif')

        response = client.post(
            '/api/accounts/me/avatar/',
            {'file': fake_gif},
            format='multipart'
        )

        assert response.status_code == 400
        assert 'error' in response.data


@pytest.mark.django_db
def test_upload_oversized_file_returns_400(user_a, tmp_path):
    """Upload file > 5MB → 400."""
    with override_settings(MEDIA_ROOT=str(tmp_path)):
        client = get_auth_client(user_a)
        # Tạo file > 5MB (raw bytes, không phải ảnh thật — chỉ test size check)
        oversized = SimpleUploadedFile('big.jpg', b'x' * (5 * 1024 * 1024 + 1), content_type='image/jpeg')

        response = client.post(
            '/api/accounts/me/avatar/',
            {'file': oversized},
            format='multipart'
        )

        assert response.status_code == 400
        assert 'error' in response.data


@pytest.mark.django_db
def test_recipe_thumbnail_not_found_returns_404(user_a, tmp_path):
    """Upload thumbnail cho recipe không tồn tại → 404."""
    with override_settings(MEDIA_ROOT=str(tmp_path)):
        import uuid
        client = get_auth_client(user_a)
        fake_id = uuid.uuid4()

        response = client.post(
            f'/api/recipes/{fake_id}/thumbnail/',
            {'file': create_test_image_file('thumb.jpg')},
            format='multipart'
        )

        assert response.status_code == 404


@pytest.mark.django_db
def test_step_media_wrong_recipe_returns_404(user_a, recipe_a, tmp_path):
    """Upload step media với step_id không thuộc recipe → 404."""
    with override_settings(MEDIA_ROOT=str(tmp_path)):
        client = get_auth_client(user_a)

        response = client.post(
            f'/api/recipes/{recipe_a.id}/steps/99999/media/',
            {'file': create_test_image_file('step.jpg')},
            format='multipart'
        )

        assert response.status_code == 404
