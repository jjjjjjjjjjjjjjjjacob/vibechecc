# Emoji Reactions UI Test

## Summary of Changes

I've updated the emoji reaction UI to match the design in your screenshot:

### Visual Changes:
1. **Circular buttons**: Changed from pill-shaped to perfect circles (48x48px)
2. **Consistent sizing**: All emoji buttons and add button are the same size
3. **Border styling**: 
   - Selected reactions have a primary color border
   - Unselected have transparent borders that show on hover
4. **Theme-aware colors**: Using `bg-secondary/50` and hover states
5. **Improved spacing**: Changed from `gap-1` to `gap-2` for better visual separation
6. **Hover effects**: Scale on hover and show reaction count in a tooltip below

### Behavior Changes:
1. **Clicking emoji reactions now opens the rating popover** with that emoji pre-selected
2. **Reactions no longer increment directly** - users must write a review
3. **All ratings in seed data now have reviews** to match the new requirement

## Testing Instructions:

1. Navigate to any vibe detail page
2. Look at the emoji reactions section
3. Verify:
   - Reactions appear as circular buttons
   - Hover shows the count below the emoji
   - Clicking a reaction opens the rating popover with that emoji pre-selected
   - The "+" button opens the emoji picker
   - Selected reactions have a visible border

## Code Files Modified:
- `/apps/web/src/components/emoji-reaction.tsx` - Updated UI styling
- `/apps/web/src/routes/vibes/$vibeId.tsx` - Changed reaction behavior
- `/apps/convex/convex/seed.ts` - Updated to ensure all ratings have reviews