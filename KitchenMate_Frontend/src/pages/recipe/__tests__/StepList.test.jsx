import { fireEvent, render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { StepList } from '../StepList'

function renderStepList(props = {}) {
  const onChange = vi.fn()
  const onPendingMediaChange = vi.fn()
  const data = {
    steps: [],
    ...(props.data || {}),
  }

  render(
    <StepList
      data={data}
      onChange={onChange}
      pendingMedia={props.pendingMedia || {}}
      onPendingMediaChange={onPendingMediaChange}
      errors={props.errors || {}}
    />
  )

  return { onChange, onPendingMediaChange }
}

describe('StepList', () => {
  beforeEach(() => {
    globalThis.URL.createObjectURL = vi.fn((file) => `blob:${file.name}`)
    globalThis.URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('adds multiple image or video files to a new step without storing files in recipe data', () => {
    const { onChange, onPendingMediaChange } = renderStepList()
    const image = new File(['image'], 'buoc-1.jpg', { type: 'image/jpeg' })
    const video = new File(['video'], 'buoc-1.mp4', { type: 'video/mp4' })

    fireEvent.change(screen.getByPlaceholderText('Nhập mô tả bước mới...'), {
      target: { value: 'Ướp thịt trong 20 phút' },
    })
    fireEvent.change(screen.getByLabelText('Media cho bước mới'), {
      target: { files: [image, video] },
    })
    fireEvent.click(screen.getByRole('button', { name: /Thêm bước/i }))

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        steps: [
          expect.not.objectContaining({
            media_files: expect.anything(),
          }),
        ],
      })
    )
    expect(onPendingMediaChange).toHaveBeenCalledWith(
      expect.stringMatching(/^temp-step-/),
      [image, video]
    )
  })

  it('renders a larger scrollable instruction textarea for existing steps', () => {
    renderStepList({
      data: {
        steps: [
          {
            id: 'step-1',
            step_number: 1,
            instruction: 'Mô tả bước nấu ăn khá dài',
            media_url: null,
          },
        ],
      },
    })

    const textarea = screen.getByPlaceholderText('Mô tả bước 1...')
    expect(textarea).toHaveAttribute('rows', '5')
    expect(textarea.className).toContain('min-h-[10rem]')
    expect(textarea.className).toContain('overflow-y-auto')
  })

  it('appends files when the same picker is used more than once and previews selected images', async () => {
    const firstImage = new File(['first'], 'anh-1.jpg', { type: 'image/jpeg' })
    const secondImage = new File(['second'], 'anh-2.jpg', { type: 'image/jpeg' })

    const { onPendingMediaChange } = renderStepList({
      data: {
        steps: [
          {
            id: 'step-1',
            step_number: 1,
            instruction: 'Chiên trứng',
            media_url: null,
          },
        ],
      },
      pendingMedia: {
        'step-1': [firstImage],
      },
    })

    expect(globalThis.URL.createObjectURL).toHaveBeenCalledWith(firstImage)
    expect(await screen.findByAltText('Preview anh-1.jpg')).toHaveAttribute('src', 'blob:anh-1.jpg')

    fireEvent.change(screen.getByLabelText('Media cho bước 1'), {
      target: { files: [secondImage] },
    })

    expect(onPendingMediaChange).toHaveBeenCalledWith('step-1', [firstImage, secondImage])
  })

  it('does not point the image preview at a revoked blob URL in StrictMode', async () => {
    const image = new File(['first'], 'anh-strict.jpg', { type: 'image/jpeg' })
    const revokedUrls = []
    let nextUrlIndex = 0
    globalThis.URL.createObjectURL = vi.fn(() => {
      nextUrlIndex += 1
      return `blob:strict-${nextUrlIndex}`
    })
    globalThis.URL.revokeObjectURL = vi.fn((url) => {
      revokedUrls.push(url)
    })

    render(
      <StrictMode>
        <StepList
          data={{
            steps: [
              {
                id: 'step-1',
                step_number: 1,
                instruction: 'Chiên trứng',
                media_url: null,
              },
            ],
          }}
          onChange={vi.fn()}
          pendingMedia={{ 'step-1': [image] }}
          onPendingMediaChange={vi.fn()}
          errors={{}}
        />
      </StrictMode>
    )

    const preview = await screen.findByAltText('Preview anh-strict.jpg')

    expect(revokedUrls).not.toContain(preview.getAttribute('src'))
  })
})
