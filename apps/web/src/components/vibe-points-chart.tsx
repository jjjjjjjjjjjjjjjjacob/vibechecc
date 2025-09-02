import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/utils/tailwind-utils';

interface PointsHistoryEntry {
  date: string;
  earned: number;
  spent: number;
  balance: number;
}

interface VibePointsChartProps {
  data: PointsHistoryEntry[];
  className?: string;
  showTitle?: boolean;
}

export function VibePointsChart({
  data,
  className,
  showTitle = true,
}: VibePointsChartProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const _formatTooltipValue = (value: number, name: string) => {
    const sign = name === 'earned' ? '+' : name === 'spent' ? '-' : '';
    return [`${sign}${value}`, name];
  };

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ color: string; value: number; dataKey: string }>;
    label?: string;
  }) => {
    if (!active || !payload?.length) return null;

    return (
      <div className="bg-background border-border rounded-lg border p-3 shadow-lg">
        <p className="text-foreground mb-2 text-sm font-medium">
          {label ? formatDate(label) : ''}
        </p>
        {payload.map((entry, index: number) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground capitalize">
              {entry.dataKey}:
            </span>
            <span className="text-foreground font-medium">
              {entry.dataKey === 'earned'
                ? '+'
                : entry.dataKey === 'spent'
                  ? '-'
                  : ''}
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className={cn('hidden md:block', className)}>
      {showTitle && (
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">
            points activity (30 days)
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={cn(!showTitle && 'pt-6')}>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 5,
                left: 5,
                bottom: 5,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-muted"
                opacity={0.3}
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                className="text-muted-foreground text-xs"
                axisLine={false}
                tickLine={false}
                fontSize={10}
              />
              <YAxis
                className="text-muted-foreground text-xs"
                axisLine={false}
                tickLine={false}
                fontSize={10}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{
                  fontSize: '12px',
                  paddingTop: '8px',
                }}
                iconType="circle"
              />
              <Line
                type="monotone"
                dataKey="earned"
                stroke="hsl(var(--theme-primary))"
                strokeWidth={2}
                dot={{
                  fill: 'hsl(var(--theme-primary))',
                  strokeWidth: 2,
                  r: 3,
                }}
                activeDot={{
                  r: 4,
                  stroke: 'hsl(var(--theme-primary))',
                  strokeWidth: 2,
                }}
                name="earned"
              />
              <Line
                type="monotone"
                dataKey="spent"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--destructive))', strokeWidth: 2, r: 3 }}
                activeDot={{
                  r: 4,
                  stroke: 'hsl(var(--destructive))',
                  strokeWidth: 2,
                }}
                name="spent"
              />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
                activeDot={{
                  r: 3,
                  stroke: 'hsl(var(--muted-foreground))',
                  strokeWidth: 2,
                }}
                name="balance"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
