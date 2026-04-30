from django.db import migrations, models
import uuid


class Migration(migrations.Migration):
    dependencies = [
        ('recipes', '0002_add_view_count_to_recipe'),
    ]

    operations = [
        # Create RecipeCategory model
        migrations.CreateModel(
            name='RecipeCategory',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=100, unique=True)),
                ('slug', models.SlugField(blank=True, max_length=100, unique=True)),
                ('description', models.TextField(blank=True, default='')),
                ('order', models.IntegerField(default=0, help_text='Thứ tự hiển thị')),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Danh mục công thức',
                'verbose_name_plural': 'Danh mục công thức',
                'db_table': 'recipe_categories',
                'ordering': ['order', 'name'],
            },
        ),
        # Add ManyToMany field to Recipe
        migrations.AddField(
            model_name='recipe',
            name='categories',
            field=models.ManyToManyField(
                blank=True,
                related_name='recipes',
                to='recipes.recipecategory',
                symmetrical=False
            ),
        ),
    ]