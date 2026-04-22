"""
Serializers cho ingredients app.
"""
from rest_framework import serializers
from .models import Ingredient


class IngredientSerializer(serializers.ModelSerializer):
    """Serializer cho Ingredient — dùng cho list, create và search."""

    class Meta:
        model = Ingredient
        fields = ('id', 'name', 'category', 'status', 'created_by', 'created_at')
        read_only_fields = ('id', 'status', 'created_by', 'created_at')

    def validate_name(self, value):
        """Kiểm tra tên nguyên liệu đã tồn tại (case-insensitive)."""
        # Khi update, bỏ qua instance hiện tại
        instance = self.instance
        qs = Ingredient.objects.filter(name__iexact=value)
        if instance:
            qs = qs.exclude(pk=instance.pk)
        if qs.exists():
            raise serializers.ValidationError('Nguyên liệu này đã tồn tại trong hệ thống.')
        return value
