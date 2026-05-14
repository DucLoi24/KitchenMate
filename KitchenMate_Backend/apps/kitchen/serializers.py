"""
Serializers cho kitchen app.
"""
from apps.ingredients.models import Unit
from rest_framework import serializers
from .models import Pantry, ShoppingList


class UnitDisplayMixin:
    @property
    def unit_display_map(self):
        if not hasattr(self, '_unit_display_map'):
            self._unit_display_map = {
                slug: name
                for slug, name in Unit.objects.values_list('slug', 'name')
            }
        return self._unit_display_map

    def resolve_unit_display(self, unit):
        if not unit:
            return unit
        return self.unit_display_map.get(unit, unit)


class PantrySerializer(UnitDisplayMixin, serializers.ModelSerializer):
    """
    Serializer cho Pantry item — nguyên liệu đang có trong tủ lạnh số của user.

    Output với nested ingredient info (read_only, lấy từ FK ingredient):
        - ingredient_name: Tên nguyên liệu (ingredient.name).
        - ingredient_category: Danh mục nguyên liệu (ingredient.category),
          ví dụ: PROTEIN, CARB, VEG, SPICE, OTHER, STAPLE.

    Các trường:
        - id (int, read_only): ID của pantry item.
        - ingredient (FK): ID nguyên liệu (write khi tạo/cập nhật).
        - ingredient_name (str, read_only): Tên nguyên liệu.
        - ingredient_category (str, read_only): Danh mục nguyên liệu.
        - quantity (float): Số lượng hiện có.
        - unit (str): Đơn vị đo lường (gram, ml, cái,...).
        - unit_display (str): Tên hiển thị của đơn vị.
        - updated_at (datetime, read_only): Thời điểm cập nhật gần nhất.
    """
    ingredient_name = serializers.CharField(source='ingredient.name', read_only=True)
    ingredient_category = serializers.CharField(source='ingredient.category', read_only=True)
    unit_display = serializers.SerializerMethodField()

    def get_unit_display(self, obj):
        return self.resolve_unit_display(obj.unit)

    class Meta:
        model = Pantry
        fields = ('id', 'ingredient', 'ingredient_name', 'ingredient_category', 'quantity', 'unit', 'unit_display', 'updated_at')
        read_only_fields = ('id', 'updated_at')


class ShoppingListSerializer(UnitDisplayMixin, serializers.ModelSerializer):
    """Serializer cho ShoppingList item."""
    ingredient_name = serializers.CharField(source='ingredient.name', read_only=True)
    unit_display = serializers.SerializerMethodField()

    def get_unit_display(self, obj):
        return self.resolve_unit_display(obj.unit)

    class Meta:
        model = ShoppingList
        fields = ('id', 'ingredient', 'ingredient_name', 'quantity', 'unit', 'unit_display', 'is_purchased', 'created_at')
        read_only_fields = ('id', 'is_purchased', 'created_at')
