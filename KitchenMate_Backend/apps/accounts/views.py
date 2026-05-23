"""
Views cho accounts app.
Xử lý đăng ký, đăng nhập, logout, profile, đổi mật khẩu và password reset.
"""
import logging
import secrets
import uuid
import requests
from urllib.parse import urlencode
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Count, Subquery
from django.http import JsonResponse, HttpResponse
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.clickjacking import xframe_options_exempt
from django.shortcuts import get_object_or_404, redirect

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

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
    FollowUserSerializer,
    UserSearchSerializer,
    ChangePasswordSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
)
from .models import UserFollow

logger = logging.getLogger(__name__)
User = get_user_model()


def _is_following(request, user):
    if not request.user.is_authenticated:
        return False
    if request.user.pk == user.pk:
        return False
    return UserFollow.objects.filter(follower=request.user, following=user).exists()


class GoogleOAuthView(APIView):
    """
    GET /api/auth/google/ → redirect to Google consent page
    POST /api/auth/google/ → exchange code for JWT token
    """
    permission_classes = [AllowAny]
    throttle_scope = 'oauth'

    def get(self, request):
        """Initiate OAuth flow - redirect to Google consent page."""
        state = secrets.token_hex(16)
        request.session['oauth_state'] = state

        params = urlencode({
            'client_id': settings.GOOGLE_CLIENT_ID,
            'redirect_uri': settings.GOOGLE_REDIRECT_URI,
            'response_type': 'code',
            'scope': 'email profile',
            'state': state,
            'access_type': 'offline',
            'prompt': 'select_account',
        })
        return redirect(f'https://accounts.google.com/o/oauth2/auth?{params}')

    def post(self, request):
        code = request.data.get('code')
        redirect_uri = request.data.get('redirect_uri', settings.GOOGLE_REDIRECT_URI)

        # Validate code presence
        if not code:
            return Response(
                {'success': False, 'error': {'message': 'Thiếu mã xác thực Google'}},
                status=status.HTTP_400_BAD_REQUEST
            )

        return self._handle_oauth_callback(code, redirect_uri)

    def _handle_oauth_callback(self, code, redirect_uri):
        # Exchange code for tokens
        try:
            tokens = self._exchange_code_for_tokens(code, redirect_uri)
        except ValueError as e:
            return Response(
                {'success': False, 'error': {'message': 'Không thể trao đổi mã với Google'}},
                status=status.HTTP_400_BAD_REQUEST
            )

        id_token_str = tokens.get('id_token')
        if not id_token_str:
            return Response(
                {'success': False, 'error': {'message': 'Google không trả về id_token'}},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verify id_token and extract user info
        try:
            user_info = id_token.verify_oauth2_token(
                id_token_str,
                google_requests.Request(),
                audience=settings.GOOGLE_CLIENT_ID,
                clock_skew_in_seconds=5,
            )
        except ValueError as e:
            logger.warning("Google id_token verification failed (POST): %s | id_token: %s", str(e), id_token_str[:50] if id_token_str else 'None')
            return Response(
                {'success': False, 'error': {'message': 'Token không hợp lệ'}},
                status=status.HTTP_400_BAD_REQUEST
            )

        google_sub = user_info['sub']
        email = user_info['email'].lower()
        name = user_info.get('name', '')
        picture = user_info.get('picture', '')

        # Check if user is blocked
        if User.objects.filter(google_user_id=google_sub, is_active=False).exists():
            return Response(
                {'success': False, 'error': {'message': 'Tài khoản đã bị khóa'}},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get or create user
        user, is_new = self._get_or_create_google_user(email, name, google_sub, picture)

        # Check if user is blocked after creation
        if not user.is_active:
            return Response(
                {'success': False, 'error': {'message': 'Tài khoản đã bị khóa'}},
                status=status.HTTP_403_FORBIDDEN
            )

        # Generate JWT
        refresh = RefreshToken.for_user(user)

        return Response({
            'success': True,
            'is_new_user': is_new,
            'data': {
                'user': UserSerializer(user).data,
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                }
            }
        })

    def _exchange_code_for_tokens(self, code, redirect_uri):
        """Exchange authorization code for tokens from Google."""
        response = requests.post(
            'https://oauth2.googleapis.com/token',
            json={
                'code': code,
                'client_id': settings.GOOGLE_CLIENT_ID,
                'client_secret': settings.GOOGLE_CLIENT_SECRET,
                'redirect_uri': redirect_uri,
                'grant_type': 'authorization_code',
            }
        )
        if not response.ok:
            raise ValueError(f"Token exchange failed: {response.text}")
        return response.json()

    def _get_or_create_google_user(self, email, name, google_sub, picture):
        """Get existing user by google_user_id or create new Google user.

        SECURITY: Never link Google login to existing account (including admin).
        If email exists, create new user with modified email instead.
        """
        # Try to find by google_user_id first
        try:
            user = User.objects.get(google_user_id=google_sub)
            return user, False
        except User.DoesNotExist:
            pass

        # Never link Google to existing account - security risk
        # If email exists (including admin accounts), create with modified email
        if User.objects.filter(email=email).exists():
            # Extract domain, create unique email for Google user
            parts = email.split('@')
            modified_email = f"{parts[0]}+google_{google_sub[:16]}@{parts[1]}"
            # In case modified email also exists, use UUID suffix
            counter = 1
            final_email = modified_email
            while User.objects.filter(email=final_email).exists():
                final_email = f"{parts[0]}+google_{google_sub[:16]}_{counter}@{parts[1]}"
                counter += 1

            user = User.objects.create(
                username=final_email,
                email=final_email,
                full_name=name,
                avatar_url=picture or '',
                google_user_id=google_sub,
                is_google_user=True,
            )
            return user, True

        # Create new user
        user = User.objects.create(
            username=email,
            email=email,
            full_name=name,
            avatar_url=picture or '',
            google_user_id=google_sub,
            is_google_user=True,
        )
        return user, True


@method_decorator(xframe_options_exempt, name='dispatch')
class GoogleOAuthCallbackView(View):
    """
    GET /api/auth/google/callback/ — handles Google redirect after user consent.
    Exchanges code for tokens, creates/links user, returns JWT to frontend popup.
    """
    def get(self, request):
        from rest_framework_simplejwt.tokens import RefreshToken

        code = request.GET.get('code')
        state = request.GET.get('state')
        error = request.GET.get('error')

        # Handle user cancellation or error
        if error:
            return JsonResponse({
                'success': False,
                'error': {'message': f'Google OAuth error: {error}'}
            }, status=400)

        if not code:
            return JsonResponse({
                'success': False,
                'error': {'message': 'Thiếu mã xác thực Google'}
            }, status=400)

        # Verify state to prevent CSRF
        saved_state = request.session.get('oauth_state')
        if saved_state and state != saved_state:
            return JsonResponse({
                'success': False,
                'error': {'message': 'OAuth state mismatch - possible CSRF'}
            }, status=400)

        # Exchange code for tokens
        try:
            tokens = self._exchange_code_for_tokens(code, settings.GOOGLE_REDIRECT_URI)
        except ValueError:
            return JsonResponse({
                'success': False,
                'error': {'message': 'Không thể trao đổi mã với Google'}
            }, status=400)

        id_token_str = tokens.get('id_token')
        if not id_token_str:
            return JsonResponse({
                'success': False,
                'error': {'message': 'Google không trả về id_token'}
            }, status=400)

        # Verify id_token
        try:
            user_info = id_token.verify_oauth2_token(
                id_token_str,
                google_requests.Request(),
                audience=settings.GOOGLE_CLIENT_ID,
                clock_skew_in_seconds=5,
            )
        except ValueError as e:
            logger.warning("Google id_token verification failed: %s | id_token: %s", str(e), id_token_str[:50])
            return JsonResponse({
                'success': False,
                'error': {'message': 'Token không hợp lệ'}
            }, status=400)

        google_sub = user_info['sub']
        email = user_info['email'].lower()
        name = user_info.get('name', '')
        picture = user_info.get('picture', '')

        # Check if user is blocked
        if User.objects.filter(google_user_id=google_sub, is_active=False).exists():
            return JsonResponse({
                'success': False,
                'error': {'message': 'Tài khoản đã bị khóa'}
            }, status=403)

        # Get or create user
        user, is_new = self._get_or_create_google_user(email, name, google_sub, picture)

        if not user.is_active:
            return JsonResponse({
                'success': False,
                'error': {'message': 'Tài khoản đã bị khóa'}
            }, status=403)

        # Generate JWT
        refresh = RefreshToken.for_user(user)

        # Build frontend callback URL - frontend handles postMessage to parent
        # This avoids window.opener issues when redirecting from Google in same popup
        from django.conf import settings as django_settings
        frontend_callback = getattr(django_settings, 'FRONTEND_URL', 'http://localhost:5174')

        # Encode user data as JSON for safe URL transmission
        import json
        from urllib.parse import quote
        access_token = str(refresh.access_token)
        refresh_token_str = str(refresh)
        user_data = json.dumps({
            'id': str(user.id),
            'email': email,
            'full_name': name,
            'avatar_url': picture or ''
        })
        # URL-encode the user data for safe transmission
        encoded_user_data = quote(user_data, safe='')

        # Redirect to frontend OAuth callback page with tokens
        # URL-encode all params to prevent URL parsing issues
        from urllib.parse import quote
        redirect_url = (
            f"{frontend_callback}/auth/google/callback"
            f"?access={quote(access_token, safe='')}"
            f"&refresh={quote(refresh_token_str, safe='')}"
            f"&user={encoded_user_data}"
        )

        return redirect(redirect_url)

    def _exchange_code_for_tokens(self, code, redirect_uri):
        response = requests.post(
            'https://oauth2.googleapis.com/token',
            json={
                'code': code,
                'client_id': settings.GOOGLE_CLIENT_ID,
                'client_secret': settings.GOOGLE_CLIENT_SECRET,
                'redirect_uri': redirect_uri,
                'grant_type': 'authorization_code',
            }
        )
        if not response.ok:
            logger.warning("Google token exchange failed: status=%s body=%s", response.status_code, response.text[:300])
            raise ValueError(f"Token exchange failed: {response.text}")
        tokens = response.json()
        logger.info("Token exchange success: keys=%s", list(tokens.keys()))
        return tokens

    def _get_or_create_google_user(self, email, name, google_sub, picture):
        try:
            user = User.objects.get(google_user_id=google_sub)
            return user, False
        except User.DoesNotExist:
            pass

        try:
            user = User.objects.get(email=email)
            user.google_user_id = google_sub
            user.is_google_user = True
            if not user.avatar_url and picture:
                user.avatar_url = picture
            user.save()
            return user, False
        except User.DoesNotExist:
            pass

        user = User.objects.create(
            username=email,
            email=email,
            full_name=name,
            avatar_url=picture or '',
            google_user_id=google_sub,
            is_google_user=True,
        )
        return user, True


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


class FollowUserView(APIView):
    """
    POST /api/accounts/{id}/follow/ - Theo dõi người dùng.
    DELETE /api/accounts/{id}/follow/ - Hủy theo dõi người dùng.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        user = get_object_or_404(User, pk=pk, is_active=True)
        if request.user.pk == user.pk:
            return Response(
                {'success': False, 'error': {'message': 'Bạn không thể theo dõi chính mình.'}},
                status=status.HTTP_400_BAD_REQUEST
            )

        _, created = UserFollow.objects.get_or_create(
            follower=request.user,
            following=user,
        )
        return Response(
            {
                'success': True,
                'message': 'Đã theo dõi người dùng.' if created else 'Bạn đã theo dõi người dùng này.',
                'data': {'is_following': True},
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )

    def delete(self, request, pk):
        user = get_object_or_404(User, pk=pk, is_active=True)
        UserFollow.objects.filter(follower=request.user, following=user).delete()
        return Response({
            'success': True,
            'message': 'Đã hủy theo dõi người dùng.',
            'data': {'is_following': False},
        })


class UserFollowersView(APIView):
    """
    GET /api/accounts/{id}/followers/
    Trả về danh sách người đang theo dõi user, public và có pagination.
    """
    permission_classes = [AllowAny]

    def get(self, request, pk):
        user = get_object_or_404(User, pk=pk, is_active=True)
        followers = User.objects.filter(
            following_relations__following=user,
            is_active=True,
        ).annotate(
            followers_count=Count('follower_relations', distinct=True)
        ).order_by('full_name', 'id')

        paginator = PageNumberPagination()
        paginator.page_size = 20
        page = paginator.paginate_queryset(followers, request)
        serializer = FollowUserSerializer(page, many=True, context={'request': request})

        return Response({
            'success': True,
            'data': {
                'count': paginator.page.paginator.count,
                'next': paginator.get_next_link(),
                'previous': paginator.get_previous_link(),
                'results': serializer.data,
            }
        })


class UserFollowingView(APIView):
    """
    GET /api/accounts/{id}/following/
    Trả về danh sách người user đang theo dõi, public và có pagination.
    """
    permission_classes = [AllowAny]

    def get(self, request, pk):
        user = get_object_or_404(User, pk=pk, is_active=True)
        following_ids = UserFollow.objects.filter(follower=user).values('following_id')
        following = User.objects.filter(
            id__in=Subquery(following_ids),
            is_active=True,
        ).annotate(
            followers_count=Count('follower_relations', distinct=True)
        ).order_by('full_name', 'id')

        paginator = PageNumberPagination()
        paginator.page_size = 20
        page = paginator.paginate_queryset(following, request)
        serializer = FollowUserSerializer(page, many=True, context={'request': request})

        return Response({
            'success': True,
            'data': {
                'count': paginator.page.paginator.count,
                'next': paginator.get_next_link(),
                'previous': paginator.get_previous_link(),
                'results': serializer.data,
            }
        })


class UserSearchView(APIView):
    """
    GET /api/accounts/search/
    Tìm kiếm người dùng active theo full_name hoặc UUID với cú pháp @uuid.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        users = User.objects.none()

        if query:
            normalized_query = query[1:].strip() if query.startswith('@') else query
            try:
                user_id = uuid.UUID(normalized_query)
            except (ValueError, AttributeError):
                if not query.startswith('@'):
                    users = User.objects.filter(
                        is_active=True,
                        full_name__icontains=query,
                    )
            else:
                users = User.objects.filter(id=user_id, is_active=True)

        users = users.annotate(
            followers_count=Count('follower_relations', distinct=True)
        ).order_by('full_name', 'id')

        paginator = PageNumberPagination()
        paginator.page_size = 20
        paginator.page_size_query_param = 'page_size'
        paginator.max_page_size = 50
        page = paginator.paginate_queryset(users, request)
        serializer = UserSearchSerializer(page, many=True, context={'request': request})

        return Response({
            'success': True,
            'data': {
                'count': paginator.page.paginator.count,
                'next': paginator.get_next_link(),
                'previous': paginator.get_previous_link(),
                'results': serializer.data,
            }
        })


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
        from django.db.models import Avg
        from apps.recipes.models import Recipe
        from apps.recipes.serializers import RecipeListSerializer

        user = get_object_or_404(User, pk=pk, is_active=True)
        recipes = Recipe.objects.filter(
            user=user, visibility='PUBLIC'
        ).select_related('user').prefetch_related(
            'recipe_ingredients__ingredient', 'steps'
        ).annotate(
            avg_rating=Avg('reviews__rating')
        ).order_by('-created_at')

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

        followers_count = UserFollow.objects.filter(following=user).count()
        following_count = UserFollow.objects.filter(follower=user).count()

        return Response({
            'success': True,
            'data': {
                'recipe_count': recipe_count,
                'total_likes': total_likes,
                'average_rating': average_rating,
                'followers_count': followers_count,
                'following_count': following_count,
                'is_following': _is_following(request, user),
            }
        })
