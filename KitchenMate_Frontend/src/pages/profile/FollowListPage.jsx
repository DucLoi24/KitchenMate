import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, User, UserCheck, UserPlus, Users } from 'lucide-react'
import { authApi } from '@/api/authApi'
import { useAuth } from '@/components/auth/useAuth'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.08 }
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } }
}

function getPageTitle(followType) {
  return followType === 'following' ? 'Đang theo dõi' : 'Người theo dõi'
}

function getEmptyText(followType) {
  return followType === 'following' ? 'Chưa theo dõi ai' : 'Chưa có người theo dõi'
}

export function FollowListPage() {
  const { userId, followType } = useParams()
  const { user: currentUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [users, setUsers] = useState([])
  const [pageInfo, setPageInfo] = useState({ count: 0, next: null, previous: null })
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [updatingUserId, setUpdatingUserId] = useState(null)

  const isFollowingPage = followType === 'following'
  const title = getPageTitle(followType)

  useEffect(() => {
    const fetchFollowList = async () => {
      setIsLoading(true)
      try {
        const [profileRes, listRes] = await Promise.all([
          authApi.getPublicProfile(userId),
          isFollowingPage ? authApi.getFollowing(userId, page) : authApi.getFollowers(userId, page),
        ])

        setProfile(profileRes.data)
        setUsers(listRes.data?.results || [])
        setPageInfo({
          count: listRes.data?.count || 0,
          next: listRes.data?.next || null,
          previous: listRes.data?.previous || null,
        })
      } catch {
        toast.error('Không thể tải danh sách theo dõi')
      } finally {
        setIsLoading(false)
      }
    }

    fetchFollowList()
  }, [isFollowingPage, page, userId])

  const handleToggleFollow = async (targetUser) => {
    if (!currentUser) {
      toast.error('Vui lòng đăng nhập để theo dõi người dùng')
      return
    }

    const nextIsFollowing = !targetUser.is_following
    setUpdatingUserId(targetUser.id)
    try {
      if (nextIsFollowing) {
        await authApi.followUser(targetUser.id)
      } else {
        await authApi.unfollowUser(targetUser.id)
      }
      setUsers(prev => prev.map(user => (
        user.id === targetUser.id
          ? {
              ...user,
              is_following: nextIsFollowing,
              followers_count: Math.max(0, (user.followers_count || 0) + (nextIsFollowing ? 1 : -1)),
            }
          : user
      )))
      toast.success(nextIsFollowing ? 'Đã theo dõi' : 'Đã hủy theo dõi')
    } catch {
      toast.error('Không thể cập nhật trạng thái theo dõi')
    } finally {
      setUpdatingUserId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          <p className="text-[var(--color-text-secondary)]">Đang tải danh sách...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <header className="bg-[var(--color-surface)] border-b border-[var(--color-border)] sticky top-0 z-10">
        <div className="mx-auto max-w-[56rem] px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              to={`/profile/${userId}`}
              className="p-2 hover:bg-[var(--color-background-alt)] rounded-full transition-colors"
              aria-label="Quay lại hồ sơ"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--color-text-secondary)]" />
            </Link>
            <div>
              <h1 className="font-display text-xl font-semibold text-[var(--color-text)]">
                {title}
              </h1>
              {profile && (
                <p className="text-sm text-[var(--color-text-muted)]">
                  {profile.full_name}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[56rem] px-4 py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {users.length > 0 ? (
            users.map(user => {
              const isOwnUser = currentUser?.id === user.id || currentUser?.uuid === user.id
              return (
                <motion.div key={user.id} variants={itemVariants}>
                  <Card shadow="sm" border="default" hover>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Link to={`/profile/${user.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                          <div className="w-14 h-14 rounded-full overflow-hidden bg-[var(--color-background-alt)] border border-[var(--color-border)] flex-shrink-0">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <User className="w-6 h-6 text-[var(--color-text-muted)]" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h2 className="font-display text-lg font-semibold text-[var(--color-text)] truncate">
                              {user.full_name}
                            </h2>
                            {user.bio && (
                              <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2">
                                {user.bio}
                              </p>
                            )}
                            <p className="text-xs text-[var(--color-text-muted)] mt-1">
                              {user.followers_count || 0} người theo dõi
                            </p>
                          </div>
                        </Link>

                        {currentUser && !isOwnUser && (
                          <Button
                            variant={user.is_following ? 'outline' : 'primary'}
                            size="sm"
                            isLoading={updatingUserId === user.id}
                            onClick={() => handleToggleFollow(user)}
                            leftIcon={user.is_following ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                            className="flex-shrink-0"
                          >
                            {user.is_following ? 'Đã theo dõi' : 'Theo dõi'}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--color-background-alt)] flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-[var(--color-primary)]" />
              </div>
              <h2 className="font-display text-lg font-semibold text-[var(--color-text)] mb-2">
                {getEmptyText(followType)}
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Danh sách sẽ xuất hiện khi có hoạt động theo dõi.
              </p>
            </div>
          )}

          {(pageInfo.previous || pageInfo.next) && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={!pageInfo.previous}
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
              >
                Trước
              </Button>
              <span className="text-sm text-[var(--color-text-muted)]">Trang {page}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={!pageInfo.next}
                onClick={() => setPage(prev => prev + 1)}
              >
                Sau
              </Button>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  )
}

export default FollowListPage
