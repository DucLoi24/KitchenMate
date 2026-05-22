from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('recipes', '0008_add_recipe_view_model'),
    ]

    operations = [
        migrations.CreateModel(
            name='RecipeStepMedia',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('media_url', models.TextField(help_text='URL ảnh hoặc video minh họa')),
                ('media_type', models.CharField(choices=[('IMAGE', 'Ảnh'), ('VIDEO', 'Video')], max_length=10)),
                ('order', models.PositiveIntegerField(default=1)),
                ('original_name', models.CharField(blank=True, default='', max_length=255)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('step', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='media_items', to='recipes.recipestep')),
            ],
            options={
                'verbose_name': 'Media bước thực hiện',
                'verbose_name_plural': 'Media bước thực hiện',
                'db_table': 'recipe_step_media',
                'ordering': ['step', 'order', 'created_at'],
            },
        ),
    ]
