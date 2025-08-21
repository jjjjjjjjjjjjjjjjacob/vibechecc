# Structural Remediation Implementation Plan

## Overview

This plan addresses structural maladies identified in the audit of `@apps/web/` and `@apps/convex/`. The implementation is divided into 4 phases with specific tasks, dependencies, and validation steps.

## Phase 1: File Naming Standardization

**Duration:** 1-2 days | **Priority:** 🔴 Critical | **Risk:** Low

### 1.1 Web App File Renames

#### Task: Rename PascalCase Components

**Files to rename:**

```bash
# From → To
apps/web/src/components/IconLink.tsx → apps/web/src/components/icon-link.tsx
apps/web/src/hooks/useOfflineIndicator.tsx → apps/web/src/hooks/use-offline-indicator.tsx
```

**Implementation Steps:**

1. **Verify no active usage:**

   ```bash
   grep -r "IconLink" apps/web/src --exclude-dir=node_modules
   grep -r "useOfflineIndicator" apps/web/src --exclude-dir=node_modules
   ```

2. **Execute renames:**

   ```bash
   git mv apps/web/src/components/IconLink.tsx apps/web/src/components/icon-link.tsx
   git mv apps/web/src/hooks/useOfflineIndicator.tsx apps/web/src/hooks/use-offline-indicator.tsx
   ```

3. **Update any remaining imports** (if found)

4. **Validation:**
   ```bash
   bun run typecheck
   bun run lint
   ```

### 1.2 Convex Backend File Renames

#### Task: Rename camelCase Files

**Files to rename:**

```bash
# From → To
apps/convex/convex/emojiMetadata.ts → apps/convex/convex/emoji-metadata.ts
apps/convex/convex/emojiRatings.ts → apps/convex/convex/emoji-ratings.ts
apps/convex/convex/emojiRatings.test.ts → apps/convex/convex/emoji-ratings.test.ts
apps/convex/convex/searchOptimized.ts → apps/convex/convex/search-optimized.ts
apps/convex/convex/cleanupSearchHistory.ts → apps/convex/convex/cleanup-search-history.ts
apps/convex/convex/debugSearchHistory.ts → apps/convex/convex/debug-search-history.ts
apps/convex/convex/users_auth_debug.test.ts → apps/convex/convex/users-auth-debug.test.ts
```

**Implementation Steps:**

1. **Check imports/references:**

   ```bash
   grep -r "emojiMetadata\|emojiRatings\|searchOptimized\|cleanupSearchHistory\|debugSearchHistory" apps/convex/convex --exclude-dir=node_modules
   ```

2. **Execute renames:**

   ```bash
   git mv apps/convex/convex/emojiMetadata.ts apps/convex/convex/emoji-metadata.ts
   git mv apps/convex/convex/emojiRatings.ts apps/convex/convex/emoji-ratings.ts
   git mv apps/convex/convex/emojiRatings.test.ts apps/convex/convex/emoji-ratings.test.ts
   git mv apps/convex/convex/searchOptimized.ts apps/convex/convex/search-optimized.ts
   git mv apps/convex/convex/cleanupSearchHistory.ts apps/convex/convex/cleanup-search-history.ts
   git mv apps/convex/convex/debugSearchHistory.ts apps/convex/convex/debug-search-history.ts
   git mv apps/convex/convex/users_auth_debug.test.ts apps/convex/convex/users-auth-debug.test.ts
   ```

3. **Update imports in files that reference renamed modules**

4. **Update Convex schema generation:**

   ```bash
   cd apps/convex && bun convex codegen
   ```

5. **Validation:**
   ```bash
   bun nx test @vibechecc/convex
   bun nx typecheck @vibechecc/convex
   ```

### 1.3 Phase 1 Completion Criteria

- [ ] All files follow kebab-case naming convention
- [ ] No broken imports remain
- [ ] All tests pass
- [ ] TypeScript compilation succeeds
- [ ] Convex codegen runs successfully

---

## Phase 2: Component Reorganization

