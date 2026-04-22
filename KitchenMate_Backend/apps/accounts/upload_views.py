"""
Upload views cho Accounts — Avatar upload.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status
from django.core.exceptions import ValidationError
from drf_spectacular.utils import extend_schema

from core.utils.media_upload_service import MediaUploadService


class AvatarUploadView(APIView):
    """
    POST /api/accounts/me/avatar/
    Upload ảnh đại diện cho user đang đăng nhập.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    @extend_schema(
        summary="Upload avatar",
        description="Upload ảnh đại diện cho user đang đăng nhập. Chấp nhận jpg, png, webp. Tối đa 5MB.",
        request={
            'multipart/form-data': {
                'type': 'object',
                'properties': {
                    'file': {'type': 'string', 'format': 'binary'}
                },
                'required': ['file']
            }
        },
        responses={
            200: {
                'type': 'object',
                'properties': {
                    'url': {'type': 'string'},
                    'message': {'type': 'string'}
                }
            }
        },
        tags=['Accounts']
    )
    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response(
                {'error': 'Vui lòng chọn file để upload'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            service = MediaUploadService()
            url = service.upload_avatar(request.user, file)
            return Response(
                {'url': url, 'message': 'Cập nhật avatar thành công'},
                status=status.HTTP_200_OK
            )
        except ValidationError as e:
            return Response(
                {'error': e.message if hasattr(e, 'message') else str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception:
            return Response(
                {'error': 'Không thể lưu file. Vui lòng thử lại sau'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
