# Frontend (apps/web) Development Learnings

## Component Development

### Emoji Rating System Implementation

**When to reference**: Building interactive rating/feedback components

- Use framer-motion for smooth animations (already a dependency)
- EmojiRatingDisplay component now has single mode (removed expanded mode)
- Always provide fallback to existing systems (e.g., star ratings)
- Required fields (like review text) improve content quality
- Use `showScale` prop to toggle between simple display and full 5-emoji scale

**Code pattern**:

```tsx
// Compact display mode
<div className="flex items-center gap-1">
  <span>{emoji}</span>
  <span>{rating}/5</span>
</div>

// Expanded mode with animations
<motion.div
  whileHover={{ scale: 1.05 }}
  transition={{ type: "spring", stiffness: 300 }}
>
  {/* content */}
</motion.div>
```

### Circular Button Design

**When to reference**: Creating emoji reactions or similar UI elements

- Use fixed dimensions (48x48px) for consistency
- Apply theme-aware colors with `bg-secondary/50`
- Show/hide borders on selection state
- Include hover scale effects for interactivity

### Accordion Implementation

**When to reference**: Displaying expandable lists with more than 3 items

- Use shadcn/ui Accordion component from `@/components/ui/accordion`
- Show first 3 items always visible
- Use `{n} more` pattern for accordion trigger
- Add CSS animations for smooth expand/collapse:
  ```css
  @keyframes accordion-down {
    from {
      height: 0;
    }
    to {
      height: var(--radix-accordion-content-height);
    }
  }
  ```
- Keep accordion trigger text small and subtle (`text-xs text-muted-foreground`)

### Popover Integration

**When to reference**: Building interactive overlays

- Use radix-ui popover (via shadcn/ui)
- Pre-select values when opening from existing data
- Handle both creation and editing in same component
- Align popover to avoid viewport edges

## State Management

### Real-time Updates with Convex

**When to reference**: Implementing features that need live updates

- Use hooks from `src/queries.ts` for consistency
- Convex queries automatically subscribe to changes
- No need for manual WebSocket management
- Optimistic updates handled by Convex mutations

### Form State

**When to reference**: Building forms with complex validation

- Use React Hook Form for form management
- Integrate with zod for schema validation
- Show validation errors inline
- Disable submit during mutation

## Testing Patterns

### Component Testing

**When to reference**: Writing tests for UI components

- Always include `/// <reference lib="dom" />` at the top
- Use `@testing-library/react` queries
- Test user interactions, not implementation
- Mock Convex hooks when needed

## Performance Optimizations

### Image Loading

**When to reference**: Displaying user avatars or emoji

- Use native lazy loading for images
- Provide width/height to prevent layout shift
- Consider using CSS for simple shapes
- Cache emoji data in a central store

### List Rendering

**When to reference**: Displaying large lists of items

- Implement virtualization for lists > 50 items
- Use proper React keys for list items
- Memoize expensive computations
- Consider pagination as alternative

## Common Gotchas

### TanStack Router

**When to reference**: Adding new routes

- File-based routing in `src/routes/`
- Use `$` prefix for dynamic segments
- Nested routes inherit parent layouts
- Route components must be default exports

### Tailwind CSS v4

**When to reference**: Styling components

- Import styles via `@import` in CSS files
- Use CSS variables for theme colors
- Tailwind v4 uses native CSS features
- No need for `tailwind.config.js`

### Workspace Imports

**When to reference**: Importing from shared packages

- Use `@viberater/types` for shared TypeScript types
- Use `@viberater/utils` for shared utilities
- Use `@viberater/convex` for API imports
- Never use relative imports across workspace boundaries

## React Query with Convex Integration

**When to reference**: Using `convexQuery` with `useQuery`

### Correct Usage Pattern

- Always spread the convexQuery result into useQuery options object
- The convexQuery helper returns a configuration object, not a direct query function

```typescript
// ❌ Wrong - causes TypeError: client.defaultQueryOptions is not a function
const result = useQuery(convexQuery(api.emojis.search, { searchTerm }));

// ✅ Correct - spread the convexQuery result
const result = useQuery({
  ...convexQuery(api.emojis.search, { searchTerm }),
});

// ✅ With additional options
const result = useQuery({
  ...convexQuery(api.emojis.search, { searchTerm }),
  enabled: !!searchTerm,
});
```

**Context**: This error occurs because convexQuery returns an object with query configuration that needs to be spread into useQuery's options parameter. This pattern is consistent throughout the codebase as seen in `src/queries.ts`.
