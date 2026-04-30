# KitchenMate Frontend Design Guide

> Design system cho KitchenMate - ứng dụng quản lý nguyên liệu & gợi ý món ăn. Hướng dẫn này ĐẢM BẢO tính nhất quán khi phát triển UI.

> **⚡ KHUYẾN KHÍCH SÁNG TẠO:** Design tokens là điểm khởi đầu, không phải giới hạn. Hãy tạo UI độc đáo, memorable, và đừng ngại experiment với các animation/phối hợp mới miễn là follow design principles cơ bản.

---

## 1. Design Direction

### Aesthetic: "Warm Kitchen" - Organic Luxury

**Concept:** Mang cảm giác ấm cúng của gian bếp Việt Nam, kết hợp với sự tinh tế hiện đại. Không quá minimal (冰冷), không quá maximal (hỗn loạn). Tạo cảm giác như đang trong một căn bếp sạch sẽ, ngăn nắp nhưng ấm áp.

**Key Characteristics:**
- Màu sắc: Warm earth tones - terracotta, forest green, golden accents
- Typography: Serif display (Fraunces) cho headings, clean sans-serif (Sora) cho body
- Spacing: Generous whitespace, breathing room giữa các elements
- Motion: Smooth, organic - không giật cục. Staggered reveals khi load page

### 🎨 Creative Expression (How to Stand Out)

**Làm cho project KHÁC BIỆT:**
- Dùng texture/pattern độc đáo cho background (grain, subtle shapes)
- Tạo custom micro-animations cho từng interaction type
- Phối hợp màu sắc sáng tạo với palette - gradient meshes, layered effects
- Tạo unexpected moments: hover effects có depth, transitions có personality
- Sử dụng asymmetric layouts cho feature sections
- Custom decorative elements: SVG patterns, animated shapes

**Animation Philosophy:**
- **Page Load:** Một orchestrated stagger reveal tạo ấn tượng mạnh hơn nhiều micro-interactions rải rác
- **Hover:** Surprise moments - element không chỉ thay đổi mà còn "responds" một cách có personality
- **Scroll:** GSAP scroll-triggered reveals tạo depth
- **Transitions:** Fade + slide có elasticity, không linear

---

## 2. Color Palette

### Light Mode (Primary)

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-primary` | `#B85C38` | Primary actions, links, highlights |
| `--color-primary-light` | `#D4785A` | Hover states |
| `--color-primary-dark` | `#8F4426` | Active states |
| `--color-secondary` | `#3D5A45` | Secondary buttons, success states |
| `--color-secondary-light` | `#5A7D63` | Secondary hover |
| `--color-secondary-dark` | `#2D4435` | Secondary active |
| `--color-accent` | `#D4A03B` | Accents, badges, stars |
| `--color-accent-light` | `#E5B95A` | Accent hover |
| `--color-accent-dark` | `#B8862E` | Accent active |
| `--color-background` | `#FBF8F3` | Page background (warm white) |
| `--color-background-alt` | `#F5F0E8` | Alternate sections |
| `--color-surface` | `#FFFFFF` | Cards, modals |
| `--color-text` | `#2C2420` | Primary text (warm black) |
| `--color-text-secondary` | `#6B5D54` | Secondary text |
| `--color-text-muted` | `#9A8B7F` | Muted/placeholder text |
| `--color-border` | `#E5DDD4` | Borders |
| `--color-border-strong` | `#C9BFB2` | Strong borders |

### Dark Mode

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-dark-bg` | `#1A1A1A` | Background |
| `--color-dark-surface` | `#252220` | Cards, surfaces |
| `--color-dark-border` | `#3A3532` | Borders |
| `--color-dark-text` | `#E8E4DF` | Text |
| `--color-dark-text-secondary` | `#A8A09A` | Secondary text |

### ⚠️ IMPORTANT: Color Usage Rules

1. **Primary** = Terracotta `#B85C38` → Dùng cho CTAs chính, links, highlights
2. **Secondary** = Forest Green `#3D5A45` → Dùng cho secondary actions, success, confirmations
3. **Accent** = Golden `#D4A03B` → Dùng cho stars, badges, special highlights
4. **Background** = Warm off-white `#FBF8F3` → KHÔNG dùng pure white `#FFFFFF` cho page bg

---

## 3. Typography

### Font Stack

