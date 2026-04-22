"""
Serializers cho recipes app.
"""
from django.db import transaction
from rest_framework import serializers
from django.db.models import Avg

from apps.accounts.serializers import UserSerializer
from .models import Recipe, RecipeIngredient, RecipeStep


class RecipeIngredientSerializer(serializers.ModelSerializer):
    """Serializer cho nguyên liệu trong công thức."""
    ingredient_name = serializers.CharField(source='ingredient.name', read_only=True)
    ingredient_category = serializers.CharField(source='ingredient.category', read_only=True)

    class Meta:
        model = RecipeIngredient
        fields = ('id', 'ingredient', 'ingredient_name', 'ingredient_category', 'quantity', 'unit')


class RecipeStepSerializer(serializers.ModelSerializer):
    """Serializer cho các bước thực hiện."""

    class Meta:
        model = RecipeStep
        fields = ('id', 'step_number', 'instruction', 'media_url')


class RecipeListSerializer(serializers.ModelSerializer):
    """Dùng cho list endpoint — ít trường hơn để tối ưu performance."""
    user_name = serializers.CharField(source='user.full_name', read_only=True)

    class Meta:
        model = Recipe
        fields = (
            'id', 'title', 'description', 'difficulty', 'prep_time',
            'thumbnail_url', 'visibility', 'user', 'user_name', 'created_at'
        )


class RecipeDetailSerializer(serializers.ModelSerializer):
    """
    Serializer dùng cho detail/retrieve endpoint — trả về đầy đủ thông tin công thức.

    Computed field:
        - avg_rating (SerializerMethodField): Tính trung bình rating từ tất cả reviews
          của công thức, làm tròn 1 chữ số thập phân. Trả về None nếu chưa có review nào.

    Nested serializers (read_only):
        - user (UserSerializer): Thông tin tác giả công thức (public-safe fields).
        - recipe_ingredients (RecipeIngredientSerializer, many): Danh sách nguyên liệu
          kèm tên và danh mục từ bảng Ingredient.
        - steps (RecipeStepSerializer, many): Danh sách các bước thực hiện theo thứ tự.
    """
    user = UserSerializer(read_only=True)
    recipe_ingredients = RecipeIngredientSerializer(many=True, read_only=True)
    steps = RecipeStepSerializer(many=True, read_only=True)
    avg_rating = serializers.SerializerMethodField()

    def get_avg_rating(self, obj):
        result = obj.reviews.aggregate(avg=Avg('rating'))
        return round(result['avg'], 1) if result['avg'] else None

    class Meta:
        model = Recipe
        fields = (
            'id', 'title', 'description', 'difficulty', 'prep_time',
            'thumbnail_url', 'visibility', 'user', 'recipe_ingredients',
            'steps', 'avg_rating', 'created_at', 'updated_at'
        )


class RecipeCreateSerializer(serializers.ModelSerializer):
    """
    Serializer dùng cho create/update endpoint của công thức.

    Cấu trúc input (nested):
        - ingredients (list, write_only): Danh sách nguyên liệu, mỗi phần tử theo
          cấu trúc RecipeIngredientSerializer (ingredient, quantity, unit).
        - steps (list, write_only): Danh sách các bước thực hiện, mỗi phần tử theo
          cấu trúc RecipeStepSerializer (step_number, instruction, media_url).

    Hành vi create (atomic transaction):
        Toàn bộ quá trình tạo Recipe + RecipeIngredient + RecipeStep được thực hiện
        trong một transaction.atomic(). Nếu bất kỳ bước nào thất bại, toàn bộ
        transaction sẽ bị rollback — đảm bảo tính nhất quán dữ liệu.

    Các trường:
        - title (str): Tên công thức.
        - description (str): Mô tả công thức.
        - difficulty (str): Độ khó (EASY / MEDIUM / HARD).
        - prep_time (int): Thời gian chuẩn bị (phút).
        - thumbnail_url (str): URL ảnh đại diện.
        - ingredients (list, write_only): Nested list nguyên liệu.
        - steps (list, write_only): Nested list các bước thực hiện.
    """
    ingredients = RecipeIngredientSerializer(many=True, write_only=True, required=False)
    steps = RecipeStepSerializer(many=True, write_only=True, required=False)

    class Meta:
        model = Recipe
        fields = ('title', 'description', 'difficulty', 'prep_time', 'thumbnail_url', 'ingredients', 'steps')

    def create(self, validated_data):
        ingredients_data = validated_data.pop('ingredients', [])
        steps_data = validated_data.pop('steps', [])
        with transaction.atomic():
            recipe = Recipe.objects.create(**validated_data)
            for ing in ingredients_data:
                RecipeIngredient.objects.create(recipe=recipe, **ing)
            for step in steps_data:
                RecipeStep.objects.create(recipe=recipe, **step)
        return recipe
