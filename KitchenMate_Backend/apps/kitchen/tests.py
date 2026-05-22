"""
Property-based tests cho kitchen app.
Feature: phase-4-api-endpoints, phase-7-transaction
"""
import uuid
from unittest.mock import patch
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient
from hypothesis import given, settings
from hypothesis import strategies as st
from hypothesis.extra.django import TestCase as HypothesisTestCase

from apps.ingredients.models import Ingredient, Unit
from .models import Pantry, ShoppingList

User = get_user_model()


def make_user():
    email = f'user_{uuid.uuid4().hex[:8]}@test.com'
    return User.objects.create_user(username=email, email=email, full_name='Test', password='pass123')


def make_ingredient(category='OTHER'):
    return Ingredient.objects.create(
        name=f'ing_{uuid.uuid4().hex[:8]}', status='APPROVED', category=category
    )


def make_pantry(user, ingredient, quantity=1.0, unit='kg'):
    return Pantry.objects.create(user=user, ingredient=ingredient, quantity=quantity, unit=unit)


def make_shopping_item(user, ingredient, quantity=1.0, unit='kg'):
    return ShoppingList.objects.create(user=user, ingredient=ingredient, quantity=quantity, unit=unit)


# Feature: phase-4-api-endpoints, Property 12: Pantry data isolation giua users
class PantryIsolationPropertyTest(HypothesisTestCase):
    """Property 12: GET /api/kitchen/pantry/ chi tra ve du lieu cua user hien tai."""

    @given(
        user1_items=st.integers(min_value=1, max_value=4),
        user2_items=st.integers(min_value=1, max_value=4),
    )
    @settings(max_examples=20, deadline=None)
    def test_pantry_isolation_between_users(self, user1_items, user2_items):
        """
        Moi user chi thay Pantry items cua chinh ho.
        """
        user1 = make_user()
        user2 = make_user()

        for _ in range(user1_items):
            make_pantry(user1, make_ingredient())
        for _ in range(user2_items):
            make_pantry(user2, make_ingredient())

        client = APIClient()

        # User1 chi thay items cua minh
        client.force_authenticate(user=user1)
        resp1 = client.get('/api/kitchen/pantry/')
        self.assertEqual(resp1.status_code, 200)
        results1 = resp1.data['data']['results']
        self.assertEqual(len(results1), user1_items)

        # User2 chi thay items cua minh
        client.force_authenticate(user=user2)
        resp2 = client.get('/api/kitchen/pantry/')
        self.assertEqual(resp2.status_code, 200)
        results2 = resp2.data['data']['results']
        self.assertEqual(len(results2), user2_items)


# Feature: phase-4-api-endpoints, Property 13: mark_purchased cong don dung vao Pantry
class MarkPurchasedPropertyTest(HypothesisTestCase):
    """Property 13: mark_purchased dat is_purchased=True va cong don quantity vao Pantry."""

    @given(
        shopping_qty=st.floats(min_value=0.1, max_value=100.0, allow_nan=False, allow_infinity=False),
        existing_qty=st.floats(min_value=0.0, max_value=100.0, allow_nan=False, allow_infinity=False),
    )
    @settings(max_examples=20, deadline=None)
    def test_mark_purchased_accumulates_quantity(self, shopping_qty, existing_qty):
        """
        Sau mark_purchased:
        - ShoppingList item co is_purchased=True
        - Pantry item co quantity = existing_qty + shopping_qty
        """
        user = make_user()
        ingredient = make_ingredient()
        client = APIClient()
        client.force_authenticate(user=user)

        # Tao pantry item truoc (neu co)
        if existing_qty > 0:
            make_pantry(user, ingredient, quantity=existing_qty, unit='kg')

        # Tao shopping item
        shopping_item = make_shopping_item(user, ingredient, quantity=shopping_qty, unit='kg')

        response = client.post(f'/api/kitchen/shopping-list/{shopping_item.pk}/mark-purchased/')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['success'])

        # Kiem tra is_purchased
        shopping_item.refresh_from_db()
        self.assertTrue(shopping_item.is_purchased)

        # Kiem tra quantity trong Pantry
        pantry = Pantry.objects.get(user=user, ingredient=ingredient)
        expected_qty = existing_qty + shopping_qty
        self.assertAlmostEqual(pantry.quantity, expected_qty, places=5)

    @given(st.just(None))
    @settings(max_examples=10, deadline=None)
    def test_mark_purchased_creates_pantry_if_not_exists(self, _):
        """Neu chua co Pantry item, mark_purchased phai tao moi."""
        user = make_user()
        ingredient = make_ingredient()
        shopping_item = make_shopping_item(user, ingredient, quantity=2.5, unit='g')

        client = APIClient()
        client.force_authenticate(user=user)
        response = client.post(f'/api/kitchen/shopping-list/{shopping_item.pk}/mark-purchased/')
        self.assertEqual(response.status_code, 200)

        pantry = Pantry.objects.get(user=user, ingredient=ingredient)
        self.assertAlmostEqual(pantry.quantity, 2.5, places=5)


