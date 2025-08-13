import * as React from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { cn } from '@/utils/tailwind-utils';
import { useUser } from '@clerk/tanstack-react-start';
import { useMutation } from '@tanstack/react-query';
import { api } from '@viberatr/convex';
import { useConvexMutation } from '@convex-dev/react-query';
import { useTheme } from '@/stores/theme-initializer';

interface EmojiSearchCommandV2Props {
  onSelect: (emoji: string) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  showCategories?: boolean;
  pageSize?: number;
  perLine?: number;
  'data-testid'?: string;
}

export function EmojiSearchCommandV2({
  onSelect,
  className,
  showCategories = true,
  perLine = 9,
  'data-testid': dataTestId,
}: EmojiSearchCommandV2Props) {
  const { user } = useUser();
  const { resolvedTheme } = useTheme();
  const trackUsage = useMutation({
    mutationFn: useConvexMutation(api.emojis.trackUsage),
  });

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
    <div
      className={cn('flex items-center justify-center', className)}
      data-testid={dataTestId}
    >
      <div
        className="h-full w-full max-w-[352px] flex-col"
        onWheel={(e) => {
          e.stopPropagation();
        }}
      >
        <Picker
          data={data}
          onEmojiSelect={handleEmojiSelect}
          theme={resolvedTheme}
          previewPosition="none"
          skinTonePosition="none"
          searchPosition="top"
          navPosition={showCategories ? 'top' : 'none'}
          perLine={perLine}
          maxFrequentRows={2}
          locale="en"
          noCountryFlags={false}
          noResultsEmoji="mag"
          icons="auto"
          set="native"
          custom={[]}
          autoFocus={false}
        />
      </div>
    </div>
  );
}
