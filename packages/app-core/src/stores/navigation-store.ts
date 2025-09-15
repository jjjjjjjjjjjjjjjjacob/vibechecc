import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createStorage } from './storage';

// Navigation state types
export interface NavigationState {
  // Current navigation state
  currentRoute: string;
  previousRoute: string | null;
  routeParams: Record<string, any>;

  // Navigation history
  history: NavigationHistoryItem[];
  canGoBack: boolean;
  canGoForward: boolean;

  // Tab state (mobile)
  activeTab: string;
  tabHistory: Record<string, string[]>; // Track history per tab

  // Modal/Sheet state
  modals: ModalState[];
  sheets: SheetState[];

  // Deep linking
  pendingDeepLink: string | null;
  deepLinkHandled: boolean;

  // Breadcrumbs (web)
  breadcrumbs: BreadcrumbItem[];

  // Loading states
  navigationLoading: boolean;
  routeLoading: Record<string, boolean>;
}

export interface NavigationHistoryItem {
  route: string;
  params: Record<string, any>;
  timestamp: number;
  title?: string;
}

export interface ModalState {
  id: string;
  component: string;
  props?: Record<string, any>;
  isOpen: boolean;
  canDismiss: boolean;
}

export interface SheetState {
  id: string;
  component: string;
  props?: Record<string, any>;
  isOpen: boolean;
  snapPoints: number[];
  currentSnap?: number;
}

export interface BreadcrumbItem {
  label: string;
  route: string;
  params?: Record<string, any>;
}

export interface NavigationActions {
  // Navigation actions
  navigate: (route: string, params?: Record<string, any>) => void;
  goBack: () => void;
  goForward: () => void;
  replace: (route: string, params?: Record<string, any>) => void;
  reset: (routes: Array<{ route: string; params?: Record<string, any> }>) => void;

  // Tab actions (mobile)
  setActiveTab: (tab: string) => void;
  navigateInTab: (tab: string, route: string, params?: Record<string, any>) => void;
  resetTab: (tab: string, route: string, params?: Record<string, any>) => void;

  // Modal actions
  openModal: (id: string, component: string, props?: Record<string, any>) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;

  // Sheet actions (mobile)
  openSheet: (
    id: string,
    component: string,
    props?: Record<string, any>,
    snapPoints?: number[]
  ) => void;
  closeSheet: (id: string) => void;
  snapToPoint: (id: string, point: number) => void;
  closeAllSheets: () => void;

  // Deep linking
  setPendingDeepLink: (link: string) => void;
  clearPendingDeepLink: () => void;
  markDeepLinkHandled: () => void;

  // Breadcrumb actions (web)
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;
  addBreadcrumb: (breadcrumb: BreadcrumbItem) => void;
  clearBreadcrumbs: () => void;

  // Loading states
  setNavigationLoading: (loading: boolean) => void;
  setRouteLoading: (route: string, loading: boolean) => void;
  clearRouteLoading: () => void;

  // History management
  clearHistory: () => void;
  pruneHistory: (maxItems?: number) => void;

  // Utility actions
  getCurrentRoute: () => string;
  getRouteParams: () => Record<string, any>;
  isModalOpen: (id: string) => boolean;
  isSheetOpen: (id: string) => boolean;
}

export type NavigationStore = NavigationState & NavigationActions;

const initialState: NavigationState = {
  currentRoute: '/',
  previousRoute: null,
  routeParams: {},
  history: [],
  canGoBack: false,
  canGoForward: false,
  activeTab: 'home',
  tabHistory: {},
  modals: [],
  sheets: [],
  pendingDeepLink: null,
  deepLinkHandled: true,
  breadcrumbs: [],
  navigationLoading: false,
  routeLoading: {},
};

