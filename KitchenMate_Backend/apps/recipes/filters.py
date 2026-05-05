"""
Filters cho recipes app.
"""
import django_filters
from django.db import models
from .models import Recipe


class RecipeFilter(django_filters.FilterSet):
    """
    Filter cho RecipeViewSet — hỗ trợ tìm theo title, difficulty,
    khoảng prep_time, tên nguyên liệu và category.
    """
    q = django_filters.CharFilter(method='filter_by_search')
    title = django_filters.CharFilter(field_name='title', lookup_expr='icontains')
    difficulty = django_filters.CharFilter(method='filter_by_difficulty')
    cooking_time = django_filters.CharFilter(method='filter_by_cooking_time')
    prep_time_min = django_filters.NumberFilter(field_name='prep_time', lookup_expr='gte')
    prep_time_max = django_filters.NumberFilter(field_name='prep_time', lookup_expr='lte')
    ingredient = django_filters.CharFilter(method='filter_by_ingredient')
    category = django_filters.UUIDFilter(field_name='categories__id')
    categories = django_filters.CharFilter(method='filter_by_categories')

    def filter_by_search(self, queryset, name, value):
        """
        Tìm kiếm theo title và description (case-insensitive).
        """
        if not value:
            return queryset
        return queryset.filter(
            models.Q(title__icontains=value) |
            models.Q(description__icontains=value)
        ).distinct()

    def filter_by_difficulty(self, queryset, name, value):
        """
        Lọc theo difficulty — hỗ trợ nhiều giá trị (comma-separated).
        """
        if not value:
            return queryset
        difficulties = [d.strip().upper() for d in value.split(',') if d.strip()]
        if not difficulties:
            return queryset
        return queryset.filter(difficulty__in=difficulties)

    def filter_by_cooking_time(self, queryset, name, value):
        """
        Lọc theo thời gian nấu — hỗ trợ nhiều ranges (comma-separated).
        TIME_RANGES: 15 (<15), 30 (15-30), 60 (30-60), 120 (>60)
        """
        if not value:
            return queryset
        values = [int(v.strip()) for v in value.split(',') if v.strip().isdigit()]
        if not values:
            return queryset

        q = models.Q()
        for v in values:
            if v == 15:
                q |= models.Q(prep_time__lte=15)
            elif v == 30:
                q |= models.Q(prep_time__gte=15, prep_time__lte=30)
            elif v == 60:
                q |= models.Q(prep_time__gte=30, prep_time__lte=60)
            elif v == 120:
                q |= models.Q(prep_time__gte=60)
        return queryset.filter(q).distinct()

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
