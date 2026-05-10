"""
Test suite cho Unit model và API endpoints.
TDD RED phase: Viết tests trước khi implement.
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.ingredients.models import Unit, Ingredient

User = get_user_model()


# ==============================================================================
# FIXTURES
# ==============================================================================

@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin_user(db):
    """Tạo superuser cho admin endpoints."""
    user = User.objects.create_superuser(
        username='admin',
        email='admin@example.com',
        password='adminpass123',
        full_name='Admin User'
    )
    return user


@pytest.fixture
def admin_client(api_client, admin_user):
    api_client.force_authenticate(user=admin_user)
    return api_client


@pytest.fixture
def sample_unit(db):
    """Tạo một unit mẫu chưa tồn tại."""
    unit = Unit.objects.create(name='TestUnit', slug='test-unit-xyz')
    return unit


@pytest.fixture
def sample_units(db):
    """Tạo nhiều units mẫu chưa tồn tại."""
    units = [
        Unit.objects.create(name='TestUnit1', slug='test-unit-1-xyz'),
        Unit.objects.create(name='TestUnit2', slug='test-unit-2-xyz'),
        Unit.objects.create(name='TestUnit3', slug='test-unit-3-xyz'),
        Unit.objects.create(name='TestUnit4', slug='test-unit-4-xyz'),
    ]
    return units


@pytest.fixture
def sample_ingredient(db):
    """Tạo ingredient mẫu đã approved."""
    return Ingredient.objects.create(
        name='Thịt bò',
        category='PROTEIN',
        status='APPROVED'
    )


# ==============================================================================
# UNIT MODEL TESTS
# ==============================================================================

@pytest.mark.django_db
def test_unit_creation():
    """Unit được tạo với các trường cơ bản."""
    unit = Unit.objects.create(name='TestCreate', slug='test-create-unit')
    assert unit.name == 'TestCreate'
    assert unit.slug == 'test-create-unit'
    assert unit.is_active is True


@pytest.mark.django_db
def test_unit_str():
    """Unit string representation."""
    unit = Unit.objects.create(name='TestStr', slug='test-str-unit')
    assert str(unit) == 'TestStr (test-str-unit)'


@pytest.mark.django_db
def test_unit_slug_unique():
    """Slug phải unique."""
    Unit.objects.create(name='UniqueUnit', slug='unique-unit-slug')
    with pytest.raises(Exception):  # IntegrityError
        Unit.objects.create(name='UniqueUnit Duplicate', slug='unique-unit-slug')


@pytest.mark.django_db
def test_unit_soft_delete():
    """Unit không bị xóa cứng khi gọi delete."""
    unit = Unit.objects.create(name='Test', slug='test')
    unit_id = unit.id
    unit.delete()  # soft delete via model
    # Query set with is_active=True sẽ không thấy
    assert not Unit.objects.filter(id=unit_id, is_active=True).exists()
    # Nhưng vẫn tồn tại trong DB
    assert Unit.objects.filter(id=unit_id).exists()


# ==============================================================================
# UNIT API CRUD TESTS (Admin only)
# ==============================================================================

@pytest.mark.django_db
def test_admin_can_create_unit(admin_client):
    """Admin có thể tạo unit mới."""
    response = admin_client.post('/api/admin/units/', {
        'name': 'Chiếc',
        'slug': 'chiec-test-unique'
    })
    assert response.status_code == 201
    assert response.json()['data']['name'] == 'Chiếc'
    assert response.json()['data']['slug'] == 'chiec-test-unique'


@pytest.mark.django_db
def test_admin_can_list_units(admin_client, sample_units):
    """Admin có thể list all units."""
    response = admin_client.get('/api/admin/units/')
    assert response.status_code == 200
    data = response.json()
    assert data['success'] is True
    # 15 seed units + 4 test units = 19 total
    assert len(data['data']) == 19


@pytest.mark.django_db
def test_admin_can_update_unit(admin_client, sample_unit):
    """Admin có thể update unit."""
    response = admin_client.patch(f'/api/admin/units/{sample_unit.id}/', {
        'name': 'Kilogram Updated'
    })
    assert response.status_code == 200
    assert response.json()['data']['name'] == 'Kilogram Updated'


@pytest.mark.django_db
def test_admin_can_soft_delete_unit(admin_client, sample_unit):
    """Admin soft delete unit (is_active=False)."""
    response = admin_client.delete(f'/api/admin/units/{sample_unit.id}/')
    assert response.status_code == 204
    # Unit vẫn tồn tại nhưng is_active=False
    sample_unit.refresh_from_db()
    assert sample_unit.is_active is False


@pytest.mark.django_db
def test_non_admin_cannot_access_units(api_client):
    """Non-admin user không thể truy cập admin units endpoint."""
    response = api_client.get('/api/admin/units/')
    # 401 Unauthorized hoặc 403 Forbidden đều được
    assert response.status_code in (401, 403)


@pytest.mark.django_db
def test_list_only_active_units_by_default(admin_client, sample_units):
    """List units chỉ trả về active units."""
    # Deactivate one unit
    sample_units[0].is_active = False
    sample_units[0].save()

    response = admin_client.get('/api/admin/units/')
    data = response.json()['data']
    # 15 seed units + 3 active test units = 18
    assert len(data) == 18
    assert all(u['is_active'] is True for u in data)


# ==============================================================================
# INGREDIENT UNITS ASSIGNMENT TESTS
# ==============================================================================

@pytest.mark.django_db
def test_get_ingredient_units(admin_client, sample_ingredient, sample_units):
    """Lấy units của một ingredient."""
    # Gán units cho ingredient
    sample_ingredient.allowed_units.set(sample_units[:2])
    sample_ingredient.default_unit = sample_units[0]
    sample_ingredient.save()

    response = admin_client.get(f'/api/ingredients/{sample_ingredient.id}/units/')
    assert response.status_code == 200
    data = response.json()['data']

    assert data['default_unit']['id'] == sample_units[0].id
    assert len(data['allowed_units']) == 2


@pytest.mark.django_db
def test_update_ingredient_units(admin_client, sample_ingredient, sample_units):
    """Gán units mới cho ingredient."""
    response = admin_client.patch(f'/api/ingredients/{sample_ingredient.id}/units/', {
        'default_unit_id': sample_units[1].id,
        'allowed_unit_ids': [sample_units[0].id, sample_units[1].id]
    }, format='json')

    assert response.status_code == 200
    data = response.json()['data']

    assert data['default_unit']['id'] == sample_units[1].id
    assert len(data['allowed_units']) == 2

    # Verify in DB
    sample_ingredient.refresh_from_db()
    assert sample_ingredient.default_unit.id == sample_units[1].id
    assert set(sample_ingredient.allowed_units.values_list('id', flat=True)) == {sample_units[0].id, sample_units[1].id}


@pytest.mark.django_db
def test_update_ingredient_units_validation_default_must_be_in_allowed(admin_client, sample_ingredient, sample_units):
    """Validation: default_unit phải nằm trong allowed_units."""
    response = admin_client.patch(f'/api/ingredients/{sample_ingredient.id}/units/', {
        'default_unit_id': sample_units[0].id,  # Not in allowed list
        'allowed_unit_ids': [sample_units[1].id, sample_units[2].id]
    }, format='json')

    assert response.status_code == 400
    assert 'default_unit_id' in response.json().get('message', {}) or \
           'default_unit' in str(response.json().get('message', '')).lower()


@pytest.mark.django_db
def test_update_ingredient_units_clear_all(admin_client, sample_ingredient, sample_units):
    """Xóa hết units của ingredient (allowed_unit_ids rỗng)."""
    # Setup: gán trước
    sample_ingredient.allowed_units.set(sample_units[:2])
    sample_ingredient.default_unit = sample_units[0]
    sample_ingredient.save()

    response = admin_client.patch(f'/api/ingredients/{sample_ingredient.id}/units/', {
        'default_unit_id': None,
        'allowed_unit_ids': []
    }, format='json')

    assert response.status_code == 200
    data = response.json()['data']
    assert data['default_unit'] is None
    assert len(data['allowed_units']) == 0


@pytest.mark.django_db
def test_ingredient_without_units(admin_client, sample_ingredient):
    """Ingredient chưa gán units."""
    response = admin_client.get(f'/api/ingredients/{sample_ingredient.id}/units/')
    assert response.status_code == 200
    data = response.json()['data']
    assert data['default_unit'] is None
    assert data['allowed_units'] == []