"""
Migration: Add ai_moderation_attempted field to Recipe model.
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('recipes', '0005_add_missing_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='recipe',
            name='ai_moderation_attempted',
            field=models.BooleanField(default=False),
        ),
    ]
