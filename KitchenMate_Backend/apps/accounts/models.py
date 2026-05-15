import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    """
    Custom User model cho KitchenMate.
    Dùng email làm trường đăng nhập thay vì username.
    UUID làm primary key để tránh lộ thông tin số lượng user.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=100)
    avatar_url = models.TextField(blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    google_user_id = models.CharField(
        max_length=255,
        unique=True,
        null=True,
        blank=True,
        help_text="Google OAuth subject ID (sub claim)"
    )
    is_google_user = models.BooleanField(
        default=False,
        help_text="Whether user logged in via Google at least once"
    )

    # Dùng email làm trường đăng nhập
    USERNAME_FIELD = 'email'
    # username và full_name bắt buộc khi tạo superuser qua CLI
    REQUIRED_FIELDS = ['username', 'full_name']

    class Meta:
        db_table = 'users'
        verbose_name = 'Người dùng'
        verbose_name_plural = 'Người dùng'

    def __str__(self):
        return self.email


class UserFollow(models.Model):
    """Quan hệ theo dõi giữa hai người dùng."""
    follower = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='following_relations',
    )
    following = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='follower_relations',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'user_follows'
        verbose_name = 'Theo dõi người dùng'
        verbose_name_plural = 'Theo dõi người dùng'
        constraints = [
            models.UniqueConstraint(
                fields=['follower', 'following'],
                name='unique_user_follow_relation',
            ),
            models.CheckConstraint(
                condition=~models.Q(follower=models.F('following')),
                name='prevent_self_follow',
            ),
        ]
        indexes = [
            models.Index(fields=['follower', 'created_at']),
            models.Index(fields=['following', 'created_at']),
        ]

    def __str__(self):
        return f'{self.follower_id} -> {self.following_id}'
