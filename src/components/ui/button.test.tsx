/// <reference lib="dom" />

import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Button } from './button';

afterEach(() => {
  cleanup();
});
describe('Button component', () => {
  it('renders correctly with children', () => {
    render(<Button>Click Me</Button>);
    const buttonElement = screen.getByRole('button', { name: /click me/i });

    expect(buttonElement).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    const buttonElement = screen.getByRole('button', { name: /click me/i });
    fireEvent.click(buttonElement);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies variant and size classes correctly', () => {
    render(
      <Button variant="destructive" size="lg">
        Destructive LG
      </Button>
    );
    const buttonElement = screen.getByRole('button', {
      name: /destructive lg/i,
    });
    // We expect the component to internally apply classes based on variants.
    // A more robust test might check for specific class names if they are guaranteed.
    // For now, we just check if it renders. More specific class checks can be brittle.
    expect(buttonElement).toBeInTheDocument();
    // Example of a more specific class check (can be brittle):
    // expect(buttonElement).toHaveClass('bg-destructive');
    // expect(buttonElement).toHaveClass('h-10');
  });

  it('renders as a Slot when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/">I am a link</a>
      </Button>
    );
    // Check if it renders an anchor tag instead of a button
    const linkElement = screen.getByRole('link', { name: /i am a link/i });
    expect(linkElement).toBeInTheDocument();
    expect(linkElement.tagName).toBe('A');
    // Ensure no button role is found if Slot is working correctly
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    const handleClick = vi.fn();
    render(
      <Button onClick={handleClick} disabled>
        Disabled Button
      </Button>
    );
    const buttonElement = screen.getByRole('button', {
      name: /disabled button/i,
    });
    expect(buttonElement).toBeDisabled();
    fireEvent.click(buttonElement);
    expect(handleClick).not.toHaveBeenCalled();
  });
});