```css
--font-display: 'Fraunces', Georgia, serif;
--font-body: 'Sora', system-ui, sans-serif;
```

### Scale

| Element | Font | Size | Weight | Line-height |
|---------|------|------|--------|-------------|
| H1 (Page title) | display | 3rem (48px) | 600 | 1.2 |
| H2 (Section title) | display | 2rem (32px) | 600 | 1.3 |
| H3 (Card title) | display | 1.5rem (24px) | 600 | 1.4 |
| Body large | body | 1.125rem (18px) | 400 | 1.6 |
| Body | body | 1rem (16px) | 400 | 1.6 |
| Body small | body | 0.875rem (14px) | 400 | 1.5 |
| Caption | body | 0.75rem (12px) | 400 | 1.4 |
| Button | body | 0.875rem (14px) | 500 | 1 |

### Usage Rules

1. **Headings luôn dùng `font-display`** - tạo warmth và character
2. **Body text luôn dùng `font-body`** - clean và readable
3. **Độ dài text trên 1 dòng** không nên quá 60-80 ký tự cho readability
4. **Fallback fonts**: Fraunces → Georgia → serif, Sora → system-ui → sans-serif

---

## 4. Spacing System

### Base Unit: 4px

| Token | Value | Usage |
|-------|-------|-------|
| `--spacing-xs` | 0.25rem (4px) | Tight spacing |
| `--spacing-sm` | 0.5rem (8px) | Small gaps |
| `--spacing-md` | 1rem (16px) | Default spacing |
| `--spacing-lg` | 1.5rem (24px) | Section gaps |
| `--spacing-xl` | 2rem (32px) | Large gaps |
| `--spacing-2xl` | 3rem (48px) | Section separators |
| `--spacing-3xl` | 4rem (64px) | Major sections |
| `--spacing-4xl` | 6rem (96px) | Page-level spacing |

### Key Spacing Rules

1. **Form inputs**: padding 12px horizontal, height 40-48px
2. **Cards**: padding 24-32px, gap between cards 16-24px
3. **Sections**: padding 48-64px vertical
4. **Page margins**: 16px mobile, 24-32px tablet, 48px desktop

---

## 5. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 0.375rem (6px) | Small elements (badges) |
| `--radius-md` | 0.75rem (12px) | Buttons, inputs |
| `--radius-lg` | 1.25rem (20px) | Cards |
| `--radius-xl` | 2rem (32px) | Large containers, modals |
| `--radius-full` | 9999px | Pills, avatars |

### Rule: Progressive Radius

- Small elements (badges, tags): `--radius-sm`
- Interactive elements (buttons, inputs): `--radius-md`
- Cards, containers: `--radius-lg`
- Large modals, panels: `--radius-xl`

---

## 6. Shadows

```css
--shadow-sm: 0 1px 2px rgba(44, 36, 32, 0.06);    /* Subtle, cards */
--shadow-md: 0 4px 12px rgba(44, 36, 32, 0.08);   /* Cards hover */
--shadow-lg: 0 12px 32px rgba(44, 36, 32, 0.12);  /* Modals, dropdowns */
--shadow-xl: 0 24px 48px rgba(44, 36, 32, 0.16);  /* Large modals */
```

### Shadow Usage

1. **Cards**: `shadow-sm` default, `shadow-md` on hover
2. **Modals**: `shadow-lg` minimum
3. **Dropdowns**: `shadow-md`
4. **Floating buttons**: `shadow-lg`

---

## 7. Motion & Animation

### Transition Tokens

```css
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);    /* Micro-interactions */
--transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);    /* Default */
--transition-slow: 400ms cubic-bezier(0.4, 0, 0.2, 1);    /* Page transitions */
--transition-spring: 500ms cubic-bezier(0.34, 1.56, 0.64, 1); /* Bouncy effects */
```

### Animation Patterns

#### Page Load Stagger (Framer Motion)
```javascript
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } }
}
```

#### Button Hover
- Scale: 1.02
- Shadow: increase
- Duration: `--transition-fast`

#### Card Hover
- Transform: translateY(-2px)
- Shadow: increase
- Duration: `--transition-base`

### Rules

1. **Stagger animation** khi load page content (delay: 0.08s per item)
2. **Page transitions**: fade + slide, 300-400ms
3. **Hover states**: 150-250ms, ease-out
4. **Modal entrance**: scale from 0.95 + fade, 300ms spring
5. **Avoid**: instant changes, jarring animations

