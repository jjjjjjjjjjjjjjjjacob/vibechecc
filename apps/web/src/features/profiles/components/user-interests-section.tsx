import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Heart,
  Settings,
  Plus,
  X,
  Search,
  Check,
  ChevronDown,
} from '@/components/ui/icons';
import toast from '@/utils/toast';
import { useAllTags, useUserDerivedInterests } from '@/queries';
import { cn } from '@/utils/tailwind-utils';
import type { UseMutationResult } from '@tanstack/react-query';
import type { User } from '@vibechecc/types';

interface UserInterestsSectionProps {
  user: User;
  userInterests: string[];
  onInterestsUpdate: (interests: string[]) => void;
  updateProfileMutation: UseMutationResult<
    unknown,
    Error,
    {
      username?: string;
      first_name?: string;
      last_name?: string;
      image_url?: string;
      interests?: string[];
      bio?: string;
      themeColor?: string;
      primaryColor?: string;
      secondaryColor?: string;
      socials?: {
        twitter?: string;
        instagram?: string;
        tiktok?: string;
        youtube?: string;
        website?: string;
      };
    },
    unknown
  >;
  className?: string;
}

export function UserInterestsSection({
  user,
  userInterests,
  onInterestsUpdate,
  updateProfileMutation,
  className,
}: UserInterestsSectionProps) {
  const { data: allTags } = useAllTags();
  const { data: derivedInterests } = useUserDerivedInterests(user.externalId);

  const [isManagingInterests, setIsManagingInterests] = React.useState(false);
  const [localInterests, setLocalInterests] =
    React.useState<string[]>(userInterests);
  const [isSavingInterests, setIsSavingInterests] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState('');

  // Sync local state with props when userInterests changes
  React.useEffect(() => {
    setLocalInterests(userInterests);
  }, [userInterests]);

  // Combine all available tags - prioritize derived interests
  const availableTags = React.useMemo(() => {
    const tagSet = new Set<string>();

    // Add derived interests first (higher priority)
    if (derivedInterests) {
      derivedInterests.forEach((tag: string) => tagSet.add(tag));
    }

    // Add all available tags
    if (allTags) {
      allTags.forEach((tagData: { tag: string; count: number }) =>
        tagSet.add(tagData.tag)
      );
    }

    return Array.from(tagSet).sort();
  }, [allTags, derivedInterests]);

  // Filter tags based on search
  const filteredTags = React.useMemo(() => {
    if (!searchValue.trim()) return availableTags;
    return availableTags.filter((tag) =>
      tag.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [availableTags, searchValue]);

  const toggleInterest = (interest: string) => {
    setLocalInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const removeInterest = (interest: string) => {
    setLocalInterests((prev) => prev.filter((i) => i !== interest));
  };

  const handleSaveInterests = async () => {
    setIsSavingInterests(true);
    try {
      await updateProfileMutation.mutateAsync({
        interests: localInterests,
      });
      onInterestsUpdate(localInterests);
      toast.success('interests updated successfully!');
      setIsManagingInterests(false);
    } catch {
      // Failed to update interests - already showing user-facing error toast
      toast.error('failed to update interests. please try again.');
    } finally {
      setIsSavingInterests(false);
    }
  };

  const handleCancelInterests = () => {
    setLocalInterests(userInterests);
    setIsManagingInterests(false);
    setSearchValue('');
  };

  // Show fewer interests when collapsed
  const displayedInterests = isExpanded
    ? userInterests
    : userInterests.slice(0, 8);
  const hasMoreInterests = userInterests.length > 8;

  return (
    <div
      className={cn(
        'border-muted/20 bg-muted/5 rounded-lg border p-4',
        className
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="text-theme-primary h-4 w-4" />
          <h3 className="text-foreground text-sm font-medium">interests</h3>
          {userInterests.length > 0 && (
            <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
              {userInterests.length}
            </span>
          )}
        </div>
        {!isManagingInterests && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsManagingInterests(true)}
            className="text-muted-foreground hover:text-theme-primary hover:bg-theme-primary/10 h-8 px-2"
          >
            <Settings className="h-3 w-3" />
          </Button>
        )}
      </div>

      {isManagingInterests ? (
        <div className="animate-slideInDown space-y-4">
          {/* Selected interests as removable pills */}
          {localInterests.length > 0 && (
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs font-medium">
                selected interests:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {localInterests.map((interest) => (
                  <Badge
                    key={interest}
                    variant="default"
                    className="from-theme-primary to-theme-secondary text-primary-foreground bg-gradient-to-r px-2 py-1 text-xs"
                  >
                    <span className="lowercase">{interest}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeInterest(interest)}
                      className="text-primary-foreground/80 hover:text-primary-foreground ml-1 h-auto p-0 hover:bg-transparent"
                    >
                      <X className="h-2.5 w-2.5" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Command-based search interface */}
          <div className="space-y-2">
            <p className="text-muted-foreground text-xs font-medium">
              add interests:
            </p>
            <Popover open={searchOpen} onOpenChange={setSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={searchOpen}
                  className="border-theme-primary/20 hover:border-theme-primary/40 w-full justify-between"
                >
                  {searchValue || 'search for interests...'}
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder="search interests..."
                    value={searchValue}
                    onValueChange={setSearchValue}
                  />
                  <CommandList>
                    <CommandEmpty>no interests found.</CommandEmpty>
                    <CommandGroup>
                      {filteredTags.slice(0, 50).map((tag) => (
                        <CommandItem
                          key={tag}
                          value={tag}
                          onSelect={() => {
                            if (!localInterests.includes(tag)) {
                              toggleInterest(tag);
                            }
                            setSearchOpen(false);
                            setSearchValue('');
                          }}
                          className="cursor-pointer"
                        >
                          <span className="lowercase">{tag}</span>
                          {localInterests.includes(tag) && (
                            <Check className="text-theme-primary ml-auto h-4 w-4" />
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Quick suggestions from derived interests */}
          {derivedInterests && derivedInterests.length > 0 && (
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs font-medium">
                suggested from your activity:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {derivedInterests.slice(0, 8).map((interest: string) => (
                  <Badge
                    key={interest}
                    variant={
                      localInterests.includes(interest) ? 'default' : 'outline'
                    }
                    className={`cursor-pointer px-2 py-1 text-xs transition-all duration-200 hover:scale-105 ${
                      localInterests.includes(interest)
                        ? 'from-theme-primary to-theme-secondary text-primary-foreground hover:from-theme-primary/90 hover:to-theme-secondary/90 border-0 bg-gradient-to-r'
                        : 'hover:border-theme-primary/50 hover:bg-theme-primary/5 border'
                    }`}
                    onClick={() => toggleInterest(interest)}
                  >
                    <span className="lowercase">{interest}</span>
                    {localInterests.includes(interest) && (
                      <Check className="ml-1 h-2.5 w-2.5" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {localInterests.length > 0 && (
            <p className="text-muted-foreground text-center text-xs">
              {localInterests.length} interest
              {localInterests.length !== 1 ? 's' : ''} selected
            </p>
          )}

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSaveInterests}
              disabled={isSavingInterests}
              className="from-theme-primary to-theme-secondary text-primary-foreground hover:from-theme-primary/90 hover:to-theme-secondary/90 bg-gradient-to-r text-xs"
            >
              {isSavingInterests ? 'saving...' : 'save'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancelInterests}
              disabled={isSavingInterests}
              className="text-xs"
            >
              cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="animate-fadeIn space-y-3">
          {userInterests.length > 0 ? (
            <>
              <div className="flex flex-wrap gap-1.5">
                {displayedInterests.map((interest) => (
                  <Badge
                    key={interest}
                    variant="secondary"
                    className="bg-theme-primary/10 text-theme-primary border-theme-primary/20 px-2 py-0.5 text-xs lowercase"
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
              {hasMoreInterests && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-muted-foreground hover:text-theme-primary h-6 w-full text-xs"
                >
                  {isExpanded ? (
                    <>
                      <ChevronDown className="mr-1 h-3 w-3" />
                      show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="mr-1 h-3 w-3" />
                      show {userInterests.length - 8} more
                    </>
                  )}
                </Button>
              )}
            </>
          ) : (
            <div className="py-3 text-center">
              <p className="text-muted-foreground mb-2 text-xs">
                no interests selected
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsManagingInterests(true)}
                className="text-theme-primary hover:bg-theme-primary/10 h-7 text-xs"
              >
                <Plus className="mr-1 h-3 w-3" />
                add interests
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
