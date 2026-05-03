"""
Serializers cho social app.
"""
from rest_framework import serializers
from .models import Review, Collection, CollectionRecipe


class ReviewSerializer(serializers.ModelSerializer):
    """
    Serializer cho đánh giá công thức (Review).

    Ràng buộc rating:
        Giá trị nguyên trong khoảng [1–5]. Validation được thực hiện ở model-level
        (MinValueValidator, MaxValueValidator).

    Unique constraint:
        Mỗi user chỉ được đánh giá một công thức đúng một lần — unique(user, recipe).
        Nếu vi phạm, database sẽ raise IntegrityError; lỗi này được bắt và xử lý
        tại view để trả về response 400 phù hợp.

    Read-only fields:
        - id: Tự động sinh.
        - user: Được gán tự động từ request.user tại view (perform_create),
          không nhận từ client.
        - created_at: Thời điểm tạo, tự động gán bởi model.
    """
    user_name = serializers.CharField(source='user.full_name', read_only=True)

    class Meta:
        model = Review
        fields = ('id', 'user', 'user_name', 'recipe', 'rating', 'comment', 'cooksnap_url', 'created_at')
        read_only_fields = ('id', 'user', 'recipe', 'created_at')


class CollectionRecipeSerializer(serializers.ModelSerializer):
    """Serializer cho CollectionRecipe (cong thuc trong bo suu tap)."""

    class Meta:
        model = CollectionRecipe
        fields = ('id', 'recipe', 'added_at')
        read_only_fields = ('id', 'added_at')


class CollectionSerializer(serializers.ModelSerializer):
    """Serializer cho Collection — bao gom nested recipes va recipe_count."""
    collection_recipes = CollectionRecipeSerializer(many=True, read_only=True)
    recipe_count = serializers.IntegerField(source='collection_recipes.count', read_only=True)

    class Meta:
        model = Collection
        fields = ('id', 'name', 'recipe_count', 'collection_recipes', 'created_at')
        read_only_fields = ('id', 'created_at')
