import * as React from 'react';
import { SignInButton, SignUpButton } from '@clerk/tanstack-react-start';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, LogIn } from 'lucide-react';

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
  description = 'you must sign in to use viberater',
  actionText: _actionText = 'this feature',
}: AuthPromptDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background/60 drop-shadow-primary/30 border-none drop-shadow-xl/50 backdrop-blur sm:max-w-[425px]">
        <DialogHeader className="flex text-center sm:text-left">
          <DialogTitle className="bg-gradient-to-r from-violet-600 via-pink-600 to-orange-600 bg-clip-text text-3xl font-bold text-transparent">
            {title}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground/90 mt-2 text-base">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6 space-y-4">
          <div className="space-y-3">
            <SignInButton mode="modal">
              <Button className="h-12 w-full bg-gradient-to-r from-violet-600 to-pink-600 text-base font-semibold text-white transition-all hover:scale-[1.02] hover:from-violet-700 hover:to-pink-700 hover:shadow-lg hover:shadow-violet-500/25">
                <LogIn className="mr-2 h-5 w-5" />
                sign in to viberater
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button
                variant="outline"
                className="h-12 w-full border-2 border-violet-200 bg-white/50 text-base font-semibold backdrop-blur-sm transition-all hover:scale-[1.02] hover:border-violet-300 hover:bg-gradient-to-r hover:from-violet-50 hover:to-pink-50"
              >
                <Sparkles className="mr-2 h-4 w-4 text-violet-600" />
                create new account
              </Button>
            </SignUpButton>
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="border-gradient-to-r via-primary/20 w-full border-t-2 from-transparent to-transparent" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text px-3 font-semibold text-transparent">
                or
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground hover:bg-primary/20 h-11 w-full text-sm font-medium transition transition-all"
          >
            continue browsing
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
