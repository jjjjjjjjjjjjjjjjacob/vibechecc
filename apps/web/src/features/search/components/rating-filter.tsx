import { Star } from '@/components/ui/icons';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface RatingFilterProps {
  value?: number;
  onChange: (rating?: number) => void;
}

export function RatingFilter({ value, onChange }: RatingFilterProps) {
  const ratings = [
    { value: 0, label: 'All ratings' },
    { value: 4, label: '4+ stars' },
    { value: 3, label: '3+ stars' },
    { value: 2, label: '2+ stars' },
    { value: 1, label: '1+ stars' },
  ];

  return (
    <div>
      <h4 className="mb-3 font-medium">Minimum Rating</h4>
      <RadioGroup
        value={value?.toString() || '0'}
        onValueChange={(val) => onChange(val === '0' ? undefined : Number(val))}
      >
        {ratings.map((rating) => (
          <div key={rating.value} className="mb-2 flex items-center space-x-2">
            <RadioGroupItem
              value={rating.value.toString()}
              id={`rating-${rating.value}`}
            />
            <Label
              htmlFor={`rating-${rating.value}`}
              className="flex cursor-pointer items-center"
            >
              {rating.value > 0 && (
                <div className="mr-2 flex items-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${
                        i < rating.value
                          ? 'fill-yellow-500 text-yellow-500 dark:fill-yellow-400 dark:text-yellow-400'
                          : 'text-muted-foreground'
                      }`}
                    />
                  ))}
                </div>
              )}
              <span>{rating.label}</span>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
