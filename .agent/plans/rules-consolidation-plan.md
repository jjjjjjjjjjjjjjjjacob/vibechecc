# Rules Consolidation Plan for vibechecc

## Critical Issues Found

### 1. **MAJOR**: File Naming Convention Contradiction

- **Problem**: CLAUDE.md and .agent/rules.md incorrectly state "kebab-case for all files"
- **Reality**: Backend uses camelCase (required for Convex codegen)
- **Fix**: Update main rules to match .agent/docs/naming-conventions-learnings.md

### 2. **Redundancy**: Theme Color Rules Scattered Across 4 Files

- **Problem**: Same shadcn/ui import rules repeated in CLAUDE.md, .agent/rules.md, plus comprehensive theme rules in separate files
- **Fix**: Consolidate into single authoritative source

### 3. **Gaps**: Missing Documentation for Consistent Patterns

- **Problem**: 15+ consistent patterns used throughout codebase but not documented
- **Examples**: Auth guard patterns, animation delays, testing structures
- **Fix**: Document key patterns that prevent errors

## Consolidation Strategy

### Phase 1: Fix Critical Contradictions

- [x] **Correct file naming rules** in CLAUDE.md and .agent/rules.md
- [x] **Update style-guide-enforcement.md** plan (currently has wrong backend naming assumptions)
- [x] **Create import pattern reference** distinguishing @/ vs @vibechecc/ usage

### Phase 2: Eliminate Redundancy

- [x] **Consolidate theme color rules** into single source
- [x] **Remove duplicate shadcn/ui restrictions** from multiple files
- [ ] **Merge scattered testing guidance** into coherent patterns

### Phase 3: Document Missing Patterns

- [x] **Add authentication patterns** (auth guard, mock identity structure)
- [x] **Document animation patterns** (data attributes, staggered delays)
- [ ] **Formalize testing structures** (frontend/backend test organization)
- [x] **Add performance patterns** (will-change-transform, memoization strategies)

### Phase 4: Streamline for Context Efficiency

- [x] **Create hierarchical rule structure** (core rules vs detailed guides)
- [x] **Use cross-references** instead of duplication
- [x] **Optimize for AI assistant consumption** (clear, actionable rules)
- [x] **Remove all redundant/obsolete/contradictory/broken rules**

### Phase 5: COMPLETED - Cleanup Consolidation ✅

- [x] **Removed ~20 consolidated learning files** from .agent/rules/ and .agent/docs/
- [x] **Removed obsolete hierarchical structure files** (rules-detailed.md, rules-implementation.md, rules-index.md)
- [x] **Created staging directory** (.agent/docs/learnings-staging) for future learnings
- [x] **Preserved workspace documentation** (devops-learnings.md, web-learnings.md, etc.)

## Expected Outcomes

- **Eliminate contradictions** causing implementation errors
- **Reduce context usage** by ~30% through consolidation
- **Improve developer onboarding** with documented implicit practices
- **Prevent security issues** with clear auth patterns
- **Maintain consistency** through formalized conventions

## Detailed Findings

### File Naming Convention Analysis

- **Frontend (apps/web/)**: 100% kebab-case compliance ✅
- **Backend (apps/convex/)**: Uses camelCase for files like:
  - `emojiRatings.ts`
  - `emojiMetadata.ts`
  - `searchOptimized.ts`
  - `debugSearchHistory.ts`

### Theme Color Rule Locations

1. **CLAUDE.md** (lines 113-116): Basic shadcn/ui import restrictions
2. **`.agent/rules.md`** (lines 82-85): Identical shadcn/ui import restrictions
3. **`.agent/rules/theme-colors.mdc`**: Comprehensive theme color rules (consolidated into hierarchy)
4. **`.agent/docs/web-learnings.md`**: Partial theme color patterns (lines 707-725)

### Undocumented Patterns Found

#### Frontend Patterns

- **Auth guard pattern**: `if (!user) { setShowAuthDialog(true); return; }`
- **Animation delays**: `style={{ animationDelay: \`\${index \* 0.02}s\` }}`
- **Data attributes**: `data-has-mounted={hasInitialized}`
- **Performance optimization**: `will-change-transform` with hover effects

#### Backend Patterns

- **Test authentication**: Consistent mock identity structure
- **Error handling**: Try-catch with type checking using `in` operator
- **Function organization**: By domain, not by type

#### Testing Patterns

- **Frontend structure**: Consistent mock setup and wrapper patterns
- **Backend authentication**: User creation before authenticated function tests

### Import Pattern Clarification Needed

- **Local aliases**: `@/` for same-workspace imports
- **Workspace packages**: `@vibechecc/types`, `@vibechecc/utils` etc.
- **Backend patterns**: Relative imports + workspace packages

## Action Items

### Immediate (Critical)

1. Fix file naming contradiction in main documentation files
2. Update style-guide-enforcement.md plan assumptions
3. Create authoritative import pattern guide

### Short-term (Consolidation)

4. Merge theme color rules into single location
5. Remove redundant shadcn/ui restrictions
6. Consolidate testing guidance

### Medium-term (Enhancement)

7. Document authentication patterns formally
8. Add animation and performance pattern guides
9. Create hierarchical rule structure for better organization

This plan will transform the current fragmented rule system into a coherent, accurate, and efficient documentation structure that matches the actual codebase practices.
