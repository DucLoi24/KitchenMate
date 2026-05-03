"""
Signals cho accounts app.
Tự động tạo các đối tượng liên quan khi user được tạo.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.social.models import Collection


@receiver(post_save, sender='accounts.User')
def create_favorites_collection(sender, instance, created, **kwargs):
    """
    Khi user mới được tạo, tự động tạo một collection 'Yêu thích' mặc định.
    Collection này không thể xóa và dùng để lưu các công thức yêu thích.
    """
    if created:
        Collection.objects.create(
            user=instance,
            name='Yêu thích',
            is_favorites=True,
        )