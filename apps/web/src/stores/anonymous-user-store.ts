import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AnonymousAction {
  id: string;
  type:
    | 'vibe_view'
    | 'vibe_like'
    | 'rating_attempt'
    | 'follow_attempt'
    | 'search';
  targetId: string;
  data?: Record<string, unknown>;
  timestamp: number;
}

export interface CtaInteraction {
  ctaId: string;
  context: string;
  placement: string;
  timestamp: number;
  action: 'impression' | 'click' | 'dismiss';
}

interface ABTestAssignment {
  testId: string;
  variant: string;
  assignedAt: number;
}

interface AnonymousUserState {
  // Anonymous session tracking
  sessionId: string;
  sessionStartTime: number;

  // User actions before signup
  actions: AnonymousAction[];

  // CTA tracking
  ctaInteractions: CtaInteraction[];
  dismissedCtas: Set<string>;
  lastCtaShownAt: number;

  // Engagement metrics
  vibesViewed: number;
  searchesPerformed: number;
  timeSpentOnSite: number;

  // A/B testing
  abTestAssignments: ABTestAssignment[];

  // Private mode token for carryover
  privateToken: string | null;

  // Actions
  initializeSession: () => void;
  addAction: (action: Omit<AnonymousAction, 'id' | 'timestamp'>) => void;
  recordCtaInteraction: (
    interaction: Omit<CtaInteraction, 'timestamp'>
  ) => void;
  dismissCta: (ctaId: string) => void;
  shouldShowCta: (ctaId: string, context: string) => boolean;
  assignAbTest: (testId: string, variants: string[]) => string;
  getAbTestVariant: (testId: string) => string | null;
  setPrivateToken: (token: string) => void;
  clearPrivateToken: () => void;
  getCarryoverData: () => {
    actions: AnonymousAction[];
    sessionData: {
      sessionId: string;
      vibesViewed: number;
      searchesPerformed: number;
      timeSpentOnSite: number;
    };
  };
  clearSession: () => void;
  performCleanup: () => void;
}