export const useNavigationStore = create<NavigationStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Navigation actions
      navigate: (route, params = {}) => {
        const currentState = get();
        const historyItem: NavigationHistoryItem = {
          route: currentState.currentRoute,
          params: currentState.routeParams,
          timestamp: Date.now(),
        };

        set({
          previousRoute: currentState.currentRoute,
          currentRoute: route,
          routeParams: params,
          history: [...currentState.history, historyItem].slice(-50), // Keep last 50 items
          canGoBack: true,
        });
      },

      goBack: () => {
        const { history } = get();
        if (history.length > 0) {
          const previousItem = history[history.length - 1];
          const newHistory = history.slice(0, -1);

          set({
            currentRoute: previousItem.route,
            routeParams: previousItem.params,
            history: newHistory,
            canGoBack: newHistory.length > 0,
          });
        }
      },

      goForward: () => {
        // Implementation would depend on maintaining forward history
        // For now, just a placeholder
      },

      replace: (route, params = {}) => {
        set({
          currentRoute: route,
          routeParams: params,
        });
      },

      reset: (routes) => {
        if (routes.length === 0) return;

        const lastRoute = routes[routes.length - 1];
        set({
          currentRoute: lastRoute.route,
          routeParams: lastRoute.params || {},
          history: [],
          canGoBack: false,
          canGoForward: false,
        });
      },

      // Tab actions (mobile)
      setActiveTab: (tab) => {
        set({ activeTab: tab });
      },

      navigateInTab: (tab, route, params = {}) => {
        const { tabHistory } = get();
        const currentTabHistory = tabHistory[tab] || [];

        set({
          activeTab: tab,
          currentRoute: route,
          routeParams: params,
          tabHistory: {
            ...tabHistory,
            [tab]: [...currentTabHistory, route].slice(-10), // Keep last 10 per tab
          },
        });
      },

      resetTab: (tab, route, params = {}) => {
        const { tabHistory } = get();

        set({
          activeTab: tab,
          currentRoute: route,
          routeParams: params,
          tabHistory: {
            ...tabHistory,
            [tab]: [route],
          },
        });
      },

      // Modal actions
      openModal: (id, component, props = {}) => {
        const { modals } = get();
        const existingModalIndex = modals.findIndex(m => m.id === id);

        if (existingModalIndex >= 0) {
          // Update existing modal
          const updatedModals = [...modals];
          updatedModals[existingModalIndex] = {
            ...updatedModals[existingModalIndex],
            component,
            props,
            isOpen: true,
          };
          set({ modals: updatedModals });
        } else {
          // Add new modal
          set({
            modals: [...modals, {
              id,
              component,
              props,
              isOpen: true,
              canDismiss: true,
            }],
          });
        }
      },

      closeModal: (id) => {
        const { modals } = get();
        set({
          modals: modals.map(modal =>
            modal.id === id ? { ...modal, isOpen: false } : modal
          ),
        });

        // Remove closed modals after animation
        setTimeout(() => {
          set({
            modals: get().modals.filter(modal => modal.isOpen),
          });
        }, 300);
      },

      closeAllModals: () => {
        set({
          modals: get().modals.map(modal => ({ ...modal, isOpen: false })),
        });

        setTimeout(() => {
          set({ modals: [] });
        }, 300);
      },

      // Sheet actions (mobile)
      openSheet: (id, component, props = {}, snapPoints = [0.3, 0.7, 1]) => {
        const { sheets } = get();
        const existingSheetIndex = sheets.findIndex(s => s.id === id);

        if (existingSheetIndex >= 0) {
          // Update existing sheet
          const updatedSheets = [...sheets];
          updatedSheets[existingSheetIndex] = {
            ...updatedSheets[existingSheetIndex],
            component,
            props,
            isOpen: true,
            snapPoints,
          };
          set({ sheets: updatedSheets });
        } else {
          // Add new sheet
          set({
            sheets: [...sheets, {
              id,
              component,
              props,
              isOpen: true,
              snapPoints,
              currentSnap: snapPoints[0],
            }],
          });
        }
      },

      closeSheet: (id) => {
        const { sheets } = get();
        set({
          sheets: sheets.map(sheet =>
            sheet.id === id ? { ...sheet, isOpen: false } : sheet
          ),
        });

        setTimeout(() => {
          set({
            sheets: get().sheets.filter(sheet => sheet.isOpen),
          });
        }, 300);
      },

      snapToPoint: (id, point) => {
        const { sheets } = get();
        set({
          sheets: sheets.map(sheet =>
            sheet.id === id ? { ...sheet, currentSnap: point } : sheet
          ),
        });
      },

      closeAllSheets: () => {
        set({
          sheets: get().sheets.map(sheet => ({ ...sheet, isOpen: false })),
        });

        setTimeout(() => {
          set({ sheets: [] });
        }, 300);
      },

      // Deep linking
      setPendingDeepLink: (link) => {
        set({
          pendingDeepLink: link,
          deepLinkHandled: false,
        });
      },

      clearPendingDeepLink: () => {
        set({
          pendingDeepLink: null,
          deepLinkHandled: true,
        });
      },

      markDeepLinkHandled: () => {
        set({ deepLinkHandled: true });
      },

      // Breadcrumb actions (web)
      setBreadcrumbs: (breadcrumbs) => {
        set({ breadcrumbs });
      },

      addBreadcrumb: (breadcrumb) => {
        const { breadcrumbs } = get();
        set({ breadcrumbs: [...breadcrumbs, breadcrumb] });
      },

      clearBreadcrumbs: () => {
        set({ breadcrumbs: [] });
      },

      // Loading states
      setNavigationLoading: (loading) => {
        set({ navigationLoading: loading });
      },

      setRouteLoading: (route, loading) => {
        const { routeLoading } = get();
        set({
          routeLoading: {
            ...routeLoading,
            [route]: loading,
          },
        });
      },

      clearRouteLoading: () => {
        set({ routeLoading: {} });
      },

      // History management
      clearHistory: () => {
        set({
          history: [],
          canGoBack: false,
          canGoForward: false,
        });
      },

      pruneHistory: (maxItems = 50) => {
        const { history } = get();
        if (history.length > maxItems) {
          set({
            history: history.slice(-maxItems),
          });
        }
      },

      // Utility actions
      getCurrentRoute: () => get().currentRoute,

      getRouteParams: () => get().routeParams,

      isModalOpen: (id) => {
        const { modals } = get();
        return modals.some(modal => modal.id === id && modal.isOpen);
      },

      isSheetOpen: (id) => {
        const { sheets } = get();
        return sheets.some(sheet => sheet.id === id && sheet.isOpen);
      },
    }),
    {
      name: 'navigation-storage',
      storage: createStorage(),
      partialize: (state) => ({
        // Only persist essential navigation state
        activeTab: state.activeTab,
        tabHistory: state.tabHistory,
        pendingDeepLink: state.pendingDeepLink,
        deepLinkHandled: state.deepLinkHandled,
      }),
    }
  )
);