---

## 8. Component Patterns

### Card Pattern
```jsx
<div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-sm)] border border-[var(--color-border)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 transition-all duration-[var(--transition-base)]">
```

### Form Input Pattern
```jsx
<input className="w-full h-11 px-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all duration-[var(--transition-fast)]" />
```

### Primary Button Pattern
```jsx
<button className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white font-medium shadow-[var(--shadow-sm)] hover:bg-[var(--color-primary-light)] hover:shadow-[var(--shadow-md)] active:bg-[var(--color-primary-dark)] transition-all duration-[var(--transition-fast)] disabled:opacity-50 disabled:pointer-events-none">
```

### Page Layout Pattern
```jsx
<div className="min-h-screen bg-[var(--color-background)]">
  <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8 max-w-7xl mx-auto">
    {/* Content */}
  </main>
</div>
```

---

## 9. Responsive Breakpoints

| Breakpoint | Width | Usage |
|------------|-------|-------|
| Mobile | < 640px | Phone screens |
| Tablet | 640px - 1024px | Tablets, small laptops |
| Desktop | > 1024px | Desktop screens |

### Mobile-First Rules

1. **Touch targets**: minimum 44x44px
2. **Padding**: 16px horizontal minimum
3. **Font size**: minimum 16px (avoid iOS zoom on focus)
4. **Bottom navigation**: fixed, 56-64px height
5. **Cards**: full-width on mobile, 2-col on tablet, 3-4 col on desktop

---

## 10. Accessibility

### Focus States
```css
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### Color Contrast
- Text on background: minimum 4.5:1 ratio
- Large text (18px+): minimum 3:1 ratio
- UI components: minimum 3:1 ratio

### Motion
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 11. Icon Library

**Library**: Lucide React

Usage:
```jsx
import { Mail, Lock, ArrowRight } from 'lucide-react'
```

### Icon Sizing
| Context | Size |
|---------|------|
| Inline (text next to) | 16px (w-4 h-4) |
| Button icon | 20px (w-5 h-5) |
| Feature icon | 24px (w-6 h-6) |
| Hero icon | 32-48px |

### Icon Color
- Default: `text-[var(--color-text)]`
- Muted: `text-[var(--color-text-muted)]`
- Primary: `text-[var(--color-primary)]`

---

## 12. CSS Variable Reference

### Quick Reference

```css
/* Colors */
--color-primary: #B85C38;
--color-secondary: #3D5A45;
--color-accent: #D4A03B;
--color-background: #FBF8F3;
--color-surface: #FFFFFF;
--color-text: #2C2420;

/* Spacing */
--spacing-md: 1rem;
--spacing-lg: 1.5rem;
--spacing-xl: 2rem;

/* Radius */
--radius-md: 0.75rem;
--radius-lg: 1.25rem;

/* Shadow */
--shadow-sm: 0 1px 2px rgba(44, 36, 32, 0.06);
--shadow-md: 0 4px 12px rgba(44, 36, 32, 0.08);

/* Transition */
--transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);
```

---

## 13. Common Patterns

### Two-Column Auth Layout (Desktop)
- Left panel: 50% width, brand/color, decorative content
- Right panel: centered form, max-width 28rem
- Mobile: single column, logo + form stacked

### Card Grid
```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
```

### Bottom Sheet Pattern (Mobile)
- Slide up from bottom
- Rounded top corners (--radius-xl)
- Backdrop overlay (rgba(0,0,0,0.5))
- Drag handle at top (optional)

### Empty State
```jsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <div className="w-16 h-16 rounded-full bg-[var(--color-background-alt)] flex items-center justify-center mb-4">
    {/* Icon */}
  </div>
  <h3 className="font-display text-lg font-semibold text-[var(--color-text)] mb-2">
    Tiêu đề
  </h3>
  <p className="text-[var(--color-text-secondary)] text-sm max-w-xs">
    Mô tả ngắn về trạng thái trống
  </p>
