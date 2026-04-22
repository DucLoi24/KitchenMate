"""
Serializers cho kitchen app.
"""
from rest_framework import serializers
from .models import Pantry, ShoppingList


class PantrySerializer(serializers.ModelSerializer):
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
        - updated_at (datetime, read_only): Thời điểm cập nhật gần nhất.
    """
    ingredient_name = serializers.CharField(source='ingredient.name', read_only=True)
    ingredient_category = serializers.CharField(source='ingredient.category', read_only=True)

    class Meta:
        model = Pantry
        fields = ('id', 'ingredient', 'ingredient_name', 'ingredient_category', 'quantity', 'unit', 'updated_at')
        read_only_fields = ('id', 'updated_at')


class ShoppingListSerializer(serializers.ModelSerializer):
    """Serializer cho ShoppingList item."""
    ingredient_name = serializers.CharField(source='ingredient.name', read_only=True)

    class Meta:
        model = ShoppingList
        fields = ('id', 'ingredient', 'ingredient_name', 'quantity', 'unit', 'is_purchased', 'created_at')
        read_only_fields = ('id', 'is_purchased', 'created_at')
