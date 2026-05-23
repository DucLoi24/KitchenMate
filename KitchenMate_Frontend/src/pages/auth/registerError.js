const registerFieldLabels = {
  email: 'Email',
  full_name: 'Họ và tên',
  password: 'Mật khẩu',
  password_confirm: 'Xác nhận mật khẩu',
  non_field_errors: 'Lỗi',
}

function normalizeErrorMessage(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeErrorMessage).filter(Boolean).join(' ')
  }
  if (value && typeof value === 'object') {
    return Object.values(value).map(normalizeErrorMessage).filter(Boolean).join(' ')
  }
  if (typeof value === 'string') {
    return value
  }
  return ''
}

export function formatRegisterError(err) {
  const data = err?.response?.data
  const details = data?.error?.details || data?.details

  if (details && typeof details === 'object') {
    const messages = Object.entries(details)
      .map(([field, value]) => {
        const message = normalizeErrorMessage(value)
        if (!message) return null
        const label = registerFieldLabels[field] || field
        return `${label}: ${message}`
      })
      .filter(Boolean)

    if (messages.length > 0) {
      return messages.join('\n')
    }
  }

  const candidates = [
    data?.error?.message,
    data?.message,
    data?.error,
    data?.email,
    data?.password,
    err?.message,
  ]
  const message = candidates.map(normalizeErrorMessage).find(Boolean)
  return message || 'Đăng ký thất bại. Vui lòng thử lại.'
}