**Duration:** 3-5 days | **Priority:** 🟡 Medium | **Risk:** Medium

### 2.1 Remove Orphaned Files

#### Task: Delete Confirmed Unused Files

**Files to remove:**

```bash
# Confirmed unused (verified no imports)
apps/web/src/components/icon-link.tsx
apps/web/src/hooks/use-offline-indicator.tsx
apps/convex/convex/cleanup-search-history.ts
apps/convex/convex/debug-search-history.ts
```

**Implementation Steps:**

1. **Final verification:**

   ```bash
   # Verify no imports exist
   grep -r "icon-link\|use-offline-indicator\|cleanup-search-history\|debug-search-history" . --exclude-dir=node_modules
   ```

2. **Remove files:**
   ```bash
   git rm apps/web/src/components/icon-link.tsx
   git rm apps/web/src/hooks/use-offline-indicator.tsx
   git rm apps/convex/convex/cleanup-search-history.ts
   git rm apps/convex/convex/debug-search-history.ts
   ```

### 2.2 Consolidate Duplicate Search Components

#### Task: Remove Legacy Emoji Search Component

**Remove:** `apps/web/src/features/ratings/components/emoji-search-command.tsx`
**Keep:** `apps/web/src/features/ratings/components/emoji-search-command-v2.tsx`

**Implementation Steps:**

1. **Verify usage patterns:**

   ```bash
   grep -r "emoji-search-command" apps/web/src --exclude="emoji-search-command-v2"
   ```

2. **Update imports to use v2:**

   ```bash
   # Find and replace all imports
   find apps/web/src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/emoji-search-command"/emoji-search-command-v2"/g'
   ```

3. **Remove legacy component:**

   ```bash
   git rm apps/web/src/features/ratings/components/emoji-search-command.tsx
   ```

4. **Rename v2 to standard name:**

   ```bash
   git mv apps/web/src/features/ratings/components/emoji-search-command-v2.tsx apps/web/src/features/ratings/components/emoji-search-command.tsx
   ```

5. **Update imports to remove v2 suffix:**
   ```bash
   find apps/web/src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/emoji-search-command-v2/emoji-search-command/g'
   ```

### 2.3 Move Misplaced Components

#### Task: Reorganize Search Components

**Moves required:**

```bash
# Search components to feature directory
apps/web/src/components/search-results-with-view-toggle.tsx → apps/web/src/features/search/components/
apps/web/src/components/tag-search-command.tsx → apps/web/src/features/search/components/
```

**Implementation Steps:**

1. **Check imports:**

   ```bash
   grep -r "search-results-with-view-toggle\|tag-search-command" apps/web/src
   ```

2. **Move files:**

   ```bash
   git mv apps/web/src/components/search-results-with-view-toggle.tsx apps/web/src/features/search/components/
   git mv apps/web/src/components/tag-search-command.tsx apps/web/src/features/search/components/
   ```

3. **Update import paths:**
   ```bash
   # Update relative imports to use new paths
   find apps/web/src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's|@/components/search-results-with-view-toggle|@/features/search/components/search-results-with-view-toggle|g'
   find apps/web/src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's|@/components/tag-search-command|@/features/search/components/tag-search-command|g'
   ```

### 2.4 Standardize Test Organization

#### Task: Adopt Co-located Testing Pattern

**Moves required:**

```bash
# Centralized tests → Co-located
apps/web/src/__tests__/routes/search.test.tsx → apps/web/src/routes/search.test.tsx
apps/web/src/__tests__/features/auth/ → apps/web/src/features/auth/components/
apps/web/src/features/search/__tests__/ → apps/web/src/features/search/components/
```

**Implementation Steps:**

1. **Move test files:**

   ```bash
   git mv apps/web/src/__tests__/routes/search.test.tsx apps/web/src/routes/search.test.tsx
   git mv apps/web/src/__tests__/features/auth/clerk-posthog-integration.test.tsx apps/web/src/features/auth/components/

   # Move search tests to components directory
   for file in apps/web/src/features/search/__tests__/*.test.tsx; do
     filename=$(basename "$file")
     git mv "$file" apps/web/src/features/search/components/"$filename"
   done
   ```

