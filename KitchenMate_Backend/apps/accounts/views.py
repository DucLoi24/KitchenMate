"""
Views cho accounts app.
Xử lý đăng ký, đăng nhập, logout, profile, đổi mật khẩu và password reset.
"""
import logging
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.core.mail import send_mail
from django.conf import settings
from django.shortcuts import get_object_or_404

from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError

from .serializers import (
    RegisterSerializer,
    UserSerializer,
    UserProfileUpdateSerializer,
    ChangePasswordSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
)

logger = logging.getLogger(__name__)
User = get_user_model()


class RegisterView(APIView):
    """
    POST /api/auth/register/
    Đăng ký tài khoản mới, trả về JWT tokens ngay sau khi đăng ký.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        # DEBUG: Log incoming data
        logger.info(f"Register request data: {request.data}")
        
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            logger.error(f"Register validation errors: {serializer.errors}")
            return Response(
                {'success': False, 'error': {'details': serializer.errors}},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = serializer.save()
        refresh = RefreshToken.for_user(user)

        return Response({
            'success': True,
            'message': 'Đăng ký thành công.',
            'data': {
                'user': UserSerializer(user).data,
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                }
            }
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """
    POST /api/auth/login/
    Đăng nhập bằng email + password, trả về access + refresh token.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        # DEBUG: Log incoming data
        logger.info(f"Login request data: {request.data}")
        
        email = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '')

        if not email or not password:
            return Response(
                {'success': False, 'error': {'message': 'Email và mật khẩu là bắt buộc.'}},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'success': False, 'error': {'message': 'Email hoặc mật khẩu không đúng.'}},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.check_password(password):
            return Response(
                {'success': False, 'error': {'message': 'Email hoặc mật khẩu không đúng.'}},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_active:
            return Response(
                {'success': False, 'error': {'message': 'Tài khoản đã bị khóa.'}},
                status=status.HTTP_403_FORBIDDEN
            )

        refresh = RefreshToken.for_user(user)

        return Response({
            'success': True,
            'message': 'Đăng nhập thành công.',
            'data': {
                'user': UserSerializer(user).data,
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                }
            }
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """
    POST /api/auth/logout/
    Blacklist refresh token để vô hiệu hóa session.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {'success': False, 'error': {'message': 'Refresh token là bắt buộc.'}},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            return Response(
                {'success': False, 'error': {'message': 'Token không hợp lệ hoặc đã hết hạn.'}},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response({'success': True, 'message': 'Đăng xuất thành công.'}, status=status.HTTP_200_OK)


class MeView(APIView):
    """
    GET  /api/accounts/me/ - Lấy thông tin user hiện tại
    PUT  /api/accounts/me/ - Cập nhật toàn bộ profile
    PATCH /api/accounts/me/ - Cập nhật một phần profile
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response({'success': True, 'data': serializer.data})

    def put(self, request):
        return self._update(request, partial=False)

    def patch(self, request):
        return self._update(request, partial=True)

    def _update(self, request, partial):
        serializer = UserProfileUpdateSerializer(
            request.user, data=request.data, partial=partial
        )
        if not serializer.is_valid():
            return Response(
                {'success': False, 'error': {'details': serializer.errors}},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer.save()
        return Response({
            'success': True,
            'message': 'Cập nhật profile thành công.',
            'data': UserSerializer(request.user).data
        })


class ChangePasswordView(APIView):
    """
    POST /api/accounts/me/change-password/
    Đổi mật khẩu khi đã đăng nhập.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(
                {'success': False, 'error': {'details': serializer.errors}},
                status=status.HTTP_400_BAD_REQUEST
            )

        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()

        return Response({'success': True, 'message': 'Đổi mật khẩu thành công.'})


class UserPublicProfileView(APIView):
    """
    GET /api/accounts/{id}/
    Xem profile công khai của người dùng khác.
    """
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            user = User.objects.get(pk=pk, is_active=True)
        except User.DoesNotExist:
            return Response(
                {'success': False, 'error': {'message': 'Người dùng không tồn tại.'}},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = UserSerializer(user)
        return Response({'success': True, 'data': serializer.data})


class ForgotPasswordView(APIView):
    """
    POST /api/auth/forgot-password/
    Gửi email chứa link reset mật khẩu.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'error': {'details': serializer.errors}},
                status=status.HTTP_400_BAD_REQUEST
            )

        email = serializer.validated_data['email']

        # Luôn trả về thông báo thành công để tránh user enumeration attack
        try:
            user = User.objects.get(email=email, is_active=True)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)

            reset_url = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"

            send_mail(
                subject='[KitchenMate] Đặt lại mật khẩu',
                message=f'Nhấn vào link sau để đặt lại mật khẩu của bạn:\n\n{reset_url}\n\nLink có hiệu lực trong 24 giờ.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=True,
            )
        except User.DoesNotExist:
            # Không làm gì, nhưng vẫn trả về 200 để tránh lộ thông tin
            logger.info(f"Password reset requested for non-existent email: {email}")

        return Response({
            'success': True,
            'message': 'Nếu email tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.'
        })


