"""
Migration để seed các đơn vị đo lường phổ biến.
"""
from django.db import migrations


def seed_units(apps, schema_editor):
    """Tạo các đơn vị mặc định."""
    Unit = apps.get_model('ingredients', 'Unit')

    units_data = [
        # Khối lượng
        {'name': 'Kilogram', 'slug': 'kg'},
        {'name': 'Gram', 'slug': 'g'},
        {'name': 'Miligram', 'slug': 'mg'},
        # Thể tích
        {'name': 'Lít', 'slug': 'l'},
        {'name': 'Mililít', 'slug': 'ml'},
        # Đếm
        {'name': 'Quả', 'slug': 'qua'},
        {'name': 'Miếng', 'slug': 'mieng'},
        {'name': 'Túi', 'slug': 'tui'},
        {'name': 'Chai', 'slug': 'chai'},
        {'name': 'Hộp', 'slug': 'hop'},
        {'name': 'Gói', 'slug': 'goi'},
        # Thìa
        {'name': 'Muỗng canh', 'slug': 'muong_canh'},
        {'name': 'Thìa canh', 'slug': 'thia_canh'},
        {'name': 'Muỗng cà phê', 'slug': 'muong_cafe'},
        {'name': 'Thìa cà phê', 'slug': 'thia_cafe'},
    ]

    for unit_data in units_data:
        Unit.objects.get_or_create(slug=unit_data['slug'], defaults=unit_data)


def reverse_seed(apps, schema_editor):
    """Xóa các đơn vị đã seed (chỉ xóa những cái không được gán cho ingredient nào)."""
    Unit = apps.get_model('ingredients', 'Unit')
    slugs = ['kg', 'g', 'mg', 'l', 'ml', 'qua', 'mieng', 'tui', 'chai', 'hop', 'goi',
             'muong_canh', 'thia_canh', 'muong_cafe', 'thia_cafe']
    Unit.objects.filter(slug__in=slugs, default_for_ingredients__isnull=True,
                        used_in_ingredients__isnull=True).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('ingredients', '0002_add_unit_fields'),
    ]

    operations = [
        migrations.RunPython(seed_units, reverse_seed),
    ]