# Agent Prompts for Search Implementation

## Agent 1: Integration & Real-time Search

**Prompt:**
```
You are Agent 1. Please execute your role in the implementation-plan.mdc for the vibechecc project.

Your mission is to connect the frontend search components to the Convex backend and implement real-time search features.

Key responsibilities:
1. Frontend-Backend Integration:
   - Replace all mock data with Convex queries
   - Implement 300ms debouncing for search input
   - Add comprehensive error handling and loading states
   - Track search events when results are viewed/clicked

2. Real-time Search Features:
   - Create instant search preview overlay
   - Implement search-as-you-type functionality
   - Add recent searches with localStorage persistence
   - Implement prefetch on hover for perceived performance

Start by reading the implementation-plan.mdc for your full scope and checklist. The backend functions are already created in apps/convex/convex/search.ts and frontend components exist but use mock data.

Test your changes with `bun run dev` and ensure the command palette (Cmd+K) works with real data. Update the implementation plan as you complete each task.
```

---

## Agent 2: Advanced Search & Filters

**Prompt:**
```
You are Agent 2. Please execute your role in the implementation-plan.mdc for the vibechecc project.

Your mission is to enhance the backend search with advanced features and create fully interactive filter UI components.

Key responsibilities:
1. Backend Search Enhancements:
   - Implement fuzzy matching for typo tolerance (Levenshtein distance)
   - Create advanced relevance scoring system
   - Add search operators support (quotes for exact, minus for exclusion)
   - Optimize search query performance

2. Interactive Filter UI:
   - Build enhanced filter components that sync with URL
   - Create tag filter with autocomplete search
   - Add rating range slider (0-5 stars)
   - Implement date range picker with presets
   - Build active filters bar and mobile drawer

Start by reading the implementation-plan.mdc for your full scope and checklist. Basic search exists but needs fuzzy matching and better scoring. Basic filter components exist but need full interactivity.

Ensure search handles typos, special characters, and filters update URLs for shareable searches. Update the implementation plan as you progress.
```

---

## Agent 3: Testing & Polish

**Prompt:**
```
You are Agent 3. Please execute your role in the implementation-plan.mdc for the vibechecc project.

Your mission is to implement comprehensive testing, basic analytics, and polish the search experience.

Key responsibilities:
1. Testing Suite:
   - Write component tests for all search UI components
   - Create integration tests for the full search flow
   - Test backend search functions with edge cases
   - Add performance benchmarks (< 200ms requirement)

2. Analytics & Monitoring:
   - Implement basic search metrics tracking
   - Track popular search terms
   - Monitor search performance
   - Add error tracking for failed searches

3. Polish & Optimization:
   - Improve loading states with skeletons
   - Enhance empty states with suggestions
   - Ensure keyboard accessibility throughout
   - Optimize performance and bundle size

Start by reading the implementation-plan.mdc for your full scope and checklist. Use Vitest for frontend tests and convex-test for backend. Ensure > 80% test coverage.

Run `bun run quality` to verify all checks pass. Update the implementation plan as you complete tasks.
```

---

## Quick Reference for All Agents

### Starting Instructions
1. Read `/implementation-plan.mdc` for your complete scope
2. Check existing code before creating new files
3. Follow established patterns in the codebase
4. Test changes with `bun run dev`
5. Run `bun run quality` before marking complete

### Coordination
- All agents can work in parallel
- Agent 1 should prioritize hook updates first
- Update the implementation plan as you progress
- Note any API changes that affect other agents
- If you need new types, add to `packages/types/src/search.ts`

### Success Criteria
- Search works end-to-end with real data
- Fuzzy matching handles typos gracefully
- Filters are fully interactive and mobile-friendly
- All tests pass with good coverage
- Search responds in < 200ms
- Analytics track key metrics