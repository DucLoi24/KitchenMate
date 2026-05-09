import { cn } from '@/utils'

// Dynamic color generation based on slug hash (supports all categories including admin-created)
const CATEGORY_COLOR_CLASSES = [
  'bg-green-100 text-green-700',
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
  'bg-cyan-100 text-cyan-700',
]

const getCategoryColorClass = (slug) => {
  const hash = slug.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return CATEGORY_COLOR_CLASSES[hash % CATEGORY_COLOR_CLASSES.length]
}

export function CategoryBadge({ category, size = 'sm', className }) {
  const colorClass = getCategoryColorClass(category.slug)

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        colorClass,
        className
      )}
    >
      {category.name}
    </span>
  )
}

export default CategoryBadge