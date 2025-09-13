import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  Apple,
  ExternalLink,
  Info,
} from '@/components/ui/icons';

interface AppleIdRequiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGetAppleId: () => void;
  onHaveAppleId: () => void;
}

export function AppleIdRequiredModal({
  open,
  onOpenChange,
  onGetAppleId,
  onHaveAppleId,
}: AppleIdRequiredModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background/95 border-none drop-shadow-xl backdrop-blur sm:max-w-[480px]">
        <DialogHeader className="text-center">
          <div className="from-theme-secondary to-theme-primary mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br">
            <Apple className="text-primary-foreground h-8 w-8" />
          </div>
          <DialogTitle className="from-theme-secondary via-theme-primary to-theme-accent bg-gradient-to-r bg-clip-text text-2xl font-bold text-transparent">
            apple id required
          </DialogTitle>
          <DialogDescription className="text-muted-foreground/90 mt-3 text-base leading-relaxed">
            to maintain quality and prevent spam, vibechecc requires an apple id
            for account creation
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          <div className="bg-warning/10 border-warning/20 dark:bg-warning/5 dark:border-warning/20 rounded-lg border p-4">
            <div className="flex items-start space-x-3">
              <Info className="text-warning mt-0.5 h-5 w-5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-warning-foreground dark:text-warning font-semibold">
                  why apple id?
                </p>
                <p className="text-warning-foreground/90 dark:text-warning/90 mt-1">
                  apple's verification process helps us maintain a high-quality
                  community by reducing fake accounts and spam
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={onHaveAppleId}
              className="from-theme-primary to-theme-accent text-primary-foreground hover:from-theme-primary/90 hover:to-theme-accent/90 h-12 w-full border-transparent bg-gradient-to-r font-semibold transition-all hover:scale-[1.02]"
            >
              <Apple className="mr-2 h-5 w-5" />i have an apple id
            </Button>

            <Button
              onClick={onGetAppleId}
              variant="outline"
              className="border-warning/30 bg-warning/10 hover:bg-warning/20 hover:border-warning/50 dark:border-warning/30 dark:bg-warning/5 dark:hover:bg-warning/10 h-12 w-full border-2 font-semibold transition-all"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              create an apple id
            </Button>
          </div>

          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center">
              <span className="border-muted-foreground/20 w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background text-muted-foreground px-3 font-medium">
                or
              </span>
            </div>
          </div>

          <div className="bg-accent/10 border-accent/20 dark:bg-accent/5 dark:border-accent/20 rounded-lg border p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="text-accent-foreground mt-0.5 h-5 w-5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-accent-foreground dark:text-accent-foreground font-semibold">
                  already have an account?
                </p>
                <p className="text-accent-foreground/90 dark:text-accent-foreground/80 mt-1">
                  existing users can continue using their current login method
                </p>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/50 w-full font-medium"
          >
            continue browsing without account
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
