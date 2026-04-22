from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator


class Pantry(models.Model):
    """
    Tủ lạnh số - lưu trữ nguyên liệu hiện có của người dùng.
    Unique constraint (user, ingredient) đảm bảo mỗi nguyên liệu
    chỉ xuất hiện 1 lần trong tủ lạnh của mỗi user.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='pantry_items'
    )
    ingredient = models.ForeignKey(
        'ingredients.Ingredient',
        on_delete=models.CASCADE,
        related_name='in_pantries'
    )
    quantity = models.FloatField(validators=[MinValueValidator(0)])
    unit = models.CharField(max_length=20)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pantries'
        verbose_name = 'Tủ lạnh số'
        verbose_name_plural = 'Tủ lạnh số'
        unique_together = ('user', 'ingredient')
        ordering = ['ingredient__name']

    def __str__(self):
        return f"{self.user.email} - {self.ingredient.name}: {self.quantity} {self.unit}"


class ShoppingList(models.Model):
    """
    Danh sách đi chợ của người dùng.
    Khi is_purchased=True → kích hoạt transaction cộng dồn vào Pantry.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='shopping_items'
    )
    ingredient = models.ForeignKey(
        'ingredients.Ingredient',
        on_delete=models.CASCADE,
        related_name='in_shopping_lists'
    )
    quantity = models.FloatField(validators=[MinValueValidator(0)])
    unit = models.CharField(max_length=20)
    is_purchased = models.BooleanField(
        default=False,
        help_text='Khi True → tự động cộng dồn vào Pantry qua transaction'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'shopping_lists'
        verbose_name = 'Danh sách đi chợ'
        verbose_name_plural = 'Danh sách đi chợ'
        ordering = ['-created_at']

    def __str__(self):
        status = '✓' if self.is_purchased else '○'
        return f"{status} {self.user.email} - {self.ingredient.name}: {self.quantity} {self.unit}"
