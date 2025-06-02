import * as React from 'react';
import { Link } from '@tanstack/react-router';
import { Button, type ButtonProps } from './ui/button';
import { Plus } from 'lucide-react';

interface CreateVibeButtonProps extends ButtonProps {}

export function CreateVibeButton({
  variant = 'outline',
  ...props
}: CreateVibeButtonProps) {
  return (
    <Button variant={variant} {...props}>
      <Link to="/vibes/create" className="flex items-center">
        <Plus className="mr-2 h-4 w-4" />
        create vibe
      </Link>
    </Button>
  );
}
