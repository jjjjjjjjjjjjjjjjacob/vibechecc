import * as React from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { cn } from '@/utils/tailwind-utils';
import { useUser } from '@clerk/tanstack-react-start';
import { useMutation } from '@tanstack/react-query';
import { api } from '@vibechecc/convex';
import { useConvexMutation } from '@convex-dev/react-query';
import { useThemeStore } from '@/stores/theme-store';
import { Button } from '@/components/ui';
import { ChevronUp } from '@/components/ui/icons';

interface EmojiSearchCollapsibleProps {
  onSelect: (emoji: string) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  showCategories?: boolean;
  pageSize?: number;
  dynamicWidth?: boolean;
  perLine?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  maxHeight?: string;
  expandButtonVariant?: 'text' | 'circle';
}

export function EmojiSearchCollapsible({
  onSelect,
  open: openProp,
  onOpenChange: onOpenChangeProp,
  showCategories = false,
  expandButtonVariant = 'text',
  dynamicWidth = false,
  perLine,
  maxHeight,
}: EmojiSearchCollapsibleProps) {
  const { user } = useUser();
  const { resolvedTheme } = useThemeStore();
  const trackUsage = useMutation({
    mutationFn: useConvexMutation(api.emojis.trackUsage),
  });
  const [_open, _setOpen] = React.useState(openProp ?? false);
  const open = openProp ?? _open;
  const setOpen = React.useCallback(
    (open: boolean) => {
      if (onOpenChangeProp) {
        onOpenChangeProp(open);
      }
      _setOpen(open);
    },
    [onOpenChangeProp]
  );

  const handleEmojiSelect = (emoji: {
    native?: string;
    shortcodes?: string[];
  }) => {
    const selectedEmoji = emoji.native || emoji.shortcodes?.[0] || '';

    // Track emoji usage if user is logged in
    if (user?.id && selectedEmoji) {
      trackUsage.mutate({ emoji: selectedEmoji });
    }

    onSelect(selectedEmoji);
  };

  return (
    <div className="flex w-full flex-col items-center border-0">
      <div
        data-open={open}
        className={cn(
          'transition-height relative m-0 flex w-full justify-center overflow-hidden rounded-lg bg-transparent delay-100 duration-300 data-[open=false]:h-38 data-[open=true]:h-84',
          maxHeight
        )}
      >
        <Picker
          data={data}
          onEmojiSelect={handleEmojiSelect}
          theme={resolvedTheme}
          previewPosition="none"
          skinTonePosition="none"
          searchPosition="top"
          navPosition={showCategories ? 'top' : 'none'}
          categories={
            open || showCategories
              ? [
                  'frequent',
                  'people',
                  'nature',
                  'foods',
                  'activity',
                  'travel',
                  'objects',
                  'symbols',
                ]
              : ['frequent']
          }
          perLine={perLine}
          maxFrequentRows={2}
          dynamicColumns={true}
          dynamicWidth={dynamicWidth}
          locale="en"
          noCountryFlags={false}
          noResultsEmoji="mag"
          icons="auto"
          set="native"
          custom={[]}
          autoFocus={false}
        />
      </div>
      {expandButtonVariant === 'text' && (
        <Button
          variant="ghost"
          className="mt-2 w-full justify-center py-2 text-sm hover:no-underline"
          onClick={() => setOpen(!open)}
        >
          <span className="lowercase">show all emojis</span>
          <ChevronUp
            data-open={open}
            className="transition-transform data-[open=false]:rotate-180"
            strokeWidth={4.0}
          />
        </Button>
      )}
      {expandButtonVariant === 'circle' && (
        <Button
          variant="secondary"
          className="border-border/20 hover:border-border/50 absolute right-2 bottom-2 h-fit w-fit rounded-full p-2"
          onClick={() => setOpen(!open)}
        >
          <ChevronUp
            data-open={open}
            className="transition-transform data-[open=true]:-rotate-180"
            strokeWidth={4.0}
          />
        </Button>
      )}
    </div>
  );
}
