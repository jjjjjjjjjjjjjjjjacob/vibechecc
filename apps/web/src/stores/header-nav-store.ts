import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export type FeedTab = 'for-you' | 'hot' | 'new' | 'unrated';
export type NavState = 'nav' | 'profile' | 'search' | 'notifications' | null;
export type PageNavState = 'tabs' | 'vibe' | null;

interface HeaderNavStore {
  feedTab: FeedTab;
  setFeedTab: (tab: FeedTab) => void;

  pageNavState: PageNavState;
  setPageNavState: (state: PageNavState) => void;

  navState: NavState;
  setNavState: (state: NavState) => void;
}

export const useHeaderNavStore = create<HeaderNavStore>()(
  subscribeWithSelector((set) => ({
    feedTab: 'for-you',
    setFeedTab: (tab) => set({ feedTab: tab }),

    pageNavState: null,
    setPageNavState: (state) => set({ pageNavState: state }),

    navState: null,
    setNavState: (state) => set({ navState: state }),
  }))
);
