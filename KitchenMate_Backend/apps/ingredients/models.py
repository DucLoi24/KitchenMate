from django.db import models
from django.conf import settings


class Unit(models.Model):
    """
    Danh mục đơn vị đo lường cho nguyên liệu.
    Admin quản lý danh sách đơn vị, có thể soft-delete.
    """
    name = models.CharField(max_length=50)
    slug = models.SlugField(max_length=20, unique=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'units'
        verbose_name = 'Đơn vị'
        verbose_name_plural = 'Đơn vị'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.slug})"

    def delete(self, *args, **kwargs):
        """Soft delete — chỉ set is_active=False."""
        self.is_active = False
        self.save(update_fields=['is_active'])


class Ingredient(models.Model):
    """
    Danh mục nguyên liệu dùng chung toàn hệ thống.
    Người dùng có thể đóng góp nguyên liệu mới (status=PENDING),
    Admin/AI sẽ duyệt trước khi hiển thị (status=APPROVED).
    """

    class Category(models.TextChoices):
        PROTEIN = 'PROTEIN', 'Đạm (Thịt, cá, trứng...)'
        CARB = 'CARB', 'Tinh bột (Gạo, mì, bún...)'
        VEG = 'VEG', 'Rau củ'
        SPICE = 'SPICE', 'Gia vị đặc trưng (Sả, ớt, hồi...)'
        STAPLE = 'STAPLE', 'Gia vị cơ bản (Muối, đường, dầu...)'
        OTHER = 'OTHER', 'Khác'

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Chờ duyệt'
        APPROVED = 'APPROVED', 'Đã duyệt'
        REJECTED = 'REJECTED', 'Đã từ chối'

    name = models.CharField(max_length=100, unique=True)
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.OTHER
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.APPROVED
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='contributed_ingredients'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    default_unit = models.ForeignKey(
        'Unit',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='default_for_ingredients'
    )
    rejection_reason = models.TextField(blank=True, null=True)
    allowed_units = models.ManyToManyField(
        'Unit',
        related_name='used_in_ingredients',
        blank=True
    )

    class Meta:
        db_table = 'ingredients'
        verbose_name = 'Nguyên liệu'
        verbose_name_plural = 'Nguyên liệu'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.get_category_display()})"