// Navigation utilities
export const navigationUtils = {
  // Build route with params
  buildRoute: (route: string, params?: Record<string, any>): string => {
    if (!params || Object.keys(params).length === 0) {
      return route;
    }

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    return `${route}?${searchParams.toString()}`;
  },

  // Parse route params from URL
  parseRouteParams: (url: string): Record<string, any> => {
    try {
      const urlObj = new URL(url, 'https://example.com');
      const params: Record<string, any> = {};

      urlObj.searchParams.forEach((value, key) => {
        params[key] = value;
      });

      return params;
    } catch {
      return {};
    }
  },

  // Check if route matches pattern
  matchesRoute: (route: string, pattern: string): boolean => {
    // Simple pattern matching - could be enhanced with proper regex
    const routeParts = route.split('/');
    const patternParts = pattern.split('/');

    if (routeParts.length !== patternParts.length) {
      return false;
    }

    return patternParts.every((part, index) => {
      if (part.startsWith(':')) {
        return true; // Parameter placeholder
      }
      return part === routeParts[index];
    });
  },

  // Get route title for display
  getRouteTitle: (route: string): string => {
    const routeTitles: Record<string, string> = {
      '/': 'Home',
      '/profile': 'Profile',
      '/vibes': 'Vibes',
      '/search': 'Search',
      '/notifications': 'Notifications',
      '/settings': 'Settings',
      // Add more route titles as needed
    };

    return routeTitles[route] || route.split('/').pop() || 'Page';
  },
};