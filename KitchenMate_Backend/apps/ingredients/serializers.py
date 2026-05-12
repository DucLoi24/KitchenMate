"""
Serializers cho ingredients app.
"""
from rest_framework import serializers
from .models import Ingredient, Unit


class UnitSerializer(serializers.ModelSerializer):
    """Serializer cho Unit (đơn vị đo lường)."""

    class Meta:
        model = Unit
        fields = ('id', 'name', 'slug', 'is_active')
        read_only_fields = ('id',)


class IngredientUnitsSerializer(serializers.Serializer):
    """Serializer để gán units cho ingredient."""
    default_unit_id = serializers.IntegerField(required=False, allow_null=True)
    allowed_unit_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        default=list
    )

    def validate(self, data):
        default_unit_id = data.get('default_unit_id')
        allowed_unit_ids = data.get('allowed_unit_ids', [])

        # Validate all unit IDs are active
        if allowed_unit_ids:
            inactive_units = Unit.objects.filter(id__in=allowed_unit_ids, is_active=False)
            if inactive_units.exists():
                inactive_names = list(inactive_units.values_list('name', flat=True))
                raise serializers.ValidationError({
                    'allowed_unit_ids': f'Các đơn vị không hợp lệ hoặc đã bị vô hiệu hóa: {", ".join(inactive_names)}'
                })

        if default_unit_id is not None:
            # Check default_unit exists and is active
            try:
                unit = Unit.objects.get(id=default_unit_id)
                if not unit.is_active:
                    raise serializers.ValidationError({
                        'default_unit_id': f'Đơn vị "{unit.name}" đã bị vô hiệu hóa và không thể sử dụng.'
                    })
            except Unit.DoesNotExist:
                raise serializers.ValidationError({
                    'default_unit_id': f'Đơn vị với ID {default_unit_id} không tồn tại.'
                })

            # Also validate default is in allowed (if allowed is not empty)
            if allowed_unit_ids and default_unit_id not in allowed_unit_ids:
                raise serializers.ValidationError({
                    'default_unit_id': 'Đơn vị mặc định phải nằm trong danh sách đơn vị được phép.'
                })
        return data


class IngredientSerializer(serializers.ModelSerializer):
    """Serializer cho Ingredient — dùng cho list, create và search."""
    default_unit = UnitSerializer(read_only=True)
    allowed_units = UnitSerializer(many=True, read_only=True)

    class Meta:
        model = Ingredient
        fields = ('id', 'name', 'category', 'status', 'created_by', 'created_at',
                  'default_unit', 'allowed_units')
        read_only_fields = ('id', 'status', 'created_by', 'created_at')

    def validate_name(self, value):
        """Kiểm tra tên nguyên liệu đã tồn tại (case-insensitive)."""
        # Khi update, bỏ qua instance hiện tại
        instance = self.instance
        qs = Ingredient.objects.filter(name__iexact=value)
        if instance:
            qs = qs.exclude(pk=instance.pk)
        if qs.exists():
            raise serializers.ValidationError('Nguyên liệu này đã tồn tại trong hệ thống.')
        return value


class AdminIngredientSerializer(IngredientSerializer):
    """Serializer cho admin create/update Ingredient, hỗ trợ gán đơn vị."""
    default_unit_id = serializers.PrimaryKeyRelatedField(
        source='default_unit',
        queryset=Unit.objects.filter(is_active=True),
        required=False,
        allow_null=True,
        write_only=True,
        error_messages={
            'does_not_exist': 'Đơn vị với ID {pk_value} không tồn tại hoặc đã bị vô hiệu hóa.',
            'incorrect_type': 'ID đơn vị không hợp lệ.',
        },
    )
    allowed_unit_ids = serializers.PrimaryKeyRelatedField(
        source='allowed_units',
        queryset=Unit.objects.filter(is_active=True),
        many=True,
        required=False,
        write_only=True,
        error_messages={
            'does_not_exist': 'Đơn vị với ID {pk_value} không tồn tại hoặc đã bị vô hiệu hóa.',
            'incorrect_type': 'ID đơn vị không hợp lệ.',
        },
    )

    class Meta(IngredientSerializer.Meta):
        fields = IngredientSerializer.Meta.fields + ('default_unit_id', 'allowed_unit_ids')

    def validate(self, attrs):
        """Đảm bảo đơn vị mặc định nằm trong danh sách được phép khi danh sách được gửi lên."""
        attrs = super().validate(attrs)
        default_unit = attrs.get('default_unit')
        allowed_units = attrs.get('allowed_units')
        if default_unit is not None and allowed_units and default_unit not in allowed_units:
            raise serializers.ValidationError({
                'default_unit_id': 'Đơn vị mặc định phải nằm trong danh sách đơn vị được phép.'
            })
        return attrs
