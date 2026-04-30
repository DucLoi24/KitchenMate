from django.contrib import admin
from .models import Recipe, RecipeCategory


@admin.register(RecipeCategory)
class RecipeCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'order', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}
    ordering = ['order', 'name']


@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'difficulty', 'visibility', 'view_count', 'created_at']
    list_filter = ['difficulty', 'visibility', 'categories']
    search_fields = ['title', 'description']
    filter_horizontal = ['categories']
    raw_id_fields = ['user']
