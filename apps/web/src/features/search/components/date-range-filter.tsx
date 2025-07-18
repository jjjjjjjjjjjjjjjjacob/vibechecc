import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/utils/tailwind-utils';

interface DateRangeFilterProps {
  value?: { from?: Date; to?: Date; preset?: string };
  onChange: (dateRange?: { from?: Date; to?: Date; preset?: string }) => void;
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const presets = [
    { value: 'all', label: 'All time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This week' },
    { value: 'month', label: 'This month' },
    { value: 'year', label: 'This year' },
  ];

  const getDateFromPreset = (preset: string): { from?: Date; to?: Date } => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (preset) {
      case 'today':
        return { from: today, to: now };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        return { from: weekStart, to: now };
      case 'month':
        return {
          from: new Date(now.getFullYear(), now.getMonth(), 1),
          to: now,
        };
      case 'year':
        return { from: new Date(now.getFullYear(), 0, 1), to: now };
      default:
        return {};
    }
  };

  const handlePresetChange = (preset: string) => {
    if (preset === 'all') {
      onChange(undefined);
    } else {
      const range = getDateFromPreset(preset);
      onChange({ ...range, preset });
    }
  };

  return (
    <div>
      <h4 className="mb-3 font-medium">Date Posted</h4>
      <RadioGroup
        value={value?.preset || 'all'}
        onValueChange={handlePresetChange}
      >
        {presets.map((preset) => (
          <div key={preset.value} className="mb-2 flex items-center space-x-2">
            <RadioGroupItem value={preset.value} id={`date-${preset.value}`} />
            <Label
              htmlFor={`date-${preset.value}`}
              className="flex cursor-pointer items-center"
            >
              {preset.value !== 'all' && <Calendar className="mr-2 h-3 w-3" />}
              <span>{preset.label}</span>
            </Label>
          </div>
        ))}
      </RadioGroup>

      <div className="mt-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !value?.from && !value?.to && 'text-muted-foreground'
              )}
            >
              <Calendar className="mr-2 h-4 w-4" />
              {value?.from || value?.to ? (
                <>
                  {value.from?.toLocaleDateString() || 'Start'} -{' '}
                  {value.to?.toLocaleDateString() || 'End'}
                </>
              ) : (
                'Custom range'
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="start">
            <div className="text-muted-foreground text-sm">
              Custom date range picker would go here
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
