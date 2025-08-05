# Layout System

This directory contains standardized layout components for consistent behavior across the application.

## Components

### BaseLayout

The foundational layout component that provides:

- Responsive container with configurable max-width
- Consistent padding and spacing
- Centered content with proper margins

**Usage:**

```tsx
import { BaseLayout } from '@/components/layouts';

<BaseLayout maxWidth="4xl" padding="md">
  <YourContent />
</BaseLayout>;
```

### FeedLayout

Specialized layout for feed-style pages with sticky navigation support:

- Header section for titles and descriptions
- Multiple sticky navigation sections (tabs, filters, etc.)
- Proper z-index and positioning for sticky elements
- Floating elements support

**Usage:**

```tsx
import { FeedLayout } from '@/components/layouts';

const stickyNavigation = [
  {
    id: 'feed-tabs',
    content: <TabNavigation />,
  },
];

<FeedLayout header={<FeedHeader />} stickyNavigation={stickyNavigation}>
  <FeedContent />
</FeedLayout>;
```

### ProfileLayout

Layout optimized for user profile pages:

- Profile header/hero section
- Optional sticky navigation for profile tabs
- Themed background variants
- Scoped theme support for viewing other users' profiles

**Usage:**

```tsx
import { ProfileLayout } from '@/components/layouts';

<ProfileLayout
  profileHeader={<UserProfileHeader />}
  stickyNavigation={<ProfileTabs />}
  variant="gradient"
  scopedTheme={true}
  themeStyles={userThemeStyles}
>
  <ProfileContent />
</ProfileLayout>;
```

## Sticky Navigation System

The layout system provides a robust sticky navigation solution:

1. **Automatic Positioning**: Calculates proper `top` offset based on header height and previous sticky sections
2. **Z-Index Management**: Ensures proper layering (Header: z-50 > Sticky: z-40 > Content: z-0)
3. **Visual Polish**: Semi-transparent backgrounds with backdrop blur
4. **Mobile Support**: Horizontal scrolling for mobile-friendly navigation

## Layout Hierarchy

```
Header (fixed, z-50, h-16)
  ↓
Sticky Section 1 (top: 64px, z-40)
  ↓
Sticky Section 2 (top: 124px, z-40)
  ↓
Content (z-0)
```

## Configuration Options

### Max Width Options

- `sm`: max-w-sm (384px)
- `md`: max-w-md (448px)
- `lg`: max-w-lg (512px)
- `xl`: max-w-xl (576px)
- `2xl`: max-w-2xl (672px)
- `4xl`: max-w-4xl (896px)
- `5xl`: max-w-5xl (1024px)
- `full`: max-w-full

### Padding Options

- `none`: No padding
- `sm`: px-2 py-4
- `md`: px-4 py-6 (default)
- `lg`: px-6 py-8

### Spacing Options

- `sm`: mb-4
- `md`: mb-6 (default)
- `lg`: mb-8

## Migration Guide

### From Manual Layouts

Replace manual container and sticky positioning:

**Before:**

```tsx
<div className="container mx-auto px-4 py-8">
  <div className="bg-background/95 sticky top-16 z-40">
    <Navigation />
  </div>
  <Content />
</div>
```

**After:**

```tsx
<FeedLayout stickyNavigation={[{ id: 'nav', content: <Navigation /> }]}>
  <Content />
</FeedLayout>
```

### Benefits

- Consistent sticky behavior across all pages
- Proper z-index management
- Mobile-friendly responsive design
- Reduced code duplication
- Easier maintenance and updates
