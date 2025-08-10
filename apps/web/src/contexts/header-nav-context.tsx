import * as React from 'react';
import { useLocation } from '@tanstack/react-router';

export type FeedTab = 'for-you' | 'hot' | 'new' | 'unrated';
export type NavState = 'nav' | 'profile' | 'search' | 'notifications' | null;
export type PageNavState = 'tabs' | 'vibe' | null;

interface HeaderNavContextType {
  // Feed tabs selection
  feedTab: FeedTab;
  setFeedTab: (tab: FeedTab) => void;

  // Header page-level nav (e.g., pinned feed tabs)
  pageNavState: PageNavState;
  setPageNavState: (state: PageNavState) => void;

  // Header overlay nav (search, profile, etc.)
  navState: NavState;
  setNavState: (state: NavState) => void;
}

export const HeaderNavContext = React.createContext<
  HeaderNavContextType | undefined
>(undefined);

export function HeaderNavProvider({ children }: { children: React.ReactNode }) {
  const [feedTab, setFeedTab] = React.useState<FeedTab>('for-you');
  const [pageNavState, setPageNavState] = React.useState<PageNavState>(null);
  const [navState, setNavState] = React.useState<NavState>(null);
  const location = useLocation();

  // Clear or set appropriate pageNavState based on route
  React.useEffect(() => {
    // Only homepage manages its own pageNavState (for tabs)
    // Vibe detail pages get 'vibe' state
    // All other pages clear the pageNavState
    if (location.pathname === '/') {
      // Homepage will manage its own state via HomeFeed component
      // Don't set anything here to avoid conflicts
      return;
    } else if (location.pathname.startsWith('/vibes/') && location.pathname.split('/').length === 3) {
      // This is a vibe detail page (/vibes/[vibeId])
      setPageNavState('vibe');
    } else {
      // Any other page should clear the pageNavState
      setPageNavState(null);
    }
  }, [location.pathname]);

  return (
    <HeaderNavContext.Provider
      value={{
        feedTab,
        setFeedTab,
        pageNavState,
        setPageNavState,
        navState,
        setNavState,
      }}
    >
      {children}
    </HeaderNavContext.Provider>
  );
}

export function useHeaderNav() {
  const context = React.useContext(HeaderNavContext);
  if (!context) {
    throw new Error('useHeaderNav must be used within a HeaderNavProvider');
  }
  return context;
}

// Hook that doesn't throw if context is not available
export function useOptionalHeaderNav() {
  return React.useContext(HeaderNavContext);
}