2. **Remove empty test directories:**

   ```bash
   rmdir apps/web/src/__tests__/routes
   rmdir apps/web/src/__tests__/features/auth
   rmdir apps/web/src/features/search/__tests__
   ```

3. **Update test imports if needed**

### 2.5 Backend File Organization

#### Task: Create Utilities Directory

**New structure:**

```bash
apps/convex/convex/utilities/
├── migration-helpers.ts
└── (future utility files)
```

**Implementation Steps:**

1. **Create utilities directory:**

   ```bash
   mkdir -p apps/convex/convex/utilities
   ```

2. **Create migration helpers file:**
   ```bash
   touch apps/convex/convex/utilities/migration-helpers.ts
   ```

### 2.6 Phase 2 Completion Criteria

- [ ] All orphaned files removed
- [ ] Duplicate components consolidated
- [ ] Components in correct feature directories
- [ ] Co-located test pattern adopted
- [ ] All imports updated correctly
- [ ] All tests pass
- [ ] TypeScript compilation succeeds

---

## Phase 3: Major Refactoring

**Duration:** 1-2 weeks | **Priority:** 🟢 Lower | **Risk:** High

### 3.1 Consolidate Search Implementation

#### Task: Choose Single Search Approach

**Decision:** Keep `search-optimized.ts`, remove `search.ts`

**Implementation Steps:**

1. **Analyze usage:**

   ```bash
   grep -r "searchAll\|searchAllOptimized" apps/web/src
   ```

2. **Update frontend to use optimized version:**

   ```bash
   find apps/web/src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/api\.search\.searchAll/api.search.searchAllOptimized/g'
   ```

3. **Rename optimized function to standard name:**
   - Edit `apps/convex/convex/search-optimized.ts`
   - Change `searchAllOptimized` → `searchAll`
   - Update exports

4. **Remove legacy search file:**

   ```bash
   git rm apps/convex/convex/search.ts
   ```

5. **Rename optimized file:**
   ```bash
   git mv apps/convex/convex/search-optimized.ts apps/convex/convex/search.ts
   ```

### 3.2 Break Down Monolithic Files

#### Task: Split Large Backend Files

**3.2.1 Seed File Refactoring**
**Target:** `apps/convex/convex/seed.ts` (2,120 lines)

**New structure:**

```bash
apps/convex/convex/seed/
├── index.ts (main seed functions)
├── data/
│   ├── users.ts
│   ├── vibes.ts
│   ├── tags.ts
│   └── emojis.ts
└── utils/
    └── seed-helpers.ts
```

**Implementation Steps:**

1. **Create directory structure:**

   ```bash
   mkdir -p apps/convex/convex/seed/data
   mkdir -p apps/convex/convex/seed/utils
   ```

2. **Extract user seeding logic:**
   - Create `apps/convex/convex/seed/data/users.ts`
   - Move user-related functions and data

3. **Extract vibe seeding logic:**
   - Create `apps/convex/convex/seed/data/vibes.ts`
   - Move vibe-related functions and data

4. **Extract tag seeding logic:**
   - Create `apps/convex/convex/seed/data/tags.ts`
   - Move tag-related functions and data

5. **Extract emoji seeding logic:**
   - Create `apps/convex/convex/seed/data/emojis.ts`
   - Move emoji-related functions and data

6. **Create main seed index:**
   - Create `apps/convex/convex/seed/index.ts`
   - Import and re-export main functions
   - Keep orchestration logic

7. **Create utilities:**
   - Create `apps/convex/convex/seed/utils/seed-helpers.ts`
   - Move shared utility functions

**3.2.2 Users File Refactoring**
**Target:** `apps/convex/convex/users.ts` (1,003 lines)

**New structure:**

