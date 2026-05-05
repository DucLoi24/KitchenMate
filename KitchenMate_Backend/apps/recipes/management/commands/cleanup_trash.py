"""
Management command: Xóa vĩnh viễn các recipe đã hết hạn trong trash (sau 14 ngày).
Chạy: python manage.py cleanup_trash
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from apps.recipes.models import Recipe


class Command(BaseCommand):
    help = 'Xóa vĩnh viễn các recipe đã hết hạn trong trash (sau 14 ngày)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Chỉ hiển thị các recipe sẽ bị xóa, không xóa thật',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']

        expired_recipes = Recipe.objects.deleted().filter(
            deleted_at__lt=timezone.now() - timedelta(days=Recipe.TRASH_RETENTION_DAYS)
        )

        count = expired_recipes.count()
        if count == 0:
            self.stdout.write(self.style.SUCCESS('Khong co recipe nao het han trong trash.'))
            return

        if dry_run:
            self.stdout.write(self.style.WARNING(f'Sẽ xóa {count} recipe:'))
            for recipe in expired_recipes:
                self.stdout.write(f'  - {recipe.title} (xóa lúc {recipe.deleted_at})')
        else:
            for recipe in expired_recipes:
                self.stdout.write(f'Xóa vĩnh viễn: {recipe.title}')
            expired_recipes.delete()
            self.stdout.write(self.style.SUCCESS(f'Đã xóa vĩnh viễn {count} recipe.'))