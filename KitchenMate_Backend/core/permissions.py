"""
Custom DRF Permissions cho KitchenMate.
"""
from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsOwnerOrReadOnly(BasePermission):
    """
    Cho phép đọc (GET, HEAD, OPTIONS) với mọi request.
    Chỉ cho phép ghi (POST, PUT, PATCH, DELETE) nếu request.user là owner của object.

    Object phải có thuộc tính `user` hoặc `owner` trỏ đến User.
    """
    def has_permission(self, request, view):
        # Cho phép đọc không cần auth, ghi thì cần đăng nhập
        if request.method in SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Đọc thì luôn cho phép
        if request.method in SAFE_METHODS:
            return True

        # Ghi thì kiểm tra ownership
        owner = getattr(obj, 'user', None) or getattr(obj, 'owner', None)
        return owner == request.user


class IsOwner(BasePermission):
    """
    Chỉ cho phép truy cập nếu request.user là owner của object.
    Dùng cho các resource hoàn toàn private (Pantry, ShoppingList...).
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        owner = getattr(obj, 'user', None) or getattr(obj, 'owner', None)
        return owner == request.user


class IsAdminUser(BasePermission):
    """
    Chỉ cho phép truy cập nếu user là staff (is_staff=True).
    Dùng cho các Admin API endpoints.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)
