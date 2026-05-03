import { useState, useEffect, useCallback } from 'react'
import { LogIn } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { ReviewForm } from './ReviewForm'
import { ReviewList } from './ReviewList'
import { socialApi } from '@/api/socialApi'
import { useAuth } from '@/components/auth/AuthContext'

export function ReviewsSection({ recipeId }) {
  const { user, isAuthenticated } = useAuth()
  const [reviews, setReviews] = useState([])
  const [pagination, setPagination] = useState(null)
  const [myReview, setMyReview] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const fetchReviews = useCallback(async (page = 1) => {
    try {
      setIsLoading(true)
      const response = await socialApi.getReviews(recipeId, page)
      const reviewList = response.data?.results || response.data || []

      setReviews(reviewList)
      if (response.data?.pagination) {
        setPagination(response.data.pagination)
      } else if (response.data?.count !== undefined) {
        setPagination({
          current_page: page,
          total_pages: Math.ceil(response.data.count / 10),
          total: response.data.count,
        })
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err)
    } finally {
      setIsLoading(false)
    }
  }, [recipeId])

  const fetchMyReview = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setMyReview(null)
      return
    }

    try {
      const response = await socialApi.getMyReviewForRecipe(recipeId)
      const allReviews = response.data?.results || response.data || []
      const myReviewData = allReviews.find((r) => r.user === user.id)
      setMyReview(myReviewData || null)
    } catch (err) {
      console.error('Failed to fetch my review:', err)
      setMyReview(null)
    }
  }, [recipeId, isAuthenticated, user])

  useEffect(() => {
    fetchReviews(1)
    if (isAuthenticated) {
      fetchMyReview()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (myReview && !reviews.find((r) => r.id === myReview.id)) {
      setReviews((prev) => [myReview, ...prev])
    }
  }, [myReview, reviews])

  const handlePageChange = (page) => {
    fetchReviews(page)
  }

  const handleReviewSubmit = async (reviewData) => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để viết đánh giá')
      return
    }

    setIsSubmitting(true)
    try {
      let savedReview

      // Extract cooksnap file before sending review data (multipart not supported in JSON POST)
      const { cooksnap, ...reviewPayload } = reviewData

      if (isEditing && myReview) {
        const response = await socialApi.updateReview(myReview.id, reviewPayload)
        savedReview = response.data
        toast.success('Cập nhật đánh giá thành công')
        setIsEditing(false)
      } else {
        const response = await socialApi.postReview(recipeId, reviewPayload)
        savedReview = response.data
        toast.success('Đăng đánh giá thành công')
      }

      // Upload cooksnap separately if file was selected
      if (savedReview && cooksnap) {
        try {
          const uploadResponse = await socialApi.uploadCooksnap(savedReview.id, cooksnap)
          savedReview = {
            ...savedReview,
            cooksnap_url: uploadResponse.url,
          }
        } catch (uploadErr) {
          console.error('Cooksnap upload failed:', uploadErr)
          toast.error('Đăng đánh giá thành công nhưng upload ảnh thất bại')
        }
      }

      if (savedReview) {
        setMyReview(savedReview)
        setReviews((prev) => {
          const filtered = prev.filter((r) => r.id !== savedReview.id)
          return [savedReview, ...filtered]
        })
      }
    } catch (err) {
      const message = err?.response?.data?.error?.message || 'Đăng đánh giá thất bại. Vui lòng thử lại.'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReviewUpdated = (review) => {
    setMyReview(review)
    setIsEditing(true)
  }

  const handleReviewDeleted = (reviewId) => {
    setReviews((prev) => prev.filter((r) => r.id !== reviewId))
    if (myReview?.id === reviewId) {
      setMyReview(null)
      setIsEditing(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] p-6 border border-[var(--color-border)]">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--color-background-alt)] flex items-center justify-center mb-4">
            <LogIn className="w-8 h-8 text-[var(--color-text-muted)]" />
          </div>
          <h3 className="font-display text-lg font-semibold text-[var(--color-text)] mb-2">
            Đăng nhập để viết đánh giá
          </h3>
          <p className="text-[var(--color-text-secondary)] text-sm max-w-[12rem] mb-4">
            Hãy đăng nhập để chia sẻ cảm nghĩ của bạn về công thức này
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-primary-light)] transition-colors"
          >
            Đăng nhập
          </Link>
        </div>

        <div className="border-t border-[var(--color-border)] pt-6 mt-6">
          <ReviewList
            reviews={reviews}
            pagination={pagination}
            currentUserId={user?.id}
            onPageChange={handlePageChange}
            onReviewUpdated={handleReviewUpdated}
            onReviewDeleted={handleReviewDeleted}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] p-6 border border-[var(--color-border)]">
      {(!myReview || isEditing) && (
        <div className="mb-6">
          <ReviewForm
            initialData={myReview}
            onSubmit={handleReviewSubmit}
            onCancel={isEditing ? handleCancelEdit : null}
            isSubmitting={isSubmitting}
          />
        </div>
      )}

      <ReviewList
        reviews={reviews}
        pagination={pagination}
        currentUserId={user?.id}
        onPageChange={handlePageChange}
        onReviewUpdated={handleReviewUpdated}
        onReviewDeleted={handleReviewDeleted}
      />
    </div>
  )
}

export default ReviewsSection