import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { THEME_COLORS, type ThemeColor } from '@/utils/theme-colors';
import { cn } from '@/utils/tailwind-utils';

interface ThemeColorPickerProps {
  selectedTheme: string;
  onThemeChange: (themeId: string) => void;
  className?: string;
}

export function ThemeColorPicker({
  selectedTheme,
  onThemeChange,
  className,
}: ThemeColorPickerProps) {
  return (
    <Card
      className={cn(
        'bg-background/80 border border-white/10 shadow-xl backdrop-blur-md',
        className
      )}
    >
      <CardHeader className="pb-4">
        <CardTitle className="bg-gradient-to-r from-purple-500 to-purple-700 bg-clip-text text-lg font-bold text-transparent lowercase">
          profile theme
        </CardTitle>
        <p className="text-muted-foreground/80 text-sm">
          choose your signature color theme
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {THEME_COLORS.map((theme) => (
            <ThemeColorOption
              key={theme.id}
              theme={theme}
              isSelected={selectedTheme === theme.id}
              onSelect={() => onThemeChange(theme.id)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface ThemeColorOptionProps {
  theme: ThemeColor;
  isSelected: boolean;
  onSelect: () => void;
}

function ThemeColorOption({
  theme,
  isSelected,
  onSelect,
}: ThemeColorOptionProps) {
  const gradientClass = `bg-gradient-to-br from-${theme.id}-500 to-${theme.id}-700`;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group relative rounded-xl border-2 p-3 transition-all duration-200',
        'hover:scale-105 hover:shadow-lg',
        isSelected
          ? 'border-white/50 shadow-lg'
          : 'border-white/20 hover:border-white/40'
      )}
    >
      {/* Color preview circle */}
      <div
        className={cn(
          'relative mx-auto mb-2 h-8 w-8 overflow-hidden rounded-full',
          gradientClass
        )}
      >
        {isSelected && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Check className="h-4 w-4 text-white drop-shadow-lg" />
          </div>
        )}
      </div>

      {/* Selection ring */}
      {isSelected && (
        <div
          className={cn(
            'ring-offset-background/50 absolute inset-0 rounded-xl ring-2 ring-offset-2',
            `ring-${theme.id}-400`
          )}
        />
      )}
    </button>
  );
}
