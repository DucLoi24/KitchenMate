import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Check, CheckCheck, X, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/utils'
import { notificationApi } from '@/api/reportsApi'

const NOTIFICATION_ICONS = {
  REPORT_PROCESSED: <Check className="w-4 h-4 text-green-500" />,
  WARNING: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
}

function NotificationItem({ notification, onMarkAsRead }) {
  const icon = NOTIFICATION_ICONS[notification.type] || <Info className="w-4 h-4 text-blue-500" />

  return (
    <div
      className={cn(
        'flex gap-3 p-4 rounded-[var(--radius-lg)] transition-colors',
        notification.is_read
          ? 'bg-[var(--color-surface)]'
          : 'bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20'
      )}
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--color-background-alt)] flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className={cn(
          'font-medium text-sm',
          notification.is_read ? 'text-[var(--color-text)]' : 'text-[var(--color-text)] font-semibold'
        )}>
          {notification.title}
        </h4>
        <p className="text-sm text-[var(--color-text-secondary)] mt-0.5 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          {new Date(notification.created_at).toLocaleDateString('vi-VN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
      {!notification.is_read && (
        <button
          onClick={() => onMarkAsRead(notification.id)}
          className="flex-shrink-0 p-2 rounded-full hover:bg-[var(--color-primary)]/10 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
          title="Đánh dấu đã đọc"
        >
          <Check className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

export function NotificationPopup({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const popupRef = useRef(null)

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const res = await notificationApi.getNotifications()
      const list = res.data?.results || res.data?.data || res.data || []
      setNotifications(list)
    } catch {
      console.error('Failed to fetch notifications')
    } finally {
      setLoading(false)
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const res = await notificationApi.getUnreadCount()
      setUnreadCount(res.data?.unread_count || 0)
    } catch {
      console.error('Failed to fetch unread count')
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

  useEffect(() => {
    fetchUnreadCount()
    // Poll every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationApi.markAsRead(notificationId)
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {
      console.error('Failed to mark as read')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch {
      console.error('Failed to mark all as read')
    }
  }

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            onWheel={(e) => e.stopPropagation()}
            className="fixed inset-0 z-[9998]"
          />

          {/* Popup */}
          <motion.div
            ref={popupRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'fixed top-16 right-4 z-[9999] w-80 max-h-[calc(100vh-8rem)]',
              'bg-[var(--color-surface)] rounded-[var(--radius-xl)]',
              'border border-[var(--color-border)] shadow-[var(--shadow-xl)]',
              'flex flex-col overflow-hidden',
              'max-lg:bottom-20 max-lg:top-auto max-lg:max-h-[calc(100vh-10rem)]'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-[var(--color-primary)]" />
                <h3 className="font-semibold text-[var(--color-text)]">Thông báo</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-[var(--color-primary)] text-white rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="p-2 rounded-full hover:bg-[var(--color-background-alt)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
                    title="Đánh dấu tất cả đã đọc"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-[var(--color-background-alt)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2">
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-2 border-[var(--color-border)] border-t-[var(--color-primary)] rounded-full animate-spin" />
                </div>
              )}

              {!loading && notifications.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Bell className="w-12 h-12 text-[var(--color-text-muted)] mb-2" />
                  <p className="text-[var(--color-text-secondary)]">Không có thông báo nào</p>
                </div>
              )}

              {!loading && notifications.length > 0 && (
                <div className="space-y-2">
                  {notifications.map(notification => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={handleMarkAsRead}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default NotificationPopup