</div>
```

---

## 14. Design Guidelines (Not Restrictions)

**Key Principles thay vì hard rules:**

1. ⚠️ **Tailwind CSS v4 max-w conflict:**
   - `max-w-md` compiles thành `var(--spacing-md)` = 16px (không phải 448px)
   - Use `max-w-[28rem]` hoặc `max-w-[448px]` cho explicit widths

2. ⚠️ **Pure white background:**
   - Warm off-white `bg-[var(--color-background)]` tạo cảm giác ấm áp hơn pure white
   - Nhưng không phải là hard rule - có thể dùng khi cần contrast cao

3. ⚠️ **Typography choices:**
   - Fraunces (serif) cho headings tạo warmth và personality
   - Sora (sans) cho body tạo readability
   - Có thể experiment thêm decorative/display fonts cho hero sections

4. ⚠️ **Motion philosophy:**
   - Subtle + purposeful > flashy + random
   - Một orchestrated page load > nhiều scattered micro-interactions
   - Nhưng ĐƯỢC PHÉP experiment với creative animations miễn là enhance UX

5. ⚠️ **Icons:**
   - Lucide React là icon library chính
   - Có thể dùng emoji trong decorative/fun contexts (không phải critical UI)

---

## 15. Creative Examples (Inspirations)

### Hero Section Ideas
- Gradient mesh backgrounds (amber → coral → warm brown)
- Subtle grain texture overlays
- Floating decorative shapes (faded food-related SVG illustrations)
- Animated text reveals (word-by-word stagger)

### Card Design Ideas
- Subtle inner glow on hover (box-shadow inset)
- Image zoom + overlay gradient on hover
- Stacked shadow effect (multiple layered shadows)
- Content reveal from bottom on hover

### Button Interactions
- Morphing shapes on hover (border-radius animation)
- Ripple effect on click
- Magnetic pull effect near cursor
- Color gradient sweep on hover

### Page Transitions
- Shared element transitions (if possible with Framer Motion)
- Page slides out while new page slides in from opposite direction
- Fade through with slight scale
- Curtain wipe effect

---

## 15. File Structure

```
src/
├── components/
│   ├── ui/              # Button, Input, Card, Badge, etc.
│   ├── auth/            # AuthGuard, AuthContext, GoogleOAuthButton
│   ├── layout/          # Header, Footer, Sidebar, BottomNav
│   ├── recipe/          # RecipeCard, RecipeDetail components
│   ├── pantry/          # PantryItem, PantryAddBottomSheet
│   ├── shopping/         # ShoppingListItem, ShoppingListAddBottomSheet
│   └── social/           # CommentItem, RatingComponent
├── pages/
│   ├── auth/            # LoginPage, RegisterPage, ForgotPasswordPage
│   ├── home/            # HomePage
│   ├── explore/          # ExplorePage
│   ├── recipe/           # RecipeDetailPage, RecipeEditorPage
│   ├── pantry/          # PantryPage
│   ├── shopping/        # ShoppingListPage
│   ├── suggestion/       # SuggestionPage
│   ├── profile/          # ProfilePage, PublicProfilePage
│   └── collections/      # CollectionsPage, CollectionDetailPage
└── index.css            # Design tokens, base styles
```

---

## Quick Start Checklist

- [ ] Import design tokens via `var(--color-*)`
- [ ] Use `font-display` for headings, `font-body` for body
- [ ] Follow spacing scale (`--spacing-md`, `--spacing-lg`, etc.)
- [ ] Use `--radius-md` for interactive elements, `--radius-lg` for cards
- [ ] Add `transition-all duration-[var(--transition-base)]` for hover effects
- [ ] Test on mobile viewport (375px) first
- [ ] Verify touch targets ≥ 44x44px
- [ ] Check color contrast ratios
- [ ] **Add unique creative touches** - make it memorable!

---

## Creative Freedom Guidelines

**Được làm:**
- ✅ Custom gradients, textures, patterns cho backgrounds
- ✅ Unique hover effects có personality (morphing, magnetic, ripples)
- ✅ GSAP scroll-triggered animations cho hero và sections
- ✅ Framer Motion physics-based animations (bouncy, spring)
- ✅ Asymmetric layouts, overlapping elements, diagonal flows
- ✅ Decorative SVG shapes, animated blobs, grain overlays
- ✅ Experimental micro-interactions miễn là enhance UX

**Không nên:**
- ❌ Generic AI-slop aesthetics (purple gradients, Inter font, cards đều như nhau)
- ❌ Overly flashy animations làm chậm performance
- ❌ Clone exact designs từ nơi khác mà không adapt cho project
- ❌ Ignore core design tokens (colors, typography, spacing cơ bản)

---

**Remember: Design tokens = Foundation, NOT limitation. Build something memorable!** 🎨