```bash
apps/convex/convex/users/
├── index.ts (main exports)
├── authentication.ts
├── profile.ts
├── onboarding.ts
└── webhooks.ts
```

**Implementation Steps:**

1. **Create directory structure:**

   ```bash
   mkdir -p apps/convex/convex/users
   ```

2. **Extract authentication logic:**
   - Create `apps/convex/convex/users/authentication.ts`
   - Move auth-related functions

3. **Extract profile logic:**
   - Create `apps/convex/convex/users/profile.ts`
   - Move profile management functions

4. **Extract onboarding logic:**
   - Create `apps/convex/convex/users/onboarding.ts`
   - Move onboarding-related functions

5. **Extract webhook logic:**
   - Create `apps/convex/convex/users/webhooks.ts`
   - Move webhook handling functions

6. **Create main users index:**
   - Create `apps/convex/convex/users/index.ts`
   - Import and re-export all functions

### 3.3 Schema Organization

#### Task: Break Down Monolithic Schema

**Target:** `apps/convex/convex/schema.ts` (395 lines)

**New structure:**

```bash
apps/convex/convex/schema/
├── index.ts (main schema export)
├── users.ts
├── content.ts
├── analytics.ts
└── types.ts
```

**Implementation Steps:**

1. **Create directory structure:**

   ```bash
   mkdir -p apps/convex/convex/schema
   ```

2. **Extract user-related schema:**
   - Create `apps/convex/convex/schema/users.ts`
   - Move user, profile, auth tables

3. **Extract content-related schema:**
   - Create `apps/convex/convex/schema/content.ts`
   - Move vibes, ratings, tags, emojis tables

4. **Extract analytics schema:**
   - Create `apps/convex/convex/schema/analytics.ts`
   - Move search, analytics tables

5. **Extract shared types:**
   - Create `apps/convex/convex/schema/types.ts`
   - Move shared type definitions

6. **Create main schema index:**
   - Create `apps/convex/convex/schema/index.ts`
   - Import and combine all schemas
   - Export unified schema

### 3.4 Phase 3 Completion Criteria

- [ ] Single search implementation chosen and integrated
- [ ] Seed file broken into logical modules
- [ ] Users file split by functionality
- [ ] Schema organized by domain
- [ ] All imports updated correctly
- [ ] All tests pass
- [ ] Database schema migrations work correctly
- [ ] No breaking changes to API

---

## Phase 4: Quality Improvements

**Duration:** 3-5 days | **Priority:** 🟢 Lower | **Risk:** Low

### 4.0 Theme Color Standardization

#### Task: Replace Hardcoded Colors with Theme Variables

**Priority:** 🔴 Critical | **Risk:** Low

**Files with hardcoded colors to fix:**

##### Tailwind Color Classes (bg-_, text-_, border-\*)

```bash
# Critical violations - using specific color values
apps/web/src/routes/vibes/$vibeId/edit.tsx
  - Line 314, 320, 327: text-green-500 → theme-success or theme-primary
  - Line 357: text-orange-500 → theme-warning
  - Lines 409-414: border-pink-500, border-red-500, border-green-500 → theme-primary, theme-destructive, theme-success
  - Lines 422, 431, 465, 475: text-red-500, text-orange-500 → theme-destructive, theme-warning
  - Line 533: border-orange-200, bg-orange-50, text-orange-700 → theme-warning variants

apps/web/src/routes/vibes/create.tsx
  - Lines 150-151: border-purple-500 → theme-primary
  - Lines 176-177: border-pink-500 → theme-secondary

apps/web/src/routes/admin/index.tsx
  - Lines 637-655: text-green-600, text-blue-600, text-yellow-600, text-purple-600 → theme colors

apps/web/src/components/not-found.tsx
  - Line 7: text-gray-600, text-gray-400 → text-muted-foreground
  - Line 13: bg-emerald-500 → bg-theme-primary
  - Line 19: bg-cyan-600 → bg-theme-secondary

apps/web/src/components/save-button.tsx
  - Line 16: bg-blue-500 → bg-theme-primary

apps/web/src/components/cancel-button.tsx
  - Line 13: hover:bg-slate-200, focus:bg-slate-200 → hover:bg-muted, focus:bg-muted

apps/web/src/components/IconLink.tsx
  - Line 13: text-slate-500 → text-muted-foreground

apps/web/src/components/editable-text.tsx
  - Line 82: text-slate-400 → text-muted-foreground

apps/web/src/features/onboarding/components/onboarding-discover-step.tsx
  - Lines 329, 340: text-red-500, text-blue-500 → theme colors
  - Lines 383-384: border-green-500, bg-green-500, text-green-700 → theme-success variants

apps/web/src/features/profiles/components/user-profile-view.tsx
  - Lines 305, 556, 621-623, 686, 864: fill-yellow-300, fill-yellow-400, text-yellow-400 → theme-warning or custom star color variable

apps/web/src/features/ratings/components/star-rating.tsx
  - Lines 109, 112: text-purple-400, text-purple-500, hover:text-purple-300 → theme-primary variants

apps/web/src/styles/app.css
  - Lines 800-808, 839: bg-gray-900, bg-gray-800, text-gray-400, text-red-500 → CSS variables
```

