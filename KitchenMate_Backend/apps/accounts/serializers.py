"""
Serializers cho accounts app.
Xử lý đăng ký, đăng nhập, profile và password reset.
"""
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer đăng ký tài khoản mới.

    Các trường bắt buộc:
        - email (str): Địa chỉ email, dùng làm username đăng nhập.
        - full_name (str): Họ và tên đầy đủ.
        - password (str, write_only): Mật khẩu.
        - password_confirm (str, write_only): Xác nhận mật khẩu.

    Password validation (Django's validate_password):
        - Độ dài tối thiểu (mặc định 8 ký tự).
        - Không được quá phổ biến (kiểm tra danh sách common passwords).
        - Không được toàn số (numeric-only).

    Validation:
        password phải khớp với password_confirm; nếu không khớp sẽ raise
        ValidationError với key 'password'.

    Hành vi create:
        - Tự động set username = email để tránh lỗi AbstractUser yêu cầu username.
        - Dùng create_user() để hash password đúng chuẩn Django (không lưu plain text).
    """
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('email', 'full_name', 'password', 'password_confirm')

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password': 'Mật khẩu xác nhận không khớp.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        # Tự động set username = email để tránh lỗi AbstractUser
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            full_name=validated_data['full_name'],
            password=validated_data['password'],
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    """Serializer trả về thông tin user (public-safe)."""

    class Meta:
        model = User
        fields = ('id', 'email', 'full_name', 'avatar_url', 'bio', 'created_at',
                  'is_staff', 'is_active')
        read_only_fields = ('id', 'email', 'created_at', 'is_staff')


class FollowUserSerializer(serializers.ModelSerializer):
    """Serializer cho user card trong danh sách followers/following."""
    followers_count = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'full_name', 'avatar_url', 'bio', 'followers_count', 'is_following')

    def get_followers_count(self, obj):
        if hasattr(obj, 'followers_count'):
            return obj.followers_count
        return obj.follower_relations.count()

    def get_is_following(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        if request.user.pk == obj.pk:
            return False
        return obj.follower_relations.filter(follower=request.user).exists()


class UserSearchSerializer(FollowUserSerializer):
    """Serializer public-safe cho kết quả tìm kiếm người dùng."""

    class Meta:
        model = User
        fields = ('id', 'full_name', 'avatar_url', 'bio', 'followers_count', 'is_following')

class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer cập nhật profile (chỉ cho phép sửa một số trường)."""

    class Meta:
        model = User
        fields = ('full_name', 'avatar_url', 'bio')


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer đổi mật khẩu khi đã đăng nhập."""
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({'new_password': 'Mật khẩu xác nhận không khớp.'})
        return attrs

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Mật khẩu cũ không đúng.')
        return value


class ForgotPasswordSerializer(serializers.Serializer):
    """Serializer yêu cầu reset mật khẩu qua email."""
    email = serializers.EmailField()

    def validate_email(self, value):
        # Không tiết lộ email có tồn tại hay không (security best practice)
        return value


class ResetPasswordSerializer(serializers.Serializer):
    """Serializer đặt lại mật khẩu bằng token."""
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({'new_password': 'Mật khẩu xác nhận không khớp.'})
        return attrs
