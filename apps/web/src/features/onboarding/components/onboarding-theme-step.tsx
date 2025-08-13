import * as React from 'react';
import { Button } from '@/components/ui/button';
import { DualThemeColorPicker } from '@/features/theming/components/dual-theme-color-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  Heart,
  Star,
  MessageCircle,
  Sparkles,
  Eye,
} from '@/components/ui/icons';
import { useMediaQuery } from '@/hooks/use-media-query';
import type { UserTheme } from '@/utils/theme-colors';
import toast from '@/utils/toast';

interface OnboardingThemeStepProps {
  onNext: () => void;
  onUpdateTheme: (theme: UserTheme) => Promise<void>;
  isLoading?: boolean;
}

export function OnboardingThemeStep({
  onNext,
  onUpdateTheme,
  isLoading = false,
}: OnboardingThemeStepProps) {
  const [selectedTheme, setSelectedTheme] = React.useState<UserTheme>({
    primaryColor: 'pink',
    secondaryColor: 'orange',
  });
  const [showPreview, setShowPreview] = React.useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const handleThemeChange = (theme: UserTheme) => {
    setSelectedTheme(theme);
  };

  const handleContinue = async () => {
    try {
      await onUpdateTheme(selectedTheme);
      onNext();
    } catch {
      toast.error('failed to save theme settings. please try again.', {
        duration: 4000,
      });
    }
  };

  // Live Preview Content Component
  const PreviewContent = () => (
    <div className="space-y-4">
      {/* Sample UI elements with theme applied */}
      <div className="space-y-3">
        {/* Sample button */}
        <div className="themed-gradient-button rounded-lg px-4 py-2 text-center text-sm font-medium text-white">
          sample button
        </div>

        {/* Sample badges */}
        <div className="flex flex-wrap gap-2">
          <Badge
            variant="secondary"
            className="themed-gradient-text font-medium"
          >
            music
          </Badge>
          <Badge
            variant="secondary"
            className="themed-gradient-text font-medium"
          >
            travel
          </Badge>
          <Badge
            variant="secondary"
            className="themed-gradient-text font-medium"
          >
            art
          </Badge>
        </div>

        {/* Sample interactive elements */}
        <div className="bg-muted/30 flex items-center gap-4 rounded-lg p-3">
          <div className="flex items-center gap-1">
            <Heart className="text-theme-primary h-4 w-4" />
            <span className="text-muted-foreground text-sm">like</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="text-theme-secondary h-4 w-4" />
            <span className="text-muted-foreground text-sm">rate</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="text-muted-foreground h-4 w-4" />
            <span className="text-muted-foreground text-sm">comment</span>
          </div>
        </div>

        {/* Sample gradient text */}
        <div className="text-center">
          <p className="themed-gradient-text text-lg font-bold">
            your personalized viberatr experience
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <div className="text-muted-foreground/80 text-sm">
          express yourself with colors that represent you
        </div>
      </div>

      {/* Theme Color Picker */}
      <div className="mx-auto max-w-md">
        <DualThemeColorPicker
          selectedTheme={selectedTheme}
          onThemeChange={handleThemeChange}
        />
      </div>

      {/* Live Preview Section - Desktop */}
      {!isMobile && (
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-medium lowercase">
              <Sparkles className="text-theme-primary h-5 w-5" />
              live preview
            </CardTitle>
            <p className="text-muted-foreground/70 text-sm">
              see how your theme affects the interface
            </p>
          </CardHeader>
          <CardContent>
            <PreviewContent />
          </CardContent>
        </Card>
      )}

      {/* Live Preview Button - Mobile */}
      {isMobile && (
        <div className="flex justify-center">
          <Drawer open={showPreview} onOpenChange={setShowPreview}>
            <DrawerTrigger asChild>
              <Button variant="outline" className="w-full max-w-xs">
                <Eye className="mr-2 h-4 w-4" />
                preview theme
              </Button>
            </DrawerTrigger>
            <DrawerContent className="bg-background/95 backdrop-blur">
              <DrawerHeader>
                <DrawerTitle className="flex items-center gap-2 text-lg font-medium lowercase">
                  <Sparkles className="text-theme-primary h-5 w-5" />
                  live preview
                </DrawerTitle>
                <p className="text-muted-foreground/70 text-sm">
                  see how your theme affects the interface
                </p>
              </DrawerHeader>
              <div className="p-6">
                <PreviewContent />
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      )}

      {/* Continue Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleContinue}
          disabled={isLoading}
          className="themed-gradient-button w-full max-w-xs text-white transition-opacity hover:opacity-90"
        >
          {isLoading ? 'saving theme...' : 'continue'}
        </Button>
      </div>
    </div>
  );
}
