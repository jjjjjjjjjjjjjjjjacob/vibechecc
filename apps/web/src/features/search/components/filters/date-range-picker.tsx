import { useState } from 'react';
import { Calendar, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/utils/tailwind-utils';
import { format, subDays, startOfWeek, startOfMonth, startOfYear } from 'date-fns';

interface DateRangePickerProps {
  value?: { start: string; end: string };
  onChange: (dateRange?: { start: string; end: string }) => void;
  className?: string;
}

export function DateRangePicker({ 
  value, 
  onChange,
  className 
}: DateRangePickerProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>('all');
  const [isOpen, setIsOpen] = useState(false);

  const presets = [
    { value: 'all', label: 'All time', icon: null },
    { value: 'today', label: 'Today', icon: Calendar },
    { value: 'yesterday', label: 'Yesterday', icon: Calendar },
    { value: 'week', label: 'This week', icon: CalendarDays },
    { value: 'month', label: 'This month', icon: CalendarDays },
    { value: 'year', label: 'This year', icon: CalendarDays },
    { value: 'last7', label: 'Last 7 days', icon: Calendar },
    { value: 'last30', label: 'Last 30 days', icon: Calendar },
    { value: 'last90', label: 'Last 90 days', icon: Calendar },
  ];

  const getDateRangeFromPreset = (preset: string): { start: string; end: string } | undefined => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayString = format(today, 'yyyy-MM-dd');
    const nowString = format(now, 'yyyy-MM-dd');

    switch (preset) {
      case 'all':
        return undefined;
      case 'today':
        return { start: todayString, end: nowString };
      case 'yesterday': {
        const yesterday = subDays(today, 1);
        const yesterdayString = format(yesterday, 'yyyy-MM-dd');
        return { start: yesterdayString, end: yesterdayString };
      }
      case 'week': {
        const weekStart = startOfWeek(today, { weekStartsOn: 0 });
        return { start: format(weekStart, 'yyyy-MM-dd'), end: nowString };
      }
      case 'month': {
        const monthStart = startOfMonth(today);
        return { start: format(monthStart, 'yyyy-MM-dd'), end: nowString };
      }
      case 'year': {
        const yearStart = startOfYear(today);
        return { start: format(yearStart, 'yyyy-MM-dd'), end: nowString };
      }
      case 'last7': {
        const start = subDays(today, 7);
        return { start: format(start, 'yyyy-MM-dd'), end: nowString };
      }
      case 'last30': {
        const start = subDays(today, 30);
        return { start: format(start, 'yyyy-MM-dd'), end: nowString };
      }
      case 'last90': {
        const start = subDays(today, 90);
        return { start: format(start, 'yyyy-MM-dd'), end: nowString };
      }
      default:
        return undefined;
    }
  };

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);
    const range = getDateRangeFromPreset(preset);
    onChange(range);
  };

  const handleClear = () => {
    setSelectedPreset('all');
    onChange(undefined);
  };

  const formatDateRange = () => {
    if (!value) return 'All time';
    
    const start = new Date(value.start);
    const end = new Date(value.end);
    
    if (value.start === value.end) {
      return format(start, 'MMM d, yyyy');
    }
    
    // Same year
    if (start.getFullYear() === end.getFullYear()) {
      // Same month
      if (start.getMonth() === end.getMonth()) {
        return `${format(start, 'MMM d')} - ${format(end, 'd, yyyy')}`;
      }
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    }
    
    return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;
  };

  const isFiltered = value !== undefined;

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium">Date Posted</h4>
        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-auto py-1 px-2 text-xs"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Main preset options */}
      <RadioGroup
        value={selectedPreset}
        onValueChange={handlePresetChange}
        className="space-y-2"
      >
        {presets.slice(0, 5).map((preset) => {
          const Icon = preset.icon;
          return (
            <div key={preset.value} className="flex items-center space-x-2">
              <RadioGroupItem value={preset.value} id={`date-${preset.value}`} />
              <Label
                htmlFor={`date-${preset.value}`}
                className="flex cursor-pointer items-center flex-1"
              >
                {Icon && <Icon className="mr-2 h-3 w-3 text-muted-foreground" />}
                <span>{preset.label}</span>
              </Label>
            </div>
          );
        })}
      </RadioGroup>

      {/* More options dropdown */}
      <div className="mt-3">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-between text-left font-normal',
                !isFiltered && 'text-muted-foreground'
              )}
            >
              <span className="flex items-center">
                <CalendarDays className="mr-2 h-4 w-4" />
                {formatDateRange()}
              </span>
              <ChevronRight className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="start">
            <div className="space-y-3">
              <h5 className="font-medium text-sm">Quick ranges</h5>
              <div className="grid gap-2">
                {presets.slice(5).map((preset) => {
                  const Icon = preset.icon;
                  return (
                    <Button
                      key={preset.value}
                      variant={selectedPreset === preset.value ? "secondary" : "ghost"}
                      size="sm"
                      className="justify-start"
                      onClick={() => {
                        handlePresetChange(preset.value);
                        setIsOpen(false);
                      }}
                    >
                      {Icon && <Icon className="mr-2 h-3 w-3" />}
                      {preset.label}
                    </Button>
                  );
                })}
              </div>
              
              <div className="border-t pt-3">
                <p className="text-xs text-muted-foreground">
                  Custom date range picker coming soon
                </p>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Summary */}
      <p className="text-xs text-muted-foreground mt-3">
        {isFiltered 
          ? `Showing vibes from ${formatDateRange()}`
          : 'Showing vibes from all time'
        }
      </p>
    </div>
  );
}