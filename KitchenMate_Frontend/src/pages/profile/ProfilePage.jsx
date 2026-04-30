import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Camera, User, Mail, BookOpen, FolderOpen, Save, X } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthContext'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import toast from 'react-hot-toast'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  },
  exit: { opacity: 0, transition: { duration: 0.3 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } }
}

export function ProfilePage() {
  const { user, updateUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    bio: user?.bio || '',
    avatar: null
  })
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null)
  const fileInputRef = useRef(null)

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước ảnh không được vượt quá 5MB')
        return
      }
      setFormData(prev => ({ ...prev, avatar: file }))
      const reader = new FileReader()
      reader.onload = (e) => setAvatarPreview(e.target.result)
      reader.readAsDataURL(file)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // Simulate API call - in real app, use authApi.updateProfile with FormData for avatar
      await new Promise(resolve => setTimeout(resolve, 800))

      const updatedUser = {
        ...user,
        full_name: formData.full_name,
        bio: formData.bio,
        avatar: avatarPreview
      }
      updateUser(updatedUser)
      setIsEditing(false)
      toast.success('Cập nhật thông tin thành công')
    } catch {
      toast.error('Cập nhật thất bại. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      full_name: user?.full_name || '',
      bio: user?.bio || '',
      avatar: null
    })
    setAvatarPreview(user?.avatar || null)
    setIsEditing(false)
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Header */}
      <header className="bg-[var(--color-surface)] border-b border-[var(--color-border)] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
              <span className="text-white font-semibold text-lg">
                {user?.full_name?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <h1 className="font-display text-xl font-semibold text-[var(--color-text)]">
                Hồ sơ của tôi
              </h1>
              <p className="text-sm text-[var(--color-text-muted)]">Quản lý thông tin cá nhân</p>
            </div>
          </div>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              Chỉnh sửa
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="space-y-6"
        >
          {/* Avatar Section */}
          <motion.div variants={itemVariants}>
            <Card shadow="md" border="default">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Avatar */}
                  <div className="relative group">
                    <div
                      className="w-28 h-28 rounded-full overflow-hidden bg-[var(--color-background-alt)] border-4 border-[var(--color-border)] group-hover:border-[var(--color-primary)] transition-colors cursor-pointer"
                      onClick={isEditing ? handleAvatarClick : undefined}
                    >
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt={user?.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-12 h-12 text-[var(--color-text-muted)]" />
                        </div>
                      )}
                    </div>
                    {isEditing && (
                      <>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarChange}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="w-8 h-8 text-white" />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-center sm:text-left">
                    <h2 className="font-display text-2xl font-semibold text-[var(--color-text)] mb-1">
                      {user?.full_name || 'Người dùng'}
                    </h2>
                    <p className="text-[var(--color-text-secondary)] mb-3">
                      {user?.email}
                    </p>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                      <Badge variant="muted" size="md">
                        <BookOpen className="w-3.5 h-3.5 mr-1" />
                        {user?.recipe_count || 0} công thức
                      </Badge>
                      <Badge variant="muted" size="md">
                        <FolderOpen className="w-3.5 h-3.5 mr-1" />
                        {user?.collection_count || 0} bộ sưu tập
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Edit Form */}
          <motion.div variants={itemVariants}>
            <Card shadow="md" border="default">
              <CardContent className="p-6">
                <h3 className="font-display text-lg font-semibold text-[var(--color-text)] mb-6">
                  Thông tin cá nhân
                </h3>

                <div className="space-y-5">
                  {/* Full Name */}
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <label className="sm:w-32 sm:pt-2 text-sm font-medium text-[var(--color-text)] flex items-center gap-2">
                      <User className="w-4 h-4 text-[var(--color-text-muted)]" />
                      Họ tên
                    </label>
                    <div className="flex-1">
                      {isEditing ? (
                        <input
                          type="text"
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleInputChange}
                          className="w-full h-11 px-4 bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-all"
                          placeholder="Nhập họ tên của bạn"
                        />
                      ) : (
                        <p className="py-2.5 text-[var(--color-text)]">
                          {user?.full_name || 'Chưa cập nhật'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <label className="sm:w-32 sm:pt-2 text-sm font-medium text-[var(--color-text)] flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[var(--color-text-muted)]" />
                      Email
                    </label>
                    <div className="flex-1">
                      <p className="py-2.5 text-[var(--color-text)]">
                        {user?.email}
                      </p>
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <label className="sm:w-32 sm:pt-2 text-sm font-medium text-[var(--color-text)]">
                      Giới thiệu
                    </label>
                    <div className="flex-1">
                      {isEditing ? (
                        <textarea
                          name="bio"
                          value={formData.bio}
                          onChange={handleInputChange}
                          rows={4}
                          className="w-full px-4 py-3 bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-all resize-none"
                          placeholder="Giới thiệu về bản thân bạn..."
                        />
                      ) : (
                        <p className="py-2.5 text-[var(--color-text-secondary)]">
                          {user?.bio || 'Chưa có giới thiệu'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-[var(--color-border)]">
                    <Button
                      variant="ghost"
                      onClick={handleCancel}
                      disabled={isLoading}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Hủy
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleSave}
                      isLoading={isLoading}
                    >
                      <Save className="w-4 h-4 mr-1" />
                      Lưu thay đổi
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Account Stats */}
          <motion.div variants={itemVariants}>
            <Card shadow="md" border="default">
              <CardContent className="p-6">
                <h3 className="font-display text-lg font-semibold text-[var(--color-text)] mb-4">
                  Thống kê tài khoản
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Công thức', value: user?.recipe_count || 0, icon: BookOpen },
                    { label: 'Bộ sưu tập', value: user?.collection_count || 0, icon: FolderOpen },
                    { label: 'Đánh giá', value: user?.review_count || 0, icon: '★' },
                    { label: 'Ngày tham gia', value: user?.joined_days || '—', icon: '📅' }
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-[var(--color-background-alt)] rounded-[var(--radius-md)] p-4 text-center"
                    >
                      <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
                        {typeof stat.icon === 'string' ? (
                          <span className="text-lg">{stat.icon}</span>
                        ) : (
                          <stat.icon className="w-5 h-5 text-[var(--color-primary)]" />
                        )}
                      </div>
                      <p className="text-2xl font-bold text-[var(--color-text)]">{stat.value}</p>
                      <p className="text-sm text-[var(--color-text-muted)]">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}

export default ProfilePage