##### Hex Colors

```bash
apps/web/src/lib/basic-emojis.ts
  - Lines 3-22: Hardcoded hex colors (#FFD700, #FF69B4, etc.)
  - Note: These may be exceptions as they're emoji-specific colors

apps/web/src/utils/theme-color-extractor.ts
  - Lines 78, 94, 129, 141, 150: Fallback colors (#000000, rgba(0,0,0))
  - Note: These are fallback values and may be acceptable
```

##### HSL Usage (Acceptable - Using CSS Variables)

```bash
apps/web/src/routes/search.tsx
  - Line 533: to-[hsl(var(--theme-primary))]/10 → CORRECT usage

apps/web/src/routes/discover.tsx
  - Lines 138, 233, 250, 566: Using hsl(var(--theme-primary)) → CORRECT usage
```

**Implementation Steps:**

1. **Create theme color mapping guide:**

   ```typescript
   // Color replacements mapping
   const colorMappings = {
     // Status colors
     'green-*': 'theme-success',
     'red-*': 'theme-destructive',
     'orange-*': 'theme-warning',
     'yellow-*': 'theme-warning',

     // Primary colors
     'blue-*': 'theme-primary',
     'purple-*': 'theme-primary',
     'pink-*': 'theme-secondary',

     // Neutral colors
     'gray-*': 'muted-foreground or background',
     'slate-*': 'muted or muted-foreground',

     // Special cases
     'emerald-*': 'theme-primary',
     'cyan-*': 'theme-secondary',
   };
   ```

2. **Batch update files:**
   - Group by color type (status, primary, neutral)
   - Test each change in light and dark modes
   - Verify visual consistency

3. **Add CSS variables for special cases:**

   ```css
   /* For star ratings - add to app.css */
   --star-rating-filled: hsl(var(--theme-warning));
   --star-rating-empty: hsl(var(--muted));
   ```

4. **Document exceptions:**
   - `basic-emojis.ts` - emoji-specific colors (may keep)
   - `theme-color-extractor.ts` - fallback values (acceptable)
   - Brand logos or third-party requirements

5. **Validation:**

   ```bash
   # Check for remaining violations
   grep -r "text-\(red\|blue\|green\|yellow\|purple\|pink\|orange\|gray\|slate\)-[0-9]" apps/web/src
   grep -r "bg-\(red\|blue\|green\|yellow\|purple\|pink\|orange\|gray\|slate\)-[0-9]" apps/web/src
   grep -r "border-\(red\|blue\|green\|yellow\|purple\|pink\|orange\|gray\|slate\)-[0-9]" apps/web/src

   # Visual testing
   bun run dev
   # Test in light and dark modes
   # Test with different theme presets
   ```

### 4.0 Phase 4.0 Completion Criteria