class ShoppingListUpdateTest(TestCase):
    """Regression tests cho PATCH /api/kitchen/shopping-list/{id}/."""

    def setUp(self):
        self.user = make_user()
        self.ingredient = make_ingredient()
        suffix = uuid.uuid4().hex[:6]
        self.gram = Unit.objects.create(name=f'Gram test {suffix}', slug=f'gram-test-{suffix}')
        self.kilogram = Unit.objects.create(name=f'Kilogram test {suffix}', slug=f'kg-test-{suffix}')
        self.ingredient.default_unit = self.gram
        self.ingredient.save(update_fields=['default_unit'])
        self.ingredient.allowed_units.set([self.gram, self.kilogram])
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_partial_update_quantity_and_unit(self):
        shopping_item = make_shopping_item(
            self.user,
            self.ingredient,
            quantity=1.0,
            unit=self.gram.slug,
        )

        response = self.client.patch(
            f'/api/kitchen/shopping-list/{shopping_item.pk}/',
            {'quantity': 2.5, 'unit': self.kilogram.slug},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['quantity'], 2.5)
        self.assertEqual(response.data['data']['unit'], self.kilogram.slug)
        self.assertEqual(response.data['data']['unit_display'], self.kilogram.name)

        shopping_item.refresh_from_db()
        self.assertEqual(shopping_item.quantity, 2.5)
        self.assertEqual(shopping_item.unit, self.kilogram.slug)

    def test_cannot_update_purchased_item(self):
        shopping_item = make_shopping_item(
            self.user,
            self.ingredient,
            quantity=1.0,
            unit=self.gram.slug,
        )
        shopping_item.is_purchased = True
        shopping_item.save(update_fields=['is_purchased'])

        response = self.client.patch(
            f'/api/kitchen/shopping-list/{shopping_item.pk}/',
            {'quantity': 3.0},
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.data['success'])
        shopping_item.refresh_from_db()
        self.assertEqual(shopping_item.quantity, 1.0)

    def test_rejects_unit_outside_ingredient_allowed_units(self):
        shopping_item = make_shopping_item(
            self.user,
            self.ingredient,
            quantity=1.0,
            unit=self.gram.slug,
        )

        response = self.client.patch(
            f'/api/kitchen/shopping-list/{shopping_item.pk}/',
            {'unit': 'don-vi-khong-hop-le'},
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.data['success'])
        self.assertIn('unit', response.data['error']['details'])
        shopping_item.refresh_from_db()
        self.assertEqual(shopping_item.unit, self.gram.slug)

    def test_cannot_change_ingredient_during_update(self):
        shopping_item = make_shopping_item(
            self.user,
            self.ingredient,
            quantity=1.0,
            unit=self.gram.slug,
        )
        other_ingredient = make_ingredient()

        response = self.client.patch(
            f'/api/kitchen/shopping-list/{shopping_item.pk}/',
            {'ingredient': other_ingredient.pk},
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.data['success'])
        self.assertIn('ingredient', response.data['error']['details'])
        shopping_item.refresh_from_db()
        self.assertEqual(shopping_item.ingredient_id, self.ingredient.pk)