class ResetPasswordView(APIView):
    """
    POST /api/auth/reset-password/
    Đặt lại mật khẩu bằng uid + token từ email.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'error': {'details': serializer.errors}},
                status=status.HTTP_400_BAD_REQUEST
            )

        uid_b64 = request.data.get('uid', '')
        token = serializer.validated_data['token']

        try:
            uid = force_str(urlsafe_base64_decode(uid_b64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, User.DoesNotExist):
            return Response(
                {'success': False, 'error': {'message': 'Link đặt lại mật khẩu không hợp lệ.'}},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not default_token_generator.check_token(user, token):
            return Response(
                {'success': False, 'error': {'message': 'Link đã hết hạn hoặc không hợp lệ.'}},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(serializer.validated_data['new_password'])
        user.save()

        return Response({'success': True, 'message': 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.'})


class UserRecipesView(APIView):
    """
    GET /api/accounts/{id}/recipes/
    Trả về danh sách công thức PUBLIC của user, có pagination.
    """
    permission_classes = [AllowAny]

    def get(self, request, pk):
        from apps.recipes.models import Recipe
        from apps.recipes.serializers import RecipeListSerializer

        user = get_object_or_404(User, pk=pk, is_active=True)
        recipes = Recipe.objects.filter(
            user=user, visibility='PUBLIC'
        ).select_related('user').prefetch_related(
            'recipe_ingredients__ingredient', 'steps'
        )

        paginator = PageNumberPagination()
        paginator.page_size = 20
        page = paginator.paginate_queryset(recipes, request)
        serializer = RecipeListSerializer(page, many=True)

        return Response({
            'success': True,
            'data': {
                'count': paginator.page.paginator.count,
                'next': paginator.get_next_link(),
                'previous': paginator.get_previous_link(),
                'results': serializer.data,
            }
        })


class UserStatsView(APIView):
    """
    GET /api/accounts/{id}/stats/
    Trả về thống kê hoạt động của user: recipe_count, total_likes, average_rating.
    """
    permission_classes = [AllowAny]

    def get(self, request, pk):
        from django.db.models import Avg
        from apps.recipes.models import Recipe
        from apps.social.models import CollectionRecipe, Review

        user = get_object_or_404(User, pk=pk, is_active=True)

        # Query 1: đếm PUBLIC recipes
        recipe_count = Recipe.objects.filter(user=user, visibility='PUBLIC').count()

        # Query 2: đếm tổng lượt lưu vào Collection (tất cả visibility)
        total_likes = CollectionRecipe.objects.filter(recipe__user=user).count()

        # Query 3: average rating trên tất cả PUBLIC recipes
        avg_result = Review.objects.filter(
            recipe__user=user,
            recipe__visibility='PUBLIC'
        ).aggregate(average_rating=Avg('rating'))
        average_rating = avg_result['average_rating']
        if average_rating is not None:
            average_rating = round(average_rating, 2)

        return Response({
            'success': True,
            'data': {
                'recipe_count': recipe_count,
                'total_likes': total_likes,
                'average_rating': average_rating,
            }
        })
