"""
Serializers cho recipes app.
"""
from django.db import transaction
from rest_framework import serializers
from django.db.models import Avg

from apps.accounts.serializers import UserSerializer
from .models import Recipe, RecipeCategory, RecipeIngredient, RecipeStep


class RecipeCategorySerializer(serializers.ModelSerializer):
    """Serializer cho danh mục công thức."""
    is_active = serializers.BooleanField(read_only=True)

    class Meta:
        model = RecipeCategory
        fields = ('id', 'name', 'slug', 'description', 'order', 'is_active')


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
    user_avatar = serializers.SerializerMethodField()
    categories = RecipeCategorySerializer(many=True, read_only=True)
    avg_rating = serializers.SerializerMethodField()
    save_count = serializers.IntegerField(read_only=True, default=0)
    view_count = serializers.IntegerField(read_only=True, default=0)
    thumbnail_url = serializers.SerializerMethodField()
    is_favorited = serializers.BooleanField(read_only=True, default=False)

    def get_user_avatar(self, obj):
        avatar = getattr(obj.user, 'avatar', None)
        if avatar:
            request = self.context.get('request')
            if request and avatar.url:
                return request.build_absolute_uri(avatar.url)
        return None

    def get_thumbnail_url(self, obj):
        url = getattr(obj, 'thumbnail_url', None)
        if not url:
            return None
        # If already absolute URL, return as-is
        if url.startswith('http'):
            return url
        # Build absolute URL from request
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(url)
        return url

    def get_avg_rating(self, obj):
        val = getattr(obj, 'avg_rating', None)
        if val is None or val == 0.0:
            return None
        return round(float(val), 1)

    class Meta:
        model = Recipe
        fields = (
            'id', 'title', 'description', 'difficulty', 'prep_time',
            'thumbnail_url', 'visibility', 'user', 'user_name', 'user_avatar',
            'categories', 'avg_rating', 'save_count', 'view_count',
            'is_favorited', 'is_deleted', 'deleted_at', 'created_at'
        )


class RecipeDetailSerializer(serializers.ModelSerializer):
    """
    Serializer dùng cho detail/retrieve endpoint — trả về đầy đủ thông tin công thức.

    Computed field:
        - avg_rating (SerializerMethodField): Tính trung bình rating từ tất cả reviews
          của công thức, làm tròn 1 chữ số thập phân. Trả về None nếu chưa có review nào.

    Nested serializers (read_only):
        - user (UserSerializer): Thông tin tác giả công thức (public-safe fields).
        - categories (RecipeCategorySerializer, many): Danh sách categories.
        - recipe_ingredients (RecipeIngredientSerializer, many): Danh sách nguyên liệu
          kèm tên và danh mục từ bảng Ingredient.
        - steps (RecipeStepSerializer, many): Danh sách các bước thực hiện theo thứ tự.
    """
    user = UserSerializer(read_only=True)
    categories = RecipeCategorySerializer(many=True, read_only=True)
    recipe_ingredients = RecipeIngredientSerializer(many=True, read_only=True)
    steps = RecipeStepSerializer(many=True, read_only=True)
    avg_rating = serializers.SerializerMethodField()
    is_favorited = serializers.BooleanField(read_only=True, default=False)

    def get_avg_rating(self, obj):
        val = getattr(obj, 'avg_rating', None)
        if val is None or val == 0.0:
            return None
        return round(val, 1)

    class Meta:
        model = Recipe
        fields = (
            'id', 'title', 'description', 'difficulty', 'prep_time',
            'thumbnail_url', 'visibility', 'user', 'categories',
            'recipe_ingredients', 'steps', 'avg_rating',
            'is_favorited', 'ai_moderation_attempted',
            'is_deleted', 'deleted_at',
            'created_at', 'updated_at'
        )


class RecipeCreateSerializer(serializers.ModelSerializer):
    """
    Serializer dùng cho create/update endpoint của công thức.

    Cấu trúc input (nested):
        - categories (list): Danh sách category IDs.
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
        - categories (list): Nested list category IDs.
        - ingredients (list, write_only): Nested list nguyên liệu.
        - steps (list, write_only): Nested list các bước thực hiện.
    """
    categories = serializers.PrimaryKeyRelatedField(
        queryset=RecipeCategory.objects.filter(is_active=True),
        many=True,
        required=False
    )
    ingredients = RecipeIngredientSerializer(many=True, write_only=True, required=False)
    steps = RecipeStepSerializer(many=True, write_only=True, required=False)

    class Meta:
        model = Recipe
        fields = ('title', 'description', 'difficulty', 'prep_time', 'thumbnail_url', 'categories', 'ingredients', 'steps')

    def create(self, validated_data):
        categories_data = validated_data.pop('categories', [])
        ingredients_data = validated_data.pop('ingredients', [])
        steps_data = validated_data.pop('steps', [])
        with transaction.atomic():
            recipe = Recipe.objects.create(**validated_data)
            recipe.categories.set(categories_data)
            for ing in ingredients_data:
                RecipeIngredient.objects.create(recipe=recipe, **ing)
            for step in steps_data:
                RecipeStep.objects.create(recipe=recipe, **step)
        return recipe

    def update(self, instance, validated_data):
        categories_data = validated_data.pop('categories', None)
        ingredients_data = validated_data.pop('ingredients', None)
        steps_data = validated_data.pop('steps', None)

        with transaction.atomic():
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()

            if categories_data is not None:
                instance.categories.set(categories_data)

            if ingredients_data is not None:
                instance.recipe_ingredients.all().delete()
                for ing in ingredients_data:
                    RecipeIngredient.objects.create(recipe=instance, **ing)

            if steps_data is not None:
                instance.steps.all().delete()
                for step in steps_data:
                    RecipeStep.objects.create(recipe=instance, **step)

        return instance