# ─── Phase 7: Transaction Rollback Tests ─────────────────────────────────────

class TransactionRollbackTest(TestCase):
    """
    Phase 7 — Kiem tra atomic transaction rollback.
    Khi co loi xay ra giua chung, ca ShoppingList va Pantry phai giu nguyen trang thai ban dau.
    """

    def setUp(self):
        email = f'user_{uuid.uuid4().hex[:8]}@test.com'
        self.user = User.objects.create_user(
            username=email, email=email, full_name='Test', password='pass123'
        )
        self.ingredient = Ingredient.objects.create(
            name=f'ing_{uuid.uuid4().hex[:8]}', status='APPROVED', category='OTHER'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_rollback_shopping_item_unchanged_on_pantry_save_error(self):
        """
        Neu Pantry.save() nem exception, ShoppingList.is_purchased phai van la False.
        Transaction phai rollback toan bo.
        """
        shopping_item = ShoppingList.objects.create(
            user=self.user, ingredient=self.ingredient, quantity=3.0, unit='kg'
        )
        self.assertFalse(shopping_item.is_purchased)

        # Mock Pantry.save() de nem loi sau khi ShoppingList da duoc update
        with patch.object(Pantry, 'save', side_effect=Exception('DB error')):
            response = self.client.post(
                f'/api/kitchen/shopping-list/{shopping_item.pk}/mark-purchased/'
            )

        # API phai tra ve loi 500
        self.assertEqual(response.status_code, 500)
        self.assertFalse(response.data['success'])

        # ShoppingList phai rollback — is_purchased van la False
        shopping_item.refresh_from_db()
        self.assertFalse(shopping_item.is_purchased)

        # Pantry khong duoc tao
        self.assertFalse(
            Pantry.objects.filter(user=self.user, ingredient=self.ingredient).exists()
        )

    def test_rollback_pantry_unchanged_on_shopping_save_error(self):
        """
        Neu ShoppingList.save() nem exception, Pantry hien co phai giu nguyen quantity.
        """
        # Tao pantry truoc voi quantity = 5.0
        pantry = Pantry.objects.create(
            user=self.user, ingredient=self.ingredient, quantity=5.0, unit='kg'
        )
        shopping_item = ShoppingList.objects.create(
            user=self.user, ingredient=self.ingredient, quantity=3.0, unit='kg'
        )

        # Mock ShoppingList.save() de nem loi
        with patch.object(ShoppingList, 'save', side_effect=Exception('DB error')):
            response = self.client.post(
                f'/api/kitchen/shopping-list/{shopping_item.pk}/mark-purchased/'
            )

        self.assertEqual(response.status_code, 500)

        # Pantry phai giu nguyen quantity = 5.0 (khong bi cong them)
        pantry.refresh_from_db()
        self.assertAlmostEqual(pantry.quantity, 5.0, places=5)

        # ShoppingList van chua duoc mua
        shopping_item.refresh_from_db()
        self.assertFalse(shopping_item.is_purchased)


# Feature: phase-7-transaction, Property 14: mark_unpurchased dat is_purchased=False va tru quantity khoi Pantry
class MarkUnpurchasedPropertyTest(HypothesisTestCase):
    """Property 14: mark_unpurchased dat is_purchased=False va tru quantity khoi Pantry."""

    @given(
        shopping_qty=st.floats(min_value=0.1, max_value=100.0, allow_nan=False, allow_infinity=False),
        existing_qty=st.floats(min_value=0.5, max_value=100.0, allow_nan=False, allow_infinity=False),
    )
    @settings(max_examples=20, deadline=None)
    def test_mark_unpurchased_subtracts_quantity(self, shopping_qty, existing_qty):
        """
        Sau mark_unpurchased:
        - ShoppingList item co is_purchased=False
        - Pantry item co quantity = existing_qty (da tru shopping_qty khoi luong da cong don)
        """
        user = make_user()
        ingredient = make_ingredient()
        client = APIClient()
        client.force_authenticate(user=user)

        # Tao pantry item truoc
        make_pantry(user, ingredient, quantity=existing_qty, unit='kg')

        # Tao va mark purchased shopping item
        shopping_item = make_shopping_item(user, ingredient, quantity=shopping_qty, unit='kg')
        client.post(f'/api/kitchen/shopping-list/{shopping_item.pk}/mark-purchased/')

        # Unmark
        response = client.post(f'/api/kitchen/shopping-list/{shopping_item.pk}/mark-unpurchased/')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['success'])

        # Kiem tra is_purchased
        shopping_item.refresh_from_db()
        self.assertFalse(shopping_item.is_purchased)

        # Kiem tra quantity trong Pantry - should be back to existing_qty
        pantry = Pantry.objects.get(user=user, ingredient=ingredient)
        self.assertAlmostEqual(pantry.quantity, existing_qty, places=5)

    @given(st.just(None))
    @settings(max_examples=10, deadline=None)
    def test_mark_unpurchased_deletes_pantry_if_quantity_zero(self, _):
        """Neu quantity sau khi tru <= 0, Pantry item phai bi xoa."""
        user = make_user()
        ingredient = make_ingredient()
        client = APIClient()
        client.force_authenticate(user=user)

        # existing_qty = 0 de sau mark_purchased(pantry=0+2=2) va mark_unpurchased(pantry=2-2=0) -> xoa
        make_pantry(user, ingredient, quantity=0.0, unit='kg')
        shopping_item = make_shopping_item(user, ingredient, quantity=2.0, unit='kg')
        client.post(f'/api/kitchen/shopping-list/{shopping_item.pk}/mark-purchased/')

        response = client.post(f'/api/kitchen/shopping-list/{shopping_item.pk}/mark-unpurchased/')
        self.assertEqual(response.status_code, 200)

        shopping_item.refresh_from_db()
        self.assertFalse(shopping_item.is_purchased)
        self.assertFalse(Pantry.objects.filter(user=user, ingredient=ingredient).exists())


