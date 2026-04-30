import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useParams, Link } from 'react-router-dom'
import { User, Calendar, BookOpen, FolderOpen, ArrowLeft, Settings, UserPlus, UserCheck } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthContext'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
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

export function PublicProfilePage() {
  const { userId } = useParams()
  const { user: currentUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [recipes, setRecipes] = useState([])
  const [collections, setCollections] = useState([])
  const [activeTab, setActiveTab] = useState('recipes')
  const [isLoading, setIsLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)

  const isOwnProfile = currentUser?.id === parseInt(userId) || currentUser?.id === userId

  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoading(true)
      try {
        // Simulate API call - in real app, use authApi.getPublicProfile(userId)
        await new Promise(resolve => setTimeout(resolve, 600))

        // Mock data - replace with real API response
        setProfile({
          id: userId,
          full_name: userId === '1' ? 'Nguyễn Văn A' : 'Trần Thị B',
          bio: userId === '1'
            ? 'Yêu thích nấu ăn và khám phá ẩm thực Việt Nam. Đặc biệt thích các món từ miền Nam.'
            : 'Food blogger & recipe creator. Chuyên các món ăn healthy và quick meals.',
          avatar: null,
          created_at: '2024-06-15',
          recipe_count: userId === '1' ? 12 : 8,
          collection_count: userId === '1' ? 3 : 5,
          follower_count: userId === '1' ? 156 : 89,
          following_count: userId === '1' ? 42 : 38
        })

        setRecipes(
          userId === '1'
            ? [
                { id: 1, title: 'Cơm tấm sườn bì chả', thumbnail: null, avg_rating: 4.8, rating_count: 24, prep_time: 45, difficulty: 'Trung bình' },
                { id: 2, title: 'Bún bò Huế', thumbnail: null, avg_rating: 4.6, rating_count: 18, prep_time: 90, difficulty: 'Khó' },
                { id: 3, title: 'Bánh xèo miền Nam', thumbnail: null, avg_rating: 4.9, rating_count: 32, prep_time: 60, difficulty: 'Trung bình' }
              ]
            : [
                { id: 4, title: 'Salad rau trộn', thumbnail: null, avg_rating: 4.5, rating_count: 12, prep_time: 15, difficulty: 'Dễ' },
                { id: 5, title: 'Smoothie bowl', thumbnail: null, avg_rating: 4.7, rating_count: 15, prep_time: 10, difficulty: 'Dễ' }
              ]
        )

        setCollections(
          userId === '1'
            ? [
                { id: 1, name: 'Món Việt Nam', recipe_count: 5 },
                { id: 2, name: 'Món miền Nam', recipe_count: 4 },
                { id: 3, name: 'Món ăn gia đình', recipe_count: 3 }
              ]
            : [
                { id: 4, name: 'Healthy Recipes', recipe_count: 4 },
                { id: 5, name: 'Quick Meals', recipe_count: 4 }
              ]
        )
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
                    {profile.avatar ? (
                      <img src={profile.avatar} alt={profile.full_name} className="w-full h-full object-cover" />
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
                        <span className="font-bold text-lg text-[var(--color-text)]">{profile.recipe_count}</span>
                        <span className="text-sm text-[var(--color-text-muted)] ml-1">công thức</span>
                      </div>
                      <div className="text-center sm:text-left">
                        <span className="font-bold text-lg text-[var(--color-text)]">{profile.follower_count}</span>
                        <span className="text-sm text-[var(--color-text-muted)] ml-1">người theo dõi</span>
                      </div>
                      <div className="text-center sm:text-left">
                        <span className="font-bold text-lg text-[var(--color-text)]">{profile.following_count}</span>
                        <span className="text-sm text-[var(--color-text-muted)] ml-1">đang theo dõi</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Tabs */}
          <motion.div variants={itemVariants}>
            <div className="flex border-b border-[var(--color-border)]">
              {[
                { id: 'recipes', label: 'Công thức', icon: BookOpen, count: recipes.length },
                { id: 'collections', label: 'Bộ sưu tập', icon: FolderOpen, count: collections.length }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors relative ${
                    activeTab === tab.id
                      ? 'text-[var(--color-primary)]'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  <Badge variant="muted" size="sm">{tab.count}</Badge>
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary)]"
                    />
                  )}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Tab Content */}
          <motion.div variants={itemVariants}>
            {activeTab === 'recipes' && (
              <div className="space-y-4">
                {recipes.length > 0 ? (
                  recipes.map(recipe => (
                    <Card key={recipe.id} shadow="sm" border="default" hover>
                      <CardContent className="p-4">
                        <Link to={`/recipe/${recipe.id}`} className="flex gap-4">
                          <div className="w-20 h-20 rounded-[var(--radius-md)] bg-[var(--color-background-alt)] flex-shrink-0 overflow-hidden">
                            {recipe.thumbnail ? (
                              <img src={recipe.thumbnail} alt={recipe.title} className="w-full h-full object-cover" />
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
                                ★ {recipe.avg_rating.toFixed(1)}
                                <span className="text-xs">({recipe.rating_count})</span>
                              </span>
                              <span>•</span>
                              <span>{recipe.prep_time} phút</span>
                              <Badge
                                variant={
                                  recipe.difficulty === 'Dễ' ? 'success' :
                                  recipe.difficulty === 'Trung bình' ? 'warning' : 'danger'
                                }
                                size="sm"
                              >
                                {recipe.difficulty}
                              </Badge>
                            </div>
                          </div>
                        </Link>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12 bg-[var(--color-surface)] rounded-[var(--radius-lg)]">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 text-[var(--color-text-muted)]" />
                    <p className="text-[var(--color-text-secondary)]">Chưa có công thức nào</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'collections' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {collections.length > 0 ? (
                  collections.map(collection => (
                    <Link key={collection.id} to={`/collection/${collection.id}`}>
                      <Card shadow="sm" border="default" hover>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-[var(--radius-md)] bg-[var(--color-primary)]/10 flex items-center justify-center flex-shrink-0">
                              <FolderOpen className="w-6 h-6 text-[var(--color-primary)]" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-[var(--color-text)] mb-1">
                                {collection.name}
                              </h3>
                              <p className="text-sm text-[var(--color-text-muted)]">
                                {collection.recipe_count} công thức
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-12 bg-[var(--color-surface)] rounded-[var(--radius-lg)]">
                    <FolderOpen className="w-12 h-12 mx-auto mb-4 text-[var(--color-text-muted)]" />
                    <p className="text-[var(--color-text-secondary)]">Chưa có bộ sưu tập nào</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}

export default PublicProfilePage