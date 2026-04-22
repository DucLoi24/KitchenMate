"""
Property-based tests và integration tests cho Ingredient Search endpoint
(Phase 9: Search & Filter).
GET /api/ingredients/search/?q={keyword}
"""
import pytest
from hypothesis import given, settings as h_settings, HealthCheck
from hypothesis import strategies as st
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

from apps.ingredients.models import Ingredient

User = get_user_model()


# ==============================================================================
# HELPERS
# ==============================================================================

def make_ingredient(name, status='APPROVED', category='OTHER'):
    """Tạo ingredient với tên và status cho trước."""
    ing, _ = Ingredient.objects.get_or_create(
        name=name,
        defaults={'category': category, 'status': status}
    )
    # Cập nhật status nếu đã tồn tại với status khác
    if ing.status != status:
        ing.status = status
        ing.save(update_fields=['status'])
    return ing


# ==============================================================================
# PROPERTY TESTS — Hypothesis
# ==============================================================================

@pytest.mark.django_db(transaction=True)
@given(
    keyword=st.text(
        min_size=3, max_size=8,
        alphabet=st.sampled_from('abcdefghijklmnopqrstuvwxyz')
    )
)
@h_settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture], deadline=None)
def test_search_returns_approved_with_keyword(keyword, db):
    """
    # Feature: phase-9-search-filter, Property 6: Ingredient search chỉ trả về APPROVED có keyword
    Tất cả kết quả phải có status=APPROVED và name chứa keyword (case-insensitive).
    Ingredients PENDING/REJECTED không được xuất hiện.
    Validates: Req 6.1, 6.5
    """
    client = APIClient()

    # Tạo ingredients với các status khác nhau, tất cả đều chứa keyword
    approved = make_ingredient(f'{keyword}_approved_p6', status='APPROVED')
    pending = make_ingredient(f'{keyword}_pending_p6', status='PENDING')
    rejected = make_ingredient(f'{keyword}_rejected_p6', status='REJECTED')

    response = client.get(f'/api/ingredients/search/?q={keyword}')
    assert response.status_code == 200

    data = response.json()
    results = data.get('data', [])
    result_names = [r['name'] for r in results]

    # Tất cả kết quả phải chứa keyword (case-insensitive)
    for r in results:
        assert keyword.lower() in r['name'].lower(), (
            f"Kết quả '{r['name']}' không chứa keyword '{keyword}'"
        )

    # PENDING và REJECTED không được xuất hiện
    assert pending.name not in result_names, (
        f"Ingredient PENDING '{pending.name}' không được xuất hiện trong kết quả"
    )
    assert rejected.name not in result_names, (
        f"Ingredient REJECTED '{rejected.name}' không được xuất hiện trong kết quả"
    )

    # Cleanup
    Ingredient.objects.filter(name__endswith='_p6').delete()


@pytest.mark.django_db(transaction=True)
@given(
    whitespace=st.one_of(
        st.just(''),
        st.text(min_size=1, max_size=10, alphabet=' \t\n'),
    )
)
@h_settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture], deadline=None)
def test_empty_query_returns_empty(whitespace, db):
    """
    # Feature: phase-9-search-filter, Property 7: Empty/whitespace query trả về danh sách rỗng
    Bất kỳ chuỗi chỉ gồm khoảng trắng (hoặc rỗng) đều phải trả về data=[] với HTTP 200.
    Validates: Req 6.2, 6.6
    """
    client = APIClient()

    # Tạo vài ingredients để đảm bảo DB không rỗng
    make_ingredient('Cà chua p7', status='APPROVED')
    make_ingredient('Hành tây p7', status='APPROVED')

    response = client.get(f'/api/ingredients/search/?q={whitespace}')
    assert response.status_code == 200

    data = response.json()
    assert data.get('data') == [], (
        f"Query whitespace '{repr(whitespace)}' phải trả về [], nhận được {data.get('data')}"
    )

    # Cleanup
    Ingredient.objects.filter(name__endswith='p7').delete()


@pytest.mark.django_db(transaction=True)
@given(
    keyword=st.text(
        min_size=3, max_size=6,
        alphabet=st.sampled_from('abcdefghijklmnopqrstuvwxyz')
    )
)
@h_settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture], deadline=None)
def test_search_result_limit(keyword, db):
    """
    # Feature: phase-9-search-filter, Property 8: Search result limit không vượt quá 10
    Dù có bao nhiêu ingredients khớp, kết quả phải <= 10.
    Validates: Req 6.4, 7.3
    """
    client = APIClient()

    # Tạo 15 ingredients đều chứa keyword
    created = []
    for i in range(15):
        ing = make_ingredient(f'{keyword}_limit_{i:02d}_p8', status='APPROVED')
        created.append(ing)

    response = client.get(f'/api/ingredients/search/?q={keyword}')
    assert response.status_code == 200

    data = response.json()
    results = data.get('data', [])
    assert len(results) <= 10, (
        f"Kết quả có {len(results)} items, vượt quá giới hạn 10"
    )

    # Cleanup
    Ingredient.objects.filter(name__contains='_limit_').delete()


# ==============================================================================
# INTEGRATION TESTS — Example-based
# ==============================================================================

@pytest.mark.django_db
def test_search_finds_ingredient_by_keyword(db):
    """
    GET /api/ingredients/search/?q=thit → HTTP 200, kết quả chứa ingredients có 'thit' trong name.
    Validates: Req 6.1
    """
    client = APIClient()
    ing = Ingredient.objects.create(name='Thit bo tuoi', category='PROTEIN', status='APPROVED')

    response = client.get('/api/ingredients/search/?q=thit')
    assert response.status_code == 200

    names = [r['name'] for r in response.json().get('data', [])]
    assert ing.name in names

    ing.delete()


@pytest.mark.django_db
def test_search_nonexistent_returns_empty(db):
    """
    GET /api/ingredients/search/?q=xyz_khong_ton_tai → HTTP 200 với data=[].
    Validates: Req 6.3
    """
    client = APIClient()
    response = client.get('/api/ingredients/search/?q=xyz_khong_ton_tai_abc999')
    assert response.status_code == 200
    assert response.json().get('data') == []


@pytest.mark.django_db
def test_search_no_q_param_returns_empty(db):
    """
    Không có param q → HTTP 200 với data=[].
    Validates: Req 6.6
    """
    client = APIClient()
    response = client.get('/api/ingredients/search/')
    assert response.status_code == 200
    assert response.json().get('data') == []


@pytest.mark.django_db
def test_search_unauthenticated_allowed(db):
    """
    Unauthenticated request → HTTP 200 (AllowAny).
    Validates: Req 6.7
    """
    client = APIClient()  # Không authenticate
    response = client.get('/api/ingredients/search/?q=test')
    assert response.status_code == 200


@pytest.mark.django_db
def test_search_results_sorted_by_name(db):
    """
    Kết quả được sắp xếp theo name tăng dần.
    Validates: Req 6.4
    """
    client = APIClient()

    # Tạo ingredients với tên không theo thứ tự
    names = ['zzz_sort_test', 'aaa_sort_test', 'mmm_sort_test']
    created = []
    for name in names:
        ing = Ingredient.objects.create(name=name, category='OTHER', status='APPROVED')
        created.append(ing)

    response = client.get('/api/ingredients/search/?q=sort_test')
    assert response.status_code == 200

    result_names = [r['name'] for r in response.json().get('data', [])]
    assert result_names == sorted(result_names), (
        f"Kết quả không được sắp xếp theo name: {result_names}"
    )

    for ing in created:
        ing.delete()
