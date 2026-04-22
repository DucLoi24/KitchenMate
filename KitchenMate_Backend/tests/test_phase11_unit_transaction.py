"""
Unit Tests — Transaction Rollback (Phase 11)
Kiểm tra tính atomicity của mark_purchased và Pantry accumulation.
"""
import pytest
from unittest.mock import patch, MagicMock
from django.contrib.auth import get_user_model
from hypothesis import given, settings as hyp_settings
from hypothesis import strategies as st

User = get_user_model()


def make_user(email=None):
    import uuid
    email = email or f'txn_user_{uuid.uuid4().hex[:8]}@example.com'
    return User.objects.create_user(
        username=email,
        email=email,
        full_name='Txn User',
        password='testpass123',
    )


def make_ingredient(name=None, category='OTHER'):
    from apps.ingredients.models import Ingredient
    import uuid
    name = name or f'txn_ing_{uuid.uuid4().hex[:8]}'
    return Ingredient.objects.create(name=name, category=category, status='APPROVED')


@pytest.mark.unit
@pytest.mark.django_db(transaction=True)
class TestMarkPurchasedSuccess:
    """Tests cho mark_purchased thành công."""

    def test_mark_purchased_sets_is_purchased_true(self):
        """mark_purchased thành công → is_purchased=True."""
        from apps.kitchen.models import Pantry, ShoppingList
        from django.db import transaction

        user = make_user()
        ingredient = make_ingredient()
        item = ShoppingList.objects.create(
            user=user, ingredient=ingredient, quantity=200, unit='gram'
        )

        with transaction.atomic():
            item.is_purchased = True
            item.save(update_fields=['is_purchased'])
            Pantry.objects.get_or_create(
                user=user,
                ingredient=ingredient,
                defaults={'quantity': 0, 'unit': item.unit}
            )

        item.refresh_from_db()
        assert item.is_purchased is True

    def test_mark_purchased_creates_new_pantry_item(self):
        """mark_purchased khi Pantry chưa tồn tại → tạo Pantry mới với đúng quantity."""
        from apps.kitchen.models import Pantry, ShoppingList
        from django.db import transaction

        user = make_user()
        ingredient = make_ingredient()
        item = ShoppingList.objects.create(
            user=user, ingredient=ingredient, quantity=300, unit='gram'
        )

        with transaction.atomic():
            item.is_purchased = True
            item.save(update_fields=['is_purchased'])
            pantry_item, created = Pantry.objects.get_or_create(
                user=user,
                ingredient=ingredient,
                defaults={'quantity': 0, 'unit': item.unit}
            )
            pantry_item.quantity += item.quantity
            pantry_item.save(update_fields=['quantity', 'updated_at'])

        assert created is True
        pantry_item.refresh_from_db()
        assert pantry_item.quantity == 300

    def test_mark_purchased_accumulates_existing_pantry(self):
        """mark_purchased khi Pantry đã tồn tại → cộng dồn quantity."""
        from apps.kitchen.models import Pantry, ShoppingList
        from django.db import transaction

        user = make_user()
        ingredient = make_ingredient()
        # Pantry đã có 100 gram
        existing_pantry = Pantry.objects.create(
            user=user, ingredient=ingredient, quantity=100, unit='gram'
        )
        item = ShoppingList.objects.create(
            user=user, ingredient=ingredient, quantity=200, unit='gram'
        )

        with transaction.atomic():
            item.is_purchased = True
            item.save(update_fields=['is_purchased'])
            pantry_item, created = Pantry.objects.get_or_create(
                user=user,
                ingredient=ingredient,
                defaults={'quantity': 0, 'unit': item.unit}
            )
            pantry_item.quantity += item.quantity
            pantry_item.save(update_fields=['quantity', 'updated_at'])

        assert created is False
        pantry_item.refresh_from_db()
        assert pantry_item.quantity == 300  # 100 + 200


