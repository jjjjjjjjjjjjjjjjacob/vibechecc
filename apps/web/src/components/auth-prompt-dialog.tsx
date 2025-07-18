import * as React from 'react';
import { SignInButton, SignUpButton } from '@clerk/tanstack-react-start';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface AuthPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  actionText?: string;
}

export function AuthPromptDialog({
  open,
  onOpenChange,
  title = 'sign in required',
  description = 'you must sign in to use vibechecc',
  actionText = 'this feature',
}: AuthPromptDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            cancel
          </Button>
          <div className="flex gap-2">
            <SignInButton mode="modal">
              <Button>sign in</Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button variant="outline">sign up</Button>
            </SignUpButton>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
