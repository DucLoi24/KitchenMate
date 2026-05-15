import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useParams, Link } from 'react-router-dom'
import { User, Calendar, BookOpen, ArrowLeft, Settings, UserPlus, UserCheck, Flag, Star } from 'lucide-react'
import { useAuth } from '@/components/auth/useAuth'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { authApi } from '@/api/authApi'
import { ReportModal } from '@/components/report/ReportModal'
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

const difficultyConfig = {
  EASY: { label: 'Dễ', variant: 'success' },
  MEDIUM: { label: 'Trung bình', variant: 'warning' },
  HARD: { label: 'Khó', variant: 'danger' },
  Dễ: { label: 'Dễ', variant: 'success' },
  'Trung bình': { label: 'Trung bình', variant: 'warning' },
  Khó: { label: 'Khó', variant: 'danger' },
}

export function PublicProfilePage() {
  const { userId } = useParams()
  const { user: currentUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState(null)
  const [recipes, setRecipes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)

  const isOwnProfile = currentUser?.id === userId || currentUser?.uuid === userId

  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoading(true)
      try {
        const [profileRes, statsRes] = await Promise.all([
          authApi.getPublicProfile(userId),
          authApi.getUserStats(userId)
        ])

        setProfile(profileRes.data)
        setStats(statsRes.data)

        const recipesRes = await authApi.getUserRecipes(userId)
        setRecipes(recipesRes.data?.results || [])
      } catch {
        toast.error('Không thể tải thông tin người dùng')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfileData()
  }, [userId])

  const handleFollow = () => {
    setIsFollowing(!isFollowing)
    toast.success(isFollowing ? 'Đã hủy theo dõi' : 'Đã theo dõi')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          <p className="text-[var(--color-text-secondary)]">Đang tải thông tin...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--color-text-secondary)] mb-4">Không tìm thấy người dùng</p>
          <Link to="/">
            <Button variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Quay lại trang chủ
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Header */}
      <header className="bg-[var(--color-surface)] border-b border-[var(--color-border)] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="p-2 hover:bg-[var(--color-background-alt)] rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--color-text-secondary)]" />
            </Link>
            <div>
              <h1 className="font-display text-xl font-semibold text-[var(--color-text)]">
                {profile.full_name}
              </h1>
              <p className="text-sm text-[var(--color-text-muted)]">
                @{profile.id}
              </p>
            </div>
          </div>
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
          {/* Profile Header */}
          <motion.div variants={itemVariants}>
            <Card shadow="md" border="default">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  {/* Avatar */}
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-[var(--color-background-alt)] border-4 border-[var(--color-border)] flex-shrink-0">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-10 h-10 text-[var(--color-text-muted)]" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
                      <h2 className="font-display text-2xl font-semibold text-[var(--color-text)]">
                        {profile.full_name}
                      </h2>
                      {!isOwnProfile && (
                        <Button
                          variant={isFollowing ? 'outline' : 'primary'}
                          size="sm"
                          onClick={handleFollow}
                          className="sm:ml-auto"
                          leftIcon={isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                        >
                          {isFollowing ? 'Đã theo dõi' : 'Theo dõi'}
                        </Button>
                      )}
                      {!isOwnProfile && (
                        <button
                          onClick={() => setShowReportModal(true)}
                          className="p-2 rounded-full border border-red-200 text-red-500 hover:bg-red-50 transition-colors sm:ml-2"
                          title="Báo cáo người dùng"
                        >
                          <Flag className="w-4 h-4" />
                        </button>
                      )}
                      {isOwnProfile && (
                        <Link to="/profile" className="sm:ml-auto">
                          <Button variant="outline" size="sm" leftIcon={<Settings className="w-4 h-4" />}>
                            Chỉnh sửa
                          </Button>
                        </Link>
                      )}
                    </div>

                    {profile.bio && (
                      <p className="text-[var(--color-text-secondary)] mb-4 max-w-xl">
                        {profile.bio}
                      </p>
                    )}

                    <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm text-[var(--color-text-muted)] mb-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Tham gia {new Date(profile.created_at).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                      </span>
                    </div>

                    <div className="flex flex-wrap justify-center sm:justify-start gap-4">
                      <div className="text-center sm:text-left">
                        <span className="font-bold text-lg text-[var(--color-text)]">{stats?.recipe_count || 0}</span>
                        <span className="text-sm text-[var(--color-text-muted)] ml-1">công thức</span>
                      </div>
                      <div className="text-center sm:text-left">
                        <span className="font-bold text-lg text-[var(--color-text)]">{stats?.total_likes || 0}</span>
                        <span className="text-sm text-[var(--color-text-muted)] ml-1">lượt thích</span>
                      </div>
                      {stats?.average_rating && (
                        <div className="text-center sm:text-left">
                          <span className="font-bold text-lg text-[var(--color-text)]">{stats.average_rating.toFixed(1)}</span>
                          <span className="text-sm text-[var(--color-text-muted)] ml-1">đánh giá</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Public recipes */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center gap-3 border-b border-[var(--color-border)] pb-4">
              <BookOpen className="w-5 h-5 text-[var(--color-primary)]" />
              <h3 className="font-display text-xl font-semibold text-[var(--color-text)]">
                Công thức
              </h3>
              <Badge variant="muted" size="sm">{recipes.length}</Badge>
            </div>

            <div className="space-y-4 pt-4">
              {recipes.length > 0 ? (
                recipes.map(recipe => {
                  const thumbnailUrl = recipe.thumbnail_url || recipe.thumbnail
                  const avgRating = Number(recipe.avg_rating)
                  const hasRating = Number.isFinite(avgRating) && avgRating > 0
                  const ratingCount = recipe.rating_count ?? recipe.review_count ?? 0
                  const difficulty = difficultyConfig[recipe.difficulty] || difficultyConfig.MEDIUM

                  return (
                    <Card key={recipe.id} shadow="sm" border="default" hover>
                      <CardContent className="p-4">
                        <Link to={`/recipe/${recipe.id}`} className="flex gap-4">
                          <div className="w-20 h-20 rounded-[var(--radius-md)] bg-[var(--color-background-alt)] flex-shrink-0 overflow-hidden">
                            {thumbnailUrl ? (
                              <img src={thumbnailUrl} alt={recipe.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <BookOpen className="w-8 h-8 text-[var(--color-text-muted)]" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-[var(--color-text)] mb-1 truncate">
                              {recipe.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-text-muted)]">
                              <span className="flex items-center gap-1">
                                {hasRating ? (
                                  <>
                                    <Star className="w-4 h-4 fill-[var(--color-accent)] text-[var(--color-accent)]" />
                                    {avgRating.toFixed(1)}
                                  </>
                                ) : 'Chưa có đánh giá'}
                                {hasRating && <span className="text-xs">({ratingCount})</span>}
                              </span>
                              <span>•</span>
                              <span>{recipe.prep_time} phút</span>
                              <Badge
                                variant={difficulty.variant}
                                size="sm"
                              >
                                {difficulty.label}
                              </Badge>
                            </div>
                          </div>
                        </Link>
                      </CardContent>
                    </Card>
                  )
                })
              ) : (
                <div className="text-center py-12 bg-[var(--color-surface)] rounded-[var(--radius-lg)]">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 text-[var(--color-text-muted)]" />
                  <p className="text-[var(--color-text-secondary)]">Chưa có công thức nào</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </main>

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="user"
        targetId={userId}
        targetLabel={profile?.full_name}
      />
    </div>
  )
}

export default PublicProfilePage
