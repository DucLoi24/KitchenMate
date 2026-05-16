import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, User, UserCheck, UserPlus, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils'

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } },
}

function UserAvatar({ user }) {
  return (
    <div className="w-14 h-14 rounded-full overflow-hidden bg-[var(--color-background-alt)] border border-[var(--color-border)] flex-shrink-0">
      {user.avatar_url ? (
        <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <User className="w-6 h-6 text-[var(--color-text-muted)]" />
        </div>
      )}
    </div>
  )
}

export function UserSearchResults({
  users = [],
  searchQuery = '',
  currentUser = null,
  isLoading = false,
  compact = false,
  updatingUserId = null,
  onToggleFollow,
  onViewAll,
  className,
}) {
  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-10 text-[var(--color-text-secondary)]', className)}>
        <Loader2 className="w-5 h-5 animate-spin text-[var(--color-primary)] mr-2" />
        <span>Đang tìm người dùng...</span>
      </div>
    )
  }

  if (!users.length && compact) return null

  if (!users.length) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-14 text-center', className)}>
        <div className="w-16 h-16 rounded-full bg-[var(--color-background-alt)] flex items-center justify-center mb-4">
          <Users className="w-7 h-7 text-[var(--color-primary)]" />
        </div>
        <h2 className="font-display text-xl font-semibold text-[var(--color-text)] mb-2">
          Không tìm thấy người dùng
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)]">
          {searchQuery ? `Không có kết quả cho "${searchQuery}".` : 'Nhập tên hoặc @ID để tìm người dùng.'}
        </p>
      </div>
    )
  }

  return (
    <section className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-[var(--color-text)]">
            Người dùng
          </h2>
          {searchQuery && (
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Kết quả phù hợp với "{searchQuery}"
            </p>
          )}
        </div>
        {compact && onViewAll && (
          <Button variant="outline" size="sm" onClick={onViewAll}>
            Xem tất cả
          </Button>
        )}
      </div>

      <div className={cn('grid grid-cols-1 gap-4', compact ? 'lg:grid-cols-2' : 'md:grid-cols-2')}>
        {users.map((user) => {
          const isOwnUser = currentUser?.id === user.id || currentUser?.uuid === user.id
          return (
            <motion.div
              key={user.id}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-4 shadow-[var(--shadow-sm)] transition-all duration-[var(--transition-base)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
            >
              <div className="flex items-center gap-4">
                <Link to={`/profile/${user.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                  <UserAvatar user={user} />
                  <div className="min-w-0">
                    <h3 className="font-display text-lg font-semibold text-[var(--color-text)] truncate">
                      {user.full_name}
                    </h3>
                    {user.bio && (
                      <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mt-1">
                        {user.bio}
                      </p>
                    )}
                    <p className="text-xs text-[var(--color-text-muted)] mt-2">
                      {user.followers_count || 0} người theo dõi
                    </p>
                  </div>
                </Link>

                {currentUser && !isOwnUser && (
                  <Button
                    variant={user.is_following ? 'outline' : 'primary'}
                    size="sm"
                    isLoading={updatingUserId === user.id}
                    onClick={() => onToggleFollow?.(user)}
                    leftIcon={user.is_following ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                    className="flex-shrink-0"
                  >
                    {user.is_following ? 'Đã theo dõi' : 'Theo dõi'}
                  </Button>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}

export default UserSearchResults