class MarkUnpurchasedRollbackTest(TestCase):
    """Kiem tra rollback khi mark_unpurchased that bai."""

    def setUp(self):
        email = f'user_{uuid.uuid4().hex[:8]}@test.com'
        self.user = User.objects.create_user(
            username=email, email=email, full_name='Test', password='pass123'
        )
        self.ingredient = Ingredient.objects.create(
            name=f'ing_{uuid.uuid4().hex[:8]}', status='APPROVED', category='OTHER'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_rollback_on_pantry_error(self):
        """Neu Pantry operation that bai, ShoppingList.is_purchased phai van la True."""
        # Setup: tao pantry + shopping item da purchased
        pantry = Pantry.objects.create(
            user=self.user, ingredient=self.ingredient, quantity=5.0, unit='kg'
        )
        shopping_item = ShoppingList.objects.create(
            user=self.user, ingredient=self.ingredient, quantity=3.0, unit='kg',
            is_purchased=True
        )

        # Mock de subtract loi
        with patch.object(Pantry.objects, 'filter', side_effect=Exception('DB error')):
            response = self.client.post(
                f'/api/kitchen/shopping-list/{shopping_item.pk}/mark-unpurchased/'
            )

        self.assertEqual(response.status_code, 500)
        shopping_item.refresh_from_db()
        self.assertTrue(shopping_item.is_purchased)  # Rollback ve True
