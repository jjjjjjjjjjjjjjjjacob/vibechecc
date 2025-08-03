import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Heart,
  Settings,
  Plus,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from '@/utils/toast';
import { useAllTags } from '@/queries';
import type { UseMutationResult } from '@tanstack/react-query';
import { DEFAULT_INTERESTS } from '@/constants/interests';

interface ManageInterestsSectionProps {
  userInterests: string[];
  onInterestsUpdate: (interests: string[]) => void;
  updateProfileMutation: UseMutationResult<any, Error, any, unknown>;
}

export function ManageInterestsSection({
  userInterests,
  onInterestsUpdate,
  updateProfileMutation,
}: ManageInterestsSectionProps) {
  const { data: allTags } = useAllTags();
  const [isManagingInterests, setIsManagingInterests] = React.useState(false);
  const [localInterests, setLocalInterests] =
    React.useState<string[]>(userInterests);
  const [isSavingInterests, setIsSavingInterests] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Sync local state with props when userInterests changes
  React.useEffect(() => {
    setLocalInterests(userInterests);
  }, [userInterests]);

  const availableInterests =
    allTags?.slice(0, 50).map((tag) => tag.tag) || DEFAULT_INTERESTS;

  const toggleInterest = (interest: string) => {
    setLocalInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
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
  };

  // Show fewer interests when collapsed
  const displayedInterests = isExpanded
    ? userInterests
    : userInterests.slice(0, 8);
  const hasMoreInterests = userInterests.length > 8;

  return (
    <div className="border-muted/20 bg-muted/5 rounded-lg border p-4">
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

      <AnimatePresence mode="wait">
        {isManagingInterests ? (
          <motion.div
            key="managing"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <div className="flex flex-wrap gap-2">
              {availableInterests.map((interest, index) => (
                <motion.div
                  key={interest}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.01 }}
                >
                  <Badge
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
                </motion.div>
              ))}
            </div>

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
          </motion.div>
        ) : (
          <motion.div
            key="viewing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
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
                        <ChevronUp className="mr-1 h-3 w-3" />
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
