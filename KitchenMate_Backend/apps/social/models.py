from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class Review(models.Model):
    """
    Đánh giá, bình luận và ảnh trả bài (cooksnap) của người dùng.
    Unique constraint (user, recipe) đảm bảo mỗi user chỉ review 1 lần/công thức.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reviews'
    )
    recipe = models.ForeignKey(
        'recipes.Recipe',
        on_delete=models.CASCADE,
        related_name='reviews'
    )
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text='Điểm đánh giá từ 1 đến 5 sao'
    )
    comment = models.TextField(blank=True, null=True)
    cooksnap_url = models.TextField(
        blank=True,
        null=True,
        help_text='URL ảnh thực tế món ăn người dùng đã nấu'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'reviews'
        verbose_name = 'Đánh giá'
        verbose_name_plural = 'Đánh giá'
        unique_together = ('user', 'recipe')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.recipe.title}: {self.rating}★"


class Collection(models.Model):
    """
    Thư mục bộ sưu tập công thức cá nhân của người dùng.
    Ví dụ: 'Món ngon ngày Tết', 'Thực đơn giảm cân'
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='collections'
    )
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'collections'
        verbose_name = 'Bộ sưu tập'
        verbose_name_plural = 'Bộ sưu tập'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.name}"


class CollectionRecipe(models.Model):
    """
    Bảng trung gian Many-to-Many giữa Collection và Recipe.
    Unique constraint (collection, recipe) tránh lưu trùng công thức.
    Bảng này cũng là nguồn dữ liệu cho thuật toán gợi ý (+50 điểm Affinity Bonus).
    """
    collection = models.ForeignKey(
        Collection,
        on_delete=models.CASCADE,
        related_name='collection_recipes'
    )
    recipe = models.ForeignKey(
        'recipes.Recipe',
        on_delete=models.CASCADE,
        related_name='saved_in_collections'
    )
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'collection_recipes'
        verbose_name = 'Công thức trong bộ sưu tập'
        verbose_name_plural = 'Công thức trong bộ sưu tập'
        unique_together = ('collection', 'recipe')

    def __str__(self):
        return f"{self.collection.name} ← {self.recipe.title}"
