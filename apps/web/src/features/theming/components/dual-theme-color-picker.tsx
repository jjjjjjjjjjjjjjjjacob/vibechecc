/**
 * dual theme color picker module.
 * enhanced documentation for clarity and maintenance.
 */
import * as React from 'react';
// card and tabs primitives form the picker layout
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// tooltip components provide color name hints on hover
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
// icons differentiate primary (layers) and secondary (palette) options
import { Check, Palette, Layers } from 'lucide-react';
// available theme colors and related types
import {
  THEME_COLORS,
  type ThemeColor,
  type UserTheme,
} from '@/utils/theme-colors';
// helper for merging tailwind classes
import { cn } from '@/utils/tailwind-utils';

interface DualThemeColorPickerProps {
  selectedTheme: UserTheme;
  onThemeChange: (theme: UserTheme) => void;
  className?: string;
}

export function DualThemeColorPicker({
  selectedTheme,
  onThemeChange,
  className,
}: DualThemeColorPickerProps) {
  // apply theme for preview using css variables
  React.useEffect(() => {
    document.documentElement.setAttribute(
      'data-theme-primary',
      selectedTheme.primaryColor
    );
    document.documentElement.setAttribute(
      'data-theme-secondary',
      selectedTheme.secondaryColor
    );
  }, [selectedTheme]);

  return (
    <Card
      className={cn(
        'bg-background/80 border border-white/10 shadow-xl backdrop-blur-md',
        className
      )}
    >
      <CardHeader className="pb-4">
        <CardTitle className="themed-gradient-text flex items-center gap-2 text-lg font-bold lowercase">
          profile theme
        </CardTitle>
        <p className="text-muted-foreground/80 text-sm">
          design your unique gradient
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* gradient preview - always visible */}
        <div className="space-y-3">
          <div className="themed-gradient-button relative h-16 overflow-hidden rounded-xl">
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/5 to-transparent" />
            <div className="absolute bottom-2 left-3 text-xs font-medium text-white/80 lowercase">
              live preview
            </div>
          </div>
        </div>

        {/* color selection tabs */}
        <Tabs defaultValue="primary" className="w-full">
          <TabsList className="bg-background/60 grid w-full grid-cols-2 backdrop-blur">
            <TabsTrigger
              value="primary"
              className="data-[state=active]:themed-gradient-button data-[state=active]:text-foreground flex items-center gap-2"
            >
              <Layers className="h-4 w-4" />
              primary
            </TabsTrigger>
            <TabsTrigger
              value="secondary"
              className="data-[state=active]:themed-gradient-button data-[state=active]:text-foreground flex items-center gap-2"
            >
              <Palette className="h-4 w-4" />
              secondary
            </TabsTrigger>
          </TabsList>

          <TabsContent value="primary" className="mt-4 space-y-3">
            <div className="text-center">
              <h4 className="text-muted-foreground mb-1 text-sm font-medium lowercase">
                choose primary color
              </h4>
              <p className="text-muted-foreground/60 text-xs">
                the main color of your gradient
              </p>
            </div>
            <div className="grid grid-cols-8 gap-2">
              {THEME_COLORS.map((theme) => (
                <ColorOption
                  key={`primary-${theme.id}`}
                  theme={theme}
                  isSelected={selectedTheme.primaryColor === theme.id}
                  onSelect={() =>
                    onThemeChange({
                      ...selectedTheme,
                      primaryColor: theme.id,
                    })
                  }
                  size="small"
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="secondary" className="mt-4 space-y-3">
            <div className="text-center">
              <h4 className="text-muted-foreground mb-1 text-sm font-medium lowercase">
                choose secondary color
              </h4>
              <p className="text-muted-foreground/60 text-xs">
                the accent color of your gradient
              </p>
            </div>
            <div className="grid grid-cols-8 gap-2">
              {THEME_COLORS.map((theme) => (
                <ColorOption
                  key={`secondary-${theme.id}`}
                  theme={theme}
                  isSelected={selectedTheme.secondaryColor === theme.id}
                  onSelect={() =>
                    onThemeChange({
                      ...selectedTheme,
                      secondaryColor: theme.id,
                    })
                  }
                  size="small"
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface ColorOptionProps {
  theme: ThemeColor;
  isSelected: boolean;
  onSelect: () => void;
  size?: 'small' | 'medium';
}

function ColorOption({
  theme,
  isSelected,
  onSelect,
  size = 'medium',
}: ColorOptionProps) {
  const sizeClasses = size === 'small' ? 'w-8 h-8 p-0' : 'w-12 h-12 p-2';
  // inner preview circle scales with size option
  const circleSize = size === 'small' ? 'w-full h-full' : 'w-8 h-8';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onSelect}
          className={cn(
            'group relative flex items-center justify-center overflow-hidden rounded-lg border-2 transition-all duration-200',
            'hover:scale-105 hover:shadow-md',
            sizeClasses,
            isSelected
              ? 'border-white/60 shadow-md ring-2 ring-white/30'
              : 'border-white/20 hover:border-white/40'
          )}
          data-theme-primary={theme.id}
        >
          {/* background color layer */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundColor: `var(--color-${theme.id})`,
            }}
          />
          {/* color preview circle */}
          <div
            className={cn('relative overflow-hidden rounded-full', circleSize)}
            style={{
              backgroundColor: `var(--color-${theme.id})`,
            }}
          >
            {isSelected && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Check
                  className={cn(
                    'text-white drop-shadow-lg',
                    size === 'small' ? 'h-3 w-3' : 'h-4 w-4'
                  )}
                />
              </div>
            )}
          </div>
          {/* selection ring */}
          {isSelected && (
            <div
              className="ring-offset-background/50 absolute inset-0 rounded-lg ring-2 ring-white/30 ring-offset-2"
              style={{
                boxShadow: `0 0 0 1px var(--color-${theme.id})`,
              }}
            />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent className="text-xs lowercase" side="top">
        {theme.name}
      </TooltipContent>
    </Tooltip>
  );
}
