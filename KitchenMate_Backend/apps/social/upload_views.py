"""
Upload views cho Social — Cooksnap upload.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema

from apps.social.models import Review
from core.utils.media_upload_service import MediaUploadService


class CooksnapUploadView(APIView):
    """
    POST /api/social/reviews/{review_id}/cooksnap/
    Upload ảnh cooksnap cho review. Chỉ owner review mới được upload.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    @extend_schema(
        summary="Upload cooksnap",
        description="Upload ảnh món ăn thực tế vào review. Chỉ owner review mới được phép. Tối đa 5MB.",
        request={
            'multipart/form-data': {
                'type': 'object',
                'properties': {
                    'file': {'type': 'string', 'format': 'binary'}
                },
                'required': ['file']
            }
        },
        responses={200: {'type': 'object', 'properties': {'url': {'type': 'string'}, 'message': {'type': 'string'}}}},
        tags=['Social']
    )
    def post(self, request, review_id):
        review = get_object_or_404(Review, id=review_id)

        # Kiểm tra ownership
        if review.user != request.user:
            return Response(
                {'error': 'Bạn không có quyền chỉnh sửa review này'},
                status=status.HTTP_403_FORBIDDEN
            )

        file = request.FILES.get('file')
        if not file:
            return Response(
                {'error': 'Vui lòng chọn file để upload'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            service = MediaUploadService()
            url = service.upload_cooksnap(review, file)
            return Response(
                {'url': url, 'message': 'Cập nhật cooksnap thành công'},
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
