import { describe, expect, it } from 'vitest'
import { formatRegisterError } from './registerError'

describe('formatRegisterError', () => {
  it('formats backend field validation details with Vietnamese field labels', () => {
    const error = {
      response: {
        data: {
          success: false,
          error: {
            details: {
              email: ['Nhập một địa chỉ email hợp lệ.'],
              password: ['Mật khẩu này quá ngắn.'],
            },
          },
        },
      },
    }

    expect(formatRegisterError(error)).toBe(
      'Email: Nhập một địa chỉ email hợp lệ.\nMật khẩu: Mật khẩu này quá ngắn.'
    )
  })

  it('uses backend message when details are not present', () => {
    const error = {
      response: {
        data: {
          success: false,
          error: {
            message: 'Email hoặc mật khẩu không hợp lệ.',
          },
        },
      },
    }

    expect(formatRegisterError(error)).toBe('Email hoặc mật khẩu không hợp lệ.')
  })

  it('falls back to a Vietnamese generic message when no server message exists', () => {
    expect(formatRegisterError({})).toBe('Đăng ký thất bại. Vui lòng thử lại.')
  })
})
