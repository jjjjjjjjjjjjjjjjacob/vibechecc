# Naming Conventions Learnings

## File Naming

### Web App Files (`apps/web/`)

- **Use `kebab-case`** for all files
- Examples: `user-profile.tsx`, `search-utils.ts`, `home-feed.tsx`
- This is the standard React/Next.js convention

### Convex Files (`apps/convex/`)

- **Use `camelCase`** for all files
- Examples: `userProfile.ts`, `searchUtils.ts`, `emojiRatings.ts`
- **CRITICAL**: Hyphens break Convex codegen - it cannot handle files with hyphens
- The Convex API generation expects camelCase filenames

## Type Naming Conventions

### Local Component Types

When defining types that are specific to a component, use the pattern `ComponentNameTypeName`:

```typescript
// ❌ BAD - Don't use underscore prefix
interface _Follower {
  user: User;
  followedAt: number;
}

// ✅ GOOD - Use component name prefix
interface FollowersModalFollower {
  user: User;
  followedAt: number;
}
```

### Why This Pattern?

1. **Clear ownership**: Immediately obvious which component the type belongs to
2. **No conflicts**: Avoids naming collisions with imported types
3. **Better search**: Easier to find all types related to a component
4. **TypeScript convention**: Aligns with TypeScript/JavaScript naming patterns
5. **No underscore**: Underscore prefix is uncommon in JS/TS and can conflict with linters

### Examples

```typescript
// For FollowersModal component
interface FollowersModalProps { ... }
interface FollowersModalFollower { ... }
interface FollowersModalState { ... }

// For UserProfileView component
interface UserProfileViewProps { ... }
interface UserProfileViewStats { ... }
interface UserProfileViewTab { ... }

// For SearchDropdown component
interface SearchDropdownProps { ... }
interface SearchDropdownResult { ... }
interface SearchDropdownFilter { ... }
```

## Common Pitfalls

1. **Don't mix naming styles** in the same directory
2. **Check Convex filenames** when creating new backend functions - must be camelCase
3. **Avoid generic names** like `Data`, `Info`, `Item` - be specific
4. **Don't abbreviate** unnecessarily - `UserProfileInformation` is better than `UsrProfInfo`

## Migration Notes

When refactoring existing code:

1. Update the type definition
2. Update all usages
3. Check imports/exports
4. Run typecheck to ensure no breaks
