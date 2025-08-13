import * as React from 'react';
import { cn } from '@/utils/tailwind-utils';

interface FlipClockDigitProps {
  value: string;
  className?: string;
  onLockIn?: boolean;
  previousLockedValue: string;
  isLockingIn?: boolean;
}

interface SingleDigitProps {
  digit: string;
  className?: string;
  direction?: 'up' | 'down' | null;
  delay?: number;
  triggerAnimation?: boolean;
}

function SingleDigit({
  digit,
  className,
  direction,
  delay = 0,
  triggerAnimation = false,
}: SingleDigitProps) {
  const [currentDigit, setCurrentDigit] = React.useState(digit);
  const [previousDigit, setPreviousDigit] = React.useState(digit);
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [localDirection, setLocalDirection] = React.useState<'up' | 'down'>(
    'up'
  );

  React.useEffect(() => {
    if (digit !== currentDigit) {
      // Determine direction based on digit value change
      let newDirection: 'up' | 'down' = 'up';

      // If both are numbers, compare them
      if (!isNaN(Number(digit)) && !isNaN(Number(currentDigit))) {
        const newNum = Number(digit);
        const oldNum = Number(currentDigit);
        newDirection = newNum > oldNum ? 'up' : 'down';
      } else if (direction) {
        // Use provided direction for non-numeric changes (like decimal point)
        newDirection = direction === 'down' ? 'down' : 'up';
      }

      setLocalDirection(newDirection);
      setPreviousDigit(currentDigit);
      setCurrentDigit(digit);
      setIsAnimating(true);

      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [digit, currentDigit, direction]);

  // Handle staggered lock-in animation
  React.useEffect(() => {
    if (triggerAnimation) {
      const animationTimer = setTimeout(() => {
        setIsAnimating(true);

        const clearTimer = setTimeout(() => {
          setIsAnimating(false);
        }, 150);

        return () => clearTimeout(clearTimer);
      }, delay);

      return () => clearTimeout(animationTimer);
    }
  }, [triggerAnimation, delay]);

  return (
    <span
      className="relative inline-block"
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Current digit */}
      <span
        className={cn(
          className,
          'inline-block',
          isAnimating && localDirection === 'up' && 'animate-flip-up-in',
          isAnimating && localDirection === 'down' && 'animate-flip-down-in'
        )}
      >
        {currentDigit}
      </span>

      {/* Previous digit (fading out) */}
      {isAnimating && (
        <span
          className={cn(
            className,
            'absolute inset-0 inline-block',
            localDirection === 'up' && 'animate-flip-up-out',
            localDirection === 'down' && 'animate-flip-down-out'
          )}
        >
          {previousDigit}
        </span>
      )}
    </span>
  );
}

export function FlipClockDigit({
  value,
  className,
  onLockIn = false,
  previousLockedValue,
  isLockingIn,
}: FlipClockDigitProps) {
  const [prevValue, setPrevValue] = React.useState(value);
  const [direction, setDirection] = React.useState<'up' | 'down' | null>(null);
  const [lockInDirection, setLockInDirection] = React.useState<
    'up' | 'down' | null
  >(null);

  React.useEffect(() => {
    if (value !== prevValue) {
      // Determine overall direction
      const newNum = parseFloat(value);
      const oldNum = parseFloat(prevValue);

      if (!isNaN(newNum) && !isNaN(oldNum)) {
        setDirection(newNum > oldNum ? 'up' : 'down');
      } else {
        setDirection(null);
      }

      setPrevValue(value);
    }
  }, [value, prevValue]);

  // Handle lock-in animation
  React.useEffect(() => {
    if (onLockIn && previousLockedValue) {
      const newNum = parseFloat(value);
      const oldNum = parseFloat(previousLockedValue);

      if (!isNaN(newNum) && !isNaN(oldNum)) {
        setLockInDirection(newNum > oldNum ? 'up' : 'down');
      }
    }
  }, [onLockIn, previousLockedValue, value]);

  // Split the value into individual characters
  const digits = value.split('');
  const prevDigits = prevValue.split('');

  return (
    <span className="inline-flex">
      {digits.map((digit, index) => (
        <SingleDigit
          key={index}
          digit={digit}
          className={className}
          // For lock-in, use lockInDirection; otherwise use regular direction
          direction={
            onLockIn
              ? lockInDirection
              : prevDigits[index] !== digit
                ? direction
                : null
          }
          // Stagger animation for lock-in effect
          delay={onLockIn ? index * 50 : 0}
          triggerAnimation={
            isLockingIn && /[^.]/i.test(digit) && lockInDirection !== null
          }
        />
      ))}
    </span>
  );
}
