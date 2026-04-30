"""
Filters cho recipes app.
"""
import django_filters
from .models import Recipe


class RecipeFilter(django_filters.FilterSet):
    """
    Filter cho RecipeViewSet — hỗ trợ tìm theo title, difficulty,
    khoảng prep_time, tên nguyên liệu và category.
    """
    title = django_filters.CharFilter(field_name='title', lookup_expr='icontains')
    difficulty = django_filters.ChoiceFilter(choices=Recipe.Difficulty.choices)
    prep_time_min = django_filters.NumberFilter(field_name='prep_time', lookup_expr='gte')
    prep_time_max = django_filters.NumberFilter(field_name='prep_time', lookup_expr='lte')
    ingredient = django_filters.CharFilter(method='filter_by_ingredient')
    category = django_filters.UUIDFilter(field_name='categories__id')
    categories = django_filters.CharFilter(method='filter_by_categories')

    def filter_by_ingredient(self, queryset, name, value):
        """
        Tìm công thức theo tên nguyên liệu (case-insensitive).
        Dùng distinct() để tránh duplicate khi một công thức có nhiều nguyên liệu khớp.
        """
        if not value:
            return queryset
        return queryset.filter(
            recipe_ingredients__ingredient__name__icontains=value
        ).distinct()

    def filter_by_categories(self, queryset, name, value):
        """
        Tìm công thức theo category slug hoặc nhiều categories (comma-separated).
        """
        if not value:
            return queryset
        slugs = [s.strip() for s in value.split(',')]
        return queryset.filter(categories__slug__in=slugs, categories__is_active=True).distinct()

    class Meta:
        model = Recipe
        fields = ['difficulty', 'title', 'prep_time_min', 'prep_time_max', 'ingredient', 'category', 'categories']
