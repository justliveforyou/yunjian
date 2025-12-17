import { cn } from '@/utils';

interface ProgressBarProps {
  value: number;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({ value, size = 'md', showLabel = true, className }: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className={cn(
        'flex-1 bg-secondary rounded-full overflow-hidden',
        size === 'sm' ? 'h-1.5' : 'h-2'
      )}>
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      {showLabel && (
        <span className={cn(
          'text-muted-foreground font-medium tabular-nums',
          size === 'sm' ? 'text-xs' : 'text-sm'
        )}>
          {clampedValue}%
        </span>
      )}
    </div>
  );
}
