import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/utils/tailwind-utils';
import {
  generateGradientStyle,
  generateRandomGradient,
  gradientDirections,
  gradientPresets,
} from '@/utils/gradient-utils';
import { Shuffle } from 'lucide-react';

interface GradientPickerProps {
  value?: {
    from?: string;
    to?: string;
    direction?: string;
  };
  onChange: (gradient: {
    from: string;
    to: string;
    direction: string;
  }) => void;
  className?: string;
}

export function GradientPicker({
  value,
  onChange,
  className,
}: GradientPickerProps) {
  const [from, setFrom] = React.useState(value?.from || '#FF6B6B');
  const [to, setTo] = React.useState(value?.to || '#FFA500');
  const [direction, setDirection] = React.useState(value?.direction || 'to-br');
  const [isOpen, setIsOpen] = React.useState(false);

  // Update local state when value prop changes
  React.useEffect(() => {
    if (value?.from) setFrom(value.from);
    if (value?.to) setTo(value.to);
    if (value?.direction) setDirection(value.direction);
  }, [value]);

  const handleApply = () => {
    onChange({ from, to, direction });
    setIsOpen(false);
  };

  const handlePresetSelect = (preset: typeof gradientPresets[0]) => {
    setFrom(preset.from);
    setTo(preset.to);
    setDirection(preset.direction);
    onChange({
      from: preset.from,
      to: preset.to,
      direction: preset.direction,
    });
    setIsOpen(false);
  };

  const handleRandomize = () => {
    const random = generateRandomGradient();
    setFrom(random.from);
    setTo(random.to);
    setDirection(random.direction);
    onChange({
      from: random.from,
      to: random.to,
      direction: random.direction,
    });
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'h-10 w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <div className="flex w-full items-center gap-2">
            <div
              className="h-6 w-6 rounded border"
              style={{
                background: generateGradientStyle(from, to, direction),
              }}
            />
            <span className="flex-1 truncate">
              {value ? 'custom gradient' : 'choose gradient'}
            </span>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <Tabs defaultValue="custom" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="presets">presets</TabsTrigger>
            <TabsTrigger value="custom">custom</TabsTrigger>
          </TabsList>
          
          <TabsContent value="presets" className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {gradientPresets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handlePresetSelect(preset)}
                  className="group relative h-16 w-full overflow-hidden rounded-md border transition-all hover:scale-105"
                  style={{
                    background: generateGradientStyle(
                      preset.from,
                      preset.to,
                      preset.direction
                    ),
                  }}
                >
                  <span className="absolute inset-x-0 bottom-0 bg-black/50 p-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {preset.name}
                  </span>
                </button>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="custom" className="space-y-4">
            <div className="space-y-3">
              <div className="h-20 w-full rounded-md border"
                style={{
                  background: generateGradientStyle(from, to, direction),
                }}
              />
              
              <div className="space-y-2">
                <Label htmlFor="from-color">from color</Label>
                <div className="flex gap-2">
                  <Input
                    id="from-color"
                    type="color"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="h-10 w-20 cursor-pointer p-1"
                  />
                  <Input
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    placeholder="#FF6B6B"
                    className="flex-1"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="to-color">to color</Label>
                <div className="flex gap-2">
                  <Input
                    id="to-color"
                    type="color"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="h-10 w-20 cursor-pointer p-1"
                  />
                  <Input
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    placeholder="#FFA500"
                    className="flex-1"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>direction</Label>
                <div className="grid grid-cols-4 gap-1">
                  {gradientDirections.map((dir) => (
                    <Button
                      key={dir.value}
                      variant={direction === dir.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDirection(dir.value)}
                      className="h-8"
                      title={dir.label}
                    >
                      {dir.icon}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRandomize}
                  className="flex-1"
                >
                  <Shuffle className="mr-2 h-4 w-4" />
                  randomize
                </Button>
                <Button
                  size="sm"
                  onClick={handleApply}
                  className="flex-1"
                >
                  apply
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}