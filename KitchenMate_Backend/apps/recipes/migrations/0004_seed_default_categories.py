from django.db import migrations


def create_default_categories(apps, schema_editor):
    RecipeCategory = apps.get_model('recipes', 'RecipeCategory')
    default_categories = [
        {'name': 'Món Việt', 'slug': 'mon-viet', 'description': 'Các món ăn truyền thống Việt Nam', 'order': 1},
        {'name': 'Món Á', 'slug': 'mon-a', 'description': 'Các món ăn châu Á', 'order': 2},
        {'name': 'Món Tây', 'slug': 'mon-tay', 'description': 'Các món ăn phương Tây', 'order': 3},
        {'name': 'Tráng miệng', 'slug': 'trang-miem', 'description': 'Các món tráng miệng ngọt', 'order': 4},
        {'name': 'Đồ uống', 'slug': 'do-uong', 'description': 'Các loại đồ uống', 'order': 5},
        {'name': 'Món chay', 'slug': 'mon-chay', 'description': 'Các món ăn chay', 'order': 6},
    ]
    for cat in default_categories:
        RecipeCategory.objects.get_or_create(
            slug=cat['slug'],
            defaults=cat
        )


def reverse_migration(apps, schema_editor):
    RecipeCategory = apps.get_model('recipes', 'RecipeCategory')
    RecipeCategory.objects.filter(slug__in=[
        'mon-viet', 'mon-a', 'mon-tay', 'trang-miem', 'do-uong', 'mon-chay'
    ]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('recipes', '0003_recipe_category'),
    ]

    operations = [
        migrations.RunPython(create_default_categories, reverse_migration),
    ]