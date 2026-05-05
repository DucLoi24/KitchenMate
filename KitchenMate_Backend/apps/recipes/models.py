import uuid
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from django.utils.text import slugify
from django.utils import timezone
from datetime import timedelta


class RecipeCategory(models.Model):
    """
    Danh mục phân loại công thức nấu ăn.
    Admin có thể CRUD, có soft delete.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    description = models.TextField(blank=True, default='')
    order = models.IntegerField(default=0, help_text='Thứ tự hiển thị')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'recipe_categories'
        verbose_name = 'Danh mục công thức'
        verbose_name_plural = 'Danh mục công thức'
        ordering = ['order', 'name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class RecipeManager(models.Manager):
    """Manager mặc định — lọc các recipe chưa bị xóa (is_deleted=False)."""

    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)

    def all_with_deleted(self):
        """Trả về tất cả recipe bao gồm cả đã xóa."""
        return super().get_queryset()

    def deleted(self):
        """Trả về chỉ các recipe đã bị xóa."""
        return super().get_queryset().filter(is_deleted=True)


class Recipe(models.Model):
    """
    Thông tin tổng quan của một công thức nấu ăn.
    visibility=PRIVATE: chỉ chủ sở hữu thấy.
    visibility=PENDING: đang chờ Admin duyệt.
    visibility=PUBLIC: hiển thị công khai.

    Soft delete:
    - Khi xóa, is_deleted=True và deleted_at=now.
    - Auto-hard-delete sau 14 ngày trong trash.
    """
    TRASH_RETENTION_DAYS = 14

    objects = RecipeManager()

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='recipes'
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    prep_time = models.IntegerField(
        validators=[MinValueValidator(1)],
        help_text='Thời gian thực hiện (phút)',
        null=True,
        blank=True
    )
    difficulty = models.CharField(
        max_length=10,
        choices=[
            ('EASY', 'Dễ'),
            ('MEDIUM', 'Trung bình'),
            ('HARD', 'Khó'),
        ],
        default='EASY'
    )
    visibility = models.CharField(
        max_length=10,
        choices=[
            ('PRIVATE', 'Riêng tư'),
            ('PENDING', 'Chờ duyệt'),
            ('PUBLIC', 'Công khai'),
        ],
        default='PRIVATE'
    )
    thumbnail_url = models.TextField(blank=True, null=True)
    view_count = models.PositiveIntegerField(default=0)
    categories = models.ManyToManyField(
        RecipeCategory,
        related_name='recipes',
        blank=True,
        symmetrical=False
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True, null=True)
    has_invalid_ingredients = models.BooleanField(default=False)
    ai_moderation_attempted = models.BooleanField(default=False)

    class Meta:
        db_table = 'recipes'
        verbose_name = 'Công thức'
        verbose_name_plural = 'Công thức'
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    @property
    def is_expired(self):
        """Kiểm tra xem recipe đã hết hạn trong trash chưa (14 ngày)."""
        if not self.is_deleted or not self.deleted_at:
            return False
        return timezone.now() > self.deleted_at + timedelta(days=self.TRASH_RETENTION_DAYS)

    def soft_delete(self):
        """Đưa recipe vào trash: set is_deleted=True và deleted_at=now."""
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=['is_deleted', 'deleted_at'])

    def restore(self):
        """Khôi phục recipe từ trash: clear is_deleted và deleted_at."""
        self.is_deleted = False
        self.deleted_at = None
        self.save(update_fields=['is_deleted', 'deleted_at'])


class RecipeIngredient(models.Model):
    """
    Bảng trung gian Many-to-Many giữa Recipe và Ingredient.
    Lưu định lượng và đơn vị của từng nguyên liệu trong công thức.
    """
    recipe = models.ForeignKey(
        Recipe,
        on_delete=models.CASCADE,
        related_name='recipe_ingredients'
    )
    ingredient = models.ForeignKey(
        'ingredients.Ingredient',
        on_delete=models.PROTECT,
        related_name='used_in_recipes'
    )
    quantity = models.FloatField(validators=[MinValueValidator(0)])
    unit = models.CharField(max_length=20)

    class Meta:
        db_table = 'recipe_ingredients'
        verbose_name = 'Nguyên liệu công thức'
        verbose_name_plural = 'Nguyên liệu công thức'

    def __str__(self):
        return f"{self.quantity} {self.unit} {self.ingredient.name}"


class RecipeStep(models.Model):
    """
    Các bước thực hiện của một công thức.
    Tự động sắp xếp theo step_number.
    """
    recipe = models.ForeignKey(
        Recipe,
        on_delete=models.CASCADE,
        related_name='steps'
    )
    step_number = models.IntegerField(validators=[MinValueValidator(1)])
    instruction = models.TextField()
    media_url = models.TextField(
        blank=True,
        null=True,
        help_text='URL ảnh hoặc video minh họa cho bước này'
    )

    class Meta:
        db_table = 'recipe_steps'
        verbose_name = 'Bước thực hiện'
        verbose_name_plural = 'Bước thực hiện'
        ordering = ['step_number']

    def __str__(self):
        return f"Bước {self.step_number}: {self.recipe.title}"