// Generate a unique session ID
const generateSessionId = () => {
  return `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Generate a unique action ID
const generateActionId = () => {
  return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Storage limits to prevent quota issues
const MAX_ACTIONS = 50; // Keep last 50 actions
const MAX_CTA_INTERACTIONS = 20; // Keep last 20 CTA interactions
const MAX_AGE_DAYS = 7; // Remove data older than 7 days

// Helper function to clean old data
const cleanupOldData = (state: AnonymousUserState) => {
  const now = Date.now();
  const maxAge = MAX_AGE_DAYS * 24 * 60 * 60 * 1000; // 7 days in ms

  // Remove old actions and keep only the most recent ones
  const validActions = state.actions
    .filter((action) => now - action.timestamp < maxAge)
    .slice(-MAX_ACTIONS); // Keep only the last MAX_ACTIONS

  // Remove old CTA interactions
  const validCtaInteractions = state.ctaInteractions
    .filter((interaction) => now - interaction.timestamp < maxAge)
    .slice(-MAX_CTA_INTERACTIONS); // Keep only the last MAX_CTA_INTERACTIONS

  // Remove old AB test assignments (older than 30 days)
  const validAbTests = state.abTestAssignments.filter(
    (assignment) => now - assignment.assignedAt < 30 * 24 * 60 * 60 * 1000
  );

  return {
    ...state,
    actions: validActions,
    ctaInteractions: validCtaInteractions,
    abTestAssignments: validAbTests,
  };
};

export const useAnonymousUserStore = create<AnonymousUserState>()(
  persist(
    (set, get) => ({
      sessionId: '',
      sessionStartTime: 0,
      actions: [],
      ctaInteractions: [],
      dismissedCtas: new Set(),
      lastCtaShownAt: 0,
      vibesViewed: 0,
      searchesPerformed: 0,
      timeSpentOnSite: 0,
      abTestAssignments: [],
      privateToken: null,

      initializeSession: () => {
        const now = Date.now();
        set({
          sessionId: generateSessionId(),
          sessionStartTime: now,
          actions: [],
          ctaInteractions: [],
          dismissedCtas: new Set(),
          lastCtaShownAt: 0,
          vibesViewed: 0,
          searchesPerformed: 0,
          timeSpentOnSite: 0,
          abTestAssignments: [],
        });
      },

      addAction: (actionData) => {
        const action: AnonymousAction = {
          ...actionData,
          id: generateActionId(),
          timestamp: Date.now(),
        };

        set((state) => {
          // Clean up old data before adding new action
          const cleanedState = cleanupOldData(state);

          // Add new action with size limit
          const updatedActions = [...cleanedState.actions, action].slice(
            -MAX_ACTIONS
          );

          return {
            ...cleanedState,
            actions: updatedActions,
            vibesViewed:
              action.type === 'vibe_view'
                ? cleanedState.vibesViewed + 1
                : cleanedState.vibesViewed,
            searchesPerformed:
              action.type === 'search'
                ? cleanedState.searchesPerformed + 1
                : cleanedState.searchesPerformed,
          };
        });
      },

      recordCtaInteraction: (interactionData) => {
        const interaction: CtaInteraction = {
          ...interactionData,
          timestamp: Date.now(),
        };

        set((state) => {
          // Clean up old data before adding new interaction
          const cleanedState = cleanupOldData(state);

          // Add new interaction with size limit
          const updatedCtaInteractions = [
            ...cleanedState.ctaInteractions,
            interaction,
          ].slice(-MAX_CTA_INTERACTIONS);

          return {
            ...cleanedState,
            ctaInteractions: updatedCtaInteractions,
            lastCtaShownAt:
              interaction.action === 'impression'
                ? Date.now()
                : cleanedState.lastCtaShownAt,
          };
        });
      },

      dismissCta: (ctaId) => {
        set((state) => ({
          dismissedCtas: new Set([...state.dismissedCtas, ctaId]),
        }));
      },

      shouldShowCta: (ctaId, context) => {
        const state = get();

        // Don't show if dismissed
        if (state.dismissedCtas.has(ctaId)) {
          return false;
        }

        // Rate limiting: don't show CTAs too frequently
        const timeSinceLastCta = Date.now() - state.lastCtaShownAt;
        const minInterval = 30000; // 30 seconds minimum between CTAs

        if (timeSinceLastCta < minInterval) {
          return false;
        }

        // Context-specific logic
        switch (context) {
          case 'after_vibe_views':
            return state.vibesViewed >= 3;
          case 'after_interaction_attempt':
            return state.actions.some(
              (a) => a.type === 'rating_attempt' || a.type === 'follow_attempt'
            );
          case 'scroll_engagement':
            return state.vibesViewed >= 5;
          default:
            return true;
        }
      },

      assignAbTest: (testId, variants) => {
        const state = get();

        // Check if already assigned
        const existing = state.abTestAssignments.find(
          (a) => a.testId === testId
        );
        if (existing) {
          return existing.variant;
        }

        // Assign variant based on session ID for consistency
        const hash = state.sessionId.split('').reduce((a, b) => {
          a = (a << 5) - a + b.charCodeAt(0);
          return a & a;
        }, 0);

        const variantIndex = Math.abs(hash) % variants.length;
        const variant = variants[variantIndex];

        const assignment: ABTestAssignment = {
          testId,
          variant,
          assignedAt: Date.now(),
        };

        set((state) => ({
          abTestAssignments: [...state.abTestAssignments, assignment],
        }));

        return variant;
      },

      getAbTestVariant: (testId) => {
        const state = get();
        const assignment = state.abTestAssignments.find(
          (a) => a.testId === testId
        );
        return assignment?.variant || null;
      },

      setPrivateToken: (token) => {
        set({ privateToken: token });
      },

      clearPrivateToken: () => {
        set({ privateToken: null });
      },

      getCarryoverData: () => {
        const state = get();
        return {
          actions: state.actions,
          sessionData: {
            sessionId: state.sessionId,
            vibesViewed: state.vibesViewed,
            searchesPerformed: state.searchesPerformed,
            timeSpentOnSite: Date.now() - state.sessionStartTime,
          },
        };
      },

      clearSession: () => {
        set({
          sessionId: '',
          sessionStartTime: 0,
          actions: [],
          ctaInteractions: [],
          dismissedCtas: new Set(),
          lastCtaShownAt: 0,
          vibesViewed: 0,
          searchesPerformed: 0,
          timeSpentOnSite: 0,
          abTestAssignments: [],
          privateToken: null,
        });
      },

      // Manual cleanup method for emergency use
      performCleanup: () => {
        set((state) => cleanupOldData(state));
      },
    }),
    {
      name: 'anonymous-user-store',
      partialize: (state) => ({
        sessionId: state.sessionId,
        sessionStartTime: state.sessionStartTime,
        actions: state.actions,
        ctaInteractions: state.ctaInteractions,
        dismissedCtas: Array.from(state.dismissedCtas),
        lastCtaShownAt: state.lastCtaShownAt,
        vibesViewed: state.vibesViewed,
        searchesPerformed: state.searchesPerformed,
        timeSpentOnSite: state.timeSpentOnSite,
        abTestAssignments: state.abTestAssignments,
        privateToken: state.privateToken,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Convert array back to Set after rehydration
          state.dismissedCtas = new Set(
            state.dismissedCtas as unknown as string[]
          );

          // Perform cleanup on storage rehydration to remove old data
          const cleanedState = cleanupOldData(state);
          Object.assign(state, cleanedState);

          // Initialize session if it doesn't exist
          if (!state.sessionId) {
            state.initializeSession();
          }
        }
      },
    }
  )
);
