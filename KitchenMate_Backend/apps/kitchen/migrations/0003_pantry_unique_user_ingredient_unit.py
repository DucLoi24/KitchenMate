from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('kitchen', '0002_add_ordering_to_pantry_shoppinglist'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='pantry',
            unique_together={('user', 'ingredient', 'unit')},
        ),
        migrations.AlterModelOptions(
            name='pantry',
            options={
                'ordering': ['ingredient__name', 'unit'],
                'verbose_name': 'Tủ lạnh số',
                'verbose_name_plural': 'Tủ lạnh số',
            },
        ),
    ]
