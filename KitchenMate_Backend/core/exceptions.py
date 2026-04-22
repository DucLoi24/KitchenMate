"""
Custom exception handler cho DRF
Đảm bảo tất cả lỗi đều trả về JSON format nhất quán
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response


def custom_exception_handler(exc, context):
    """
    Custom exception handler để format lỗi nhất quán
    """
    # Gọi DRF's default exception handler trước
    response = exception_handler(exc, context)

    if response is not None:
        # Format lại response để nhất quán
        custom_response_data = {
            'success': False,
            'error': {
                'message': str(exc),
                'details': response.data
            }
        }
        response.data = custom_response_data

    return response