@pytest.mark.unit
@pytest.mark.django_db(transaction=True)
class TestMarkPurchasedRollback:
    """Tests cho rollback khi có exception trong transaction."""

    def test_rollback_on_exception_reverts_is_purchased(self):
        """Exception sau khi set is_purchased=True → rollback, is_purchased vẫn False."""
        from apps.kitchen.models import Pantry, ShoppingList
        from django.db import transaction

        user = make_user()
        ingredient = make_ingredient()
        item = ShoppingList.objects.create(
            user=user, ingredient=ingredient, quantity=200, unit='gram'
        )

        try:
            with transaction.atomic():
                item.is_purchased = True
                item.save(update_fields=['is_purchased'])
                # Simulate exception trước khi cập nhật Pantry
                raise RuntimeError("Simulated error after is_purchased=True")
        except RuntimeError:
            pass

        item.refresh_from_db()
        assert item.is_purchased is False, "Rollback phải revert is_purchased về False"

    def test_rollback_on_exception_reverts_pantry(self):
        """Exception trong transaction → Pantry không thay đổi."""
        from apps.kitchen.models import Pantry, ShoppingList
        from django.db import transaction

        user = make_user()
        ingredient = make_ingredient()
        # Pantry ban đầu có 100 gram
        pantry = Pantry.objects.create(
            user=user, ingredient=ingredient, quantity=100, unit='gram'
        )
        item = ShoppingList.objects.create(
            user=user, ingredient=ingredient, quantity=200, unit='gram'
        )

        try:
            with transaction.atomic():
                item.is_purchased = True
                item.save(update_fields=['is_purchased'])
                pantry.quantity += item.quantity
                pantry.save(update_fields=['quantity', 'updated_at'])
                # Simulate exception sau khi cập nhật Pantry
                raise RuntimeError("Simulated error after pantry update")
        except RuntimeError:
            pass

        pantry.refresh_from_db()
        assert pantry.quantity == 100, "Rollback phải revert Pantry về quantity ban đầu"

    def test_after_rollback_shopping_item_still_not_purchased(self):
        """Sau rollback, ShoppingList.is_purchased vẫn là False."""
        from apps.kitchen.models import ShoppingList
        from django.db import transaction

        user = make_user()
        ingredient = make_ingredient()
        item = ShoppingList.objects.create(
            user=user, ingredient=ingredient, quantity=100, unit='gram'
        )

        try:
            with transaction.atomic():
                item.is_purchased = True
                item.save(update_fields=['is_purchased'])
                raise ValueError("Force rollback")
        except ValueError:
            pass

        item.refresh_from_db()
        assert item.is_purchased is False


@pytest.mark.unit
@pytest.mark.pbt
@pytest.mark.django_db(transaction=True)
class TestPantryAccumulationPBT:
    """Property 9: Pantry accumulation invariant — N lần mark-purchased → tổng cộng dồn."""

    @given(
        quantities=st.lists(
            st.floats(min_value=0.1, max_value=1000.0, allow_nan=False, allow_infinity=False),
            min_size=1,
            max_size=5,
        )
    )
    @hyp_settings(max_examples=15, deadline=None)
    def test_pantry_quantity_equals_sum_of_all_purchases(self, quantities):
        """N lần mark-purchased → Pantry.quantity == sum(quantities)."""
        from apps.kitchen.models import Pantry, ShoppingList
        from django.db import transaction
        import uuid

        email = f'pbt_acc_{uuid.uuid4().hex[:8]}@test.com'
        user = User.objects.create_user(
            username=email, email=email, full_name='PBT User', password='pass123'
        )
        from apps.ingredients.models import Ingredient
        ingredient = Ingredient.objects.create(
            name=f'pbt_ing_{uuid.uuid4().hex[:8]}', category='OTHER', status='APPROVED'
        )

        for qty in quantities:
            item = ShoppingList.objects.create(
                user=user, ingredient=ingredient, quantity=qty, unit='gram'
            )
            with transaction.atomic():
                item.is_purchased = True
                item.save(update_fields=['is_purchased'])
                pantry_item, _ = Pantry.objects.get_or_create(
                    user=user,
                    ingredient=ingredient,
                    defaults={'quantity': 0, 'unit': 'gram'}
                )
                pantry_item.quantity += item.quantity
                pantry_item.save(update_fields=['quantity', 'updated_at'])

        pantry = Pantry.objects.get(user=user, ingredient=ingredient)
        expected_total = sum(quantities)
        assert abs(pantry.quantity - expected_total) < 0.001, (
            f"Pantry.quantity={pantry.quantity} != sum={expected_total}"
        )