- [ ] All hardcoded Tailwind color classes replaced with theme variables
- [ ] CSS variables added for special cases (star ratings, etc.)
- [ ] Visual consistency maintained across light/dark modes
- [ ] Exceptions documented in `.agent/rules/theme-colors.mdc`
- [ ] No regression in UI appearance

### 4.1 Create Barrel Exports

#### Task: Add Consistent Index Files

**Add index.ts files to:**

```bash
apps/web/src/features/search/components/index.ts
apps/web/src/features/ratings/components/index.ts
apps/web/src/features/profiles/components/index.ts
apps/web/src/features/notifications/components/index.ts
apps/web/src/features/follows/components/index.ts
apps/web/src/features/vibes/components/index.ts
apps/web/src/features/theming/components/index.ts
apps/web/src/features/admin/components/index.ts
apps/web/src/features/auth/components/index.ts
apps/web/src/features/onboarding/components/index.ts
```

**Implementation Steps:**

1. **Create barrel export files:**

   ```bash
   # For each feature directory
   for feature in search ratings profiles notifications follows vibes theming admin auth onboarding; do
     echo "// Export all components from this feature" > apps/web/src/features/$feature/components/index.ts

     # Auto-generate exports
     for file in apps/web/src/features/$feature/components/*.tsx; do
       if [[ -f "$file" && "$(basename "$file")" != "index.tsx" ]]; then
         component=$(basename "$file" .tsx)
         echo "export { default as $component } from './$component';" >> apps/web/src/features/$feature/components/index.ts
       fi
     done
   done
   ```

2. **Update imports to use barrel exports:**
   ```bash
   # Replace individual imports with barrel imports where beneficial
   # This step requires manual review and selective application
   ```

### 4.2 Establish Architecture Patterns

#### Task: Document and Enforce Patterns

**Create documentation:**

```bash
.agent/docs/architecture-patterns.mdc
.agent/docs/component-organization.mdc
.agent/docs/testing-patterns.mdc
```

**Implementation Steps:**

1. **Document feature-based organization:**
   - Create guidelines for component placement
   - Define feature boundary rules

2. **Document testing patterns:**
   - Establish co-located testing standard
   - Define test naming conventions

3. **Document import/export patterns:**
   - Define barrel export usage guidelines
   - Establish import path conventions

### 4.3 Phase 4 Completion Criteria

- [ ] All features have barrel exports
- [ ] Architecture documentation created
- [ ] Import patterns standardized
- [ ] Development guidelines documented
- [ ] All tests pass
- [ ] No performance regressions

---

## Implementation Timeline & Dependencies

### Critical Path

1. **Phase 1** (1-2 days) → **Phase 2** (3-5 days) → **Phase 3** (1-2 weeks) → **Phase 4** (3-5 days)
2. **Total Duration:** 2-3 weeks
3. **Dependencies:**
   - Phase 2 depends on Phase 1 completion
   - Phase 3 can be done in parallel sub-tasks
   - Phase 4 depends on Phase 3 completion

### Risk Mitigation

- **Phase 1 & 2:** Low risk, mostly file moves
- **Phase 3:** High risk, requires careful testing
- **Phase 4:** Low risk, additive changes

### Validation Checkpoints

- After each phase: Run full test suite
- After Phase 3: Manual integration testing
- After Phase 4: Performance validation

### Rollback Plan

- Each phase is a separate git commit
- Can rollback individual phases if issues arise
- Maintain detailed change log for tracking

## Success Metrics

- [ ] 100% kebab-case file naming compliance
- [ ] Zero orphaned/unused files
- [ ] Zero duplicate functionality
- [ ] Consistent test organization (100% co-located)
- [ ] Logical feature-based component organization
- [ ] Maintainable file sizes (< 500 lines per file)
- [ ] Clear architectural boundaries
- [ ] Comprehensive barrel exports

## Next Steps

1. Review and approve implementation plan
2. Create feature branch for Phase 1
3. Execute Phase 1 tasks
4. Validate Phase 1 completion
5. Proceed to Phase 2
