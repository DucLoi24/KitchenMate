import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatDate(date) {
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatRelativeTime(date) {
  const now = new Date()
  const then = new Date(date)
  const diffInSeconds = Math.floor((now - then) / 1000)

  if (diffInSeconds < 60) return 'Vừa xong'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`
  return formatDate(date)
}

// Category emoji mapping based on slug
const CATEGORY_EMOJI_MAP = {
  'mon-viet': '🍲',
  'mon-a': '🥢',
  'mon-tay': '🍽️',
  'trang-miem': '🍰',
  'do-uong': '🥤',
  'mon-chay': '🥬',
}

const DEFAULT_CATEGORY_EMOJI = '🍽️'

/**
 * Get emoji for a category slug
 * @param {string} slug - Category slug (e.g., 'mon-viet', 'mon-a')
 * @returns {string} Emoji character or default
 */
export function getEmojiForCategory(slug) {
  return CATEGORY_EMOJI_MAP[slug] || DEFAULT_CATEGORY_EMOJI
}