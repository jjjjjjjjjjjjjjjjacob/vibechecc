import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Camera, User } from 'lucide-react';
import { cn } from '@/utils/tailwind-utils';

interface AvatarPickerProps {
  currentImageUrl?: string;
  onImageChange: (imageUrl: string, file?: File) => void;
  userName?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AvatarPicker({
  currentImageUrl,
  onImageChange,
  userName = 'User',
  size = 'md',
  className,
}: AvatarPickerProps) {
  const [previewUrl, setPreviewUrl] = React.useState(currentImageUrl || '');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-20 w-20',
    lg: 'h-24 w-24',
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        setPreviewUrl(url);
        onImageChange(url, file);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Generate avatar from user initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={cn('flex justify-center', className)}>
      <div
        className="relative cursor-pointer"
        onClick={triggerFileInput}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            triggerFileInput();
          }
        }}
        tabIndex={0}
        role="button"
        aria-label="Change avatar"
      >
        {/* Gradient border wrapper */}
        <div
          className={cn(
            'from-theme-primary to-theme-secondary rounded-full bg-gradient-to-r p-1 transition-transform hover:scale-105',
            sizeClasses[size]
          )}
        >
          <Avatar className={cn(sizeClasses[size], 'bg-background')}>
            <AvatarImage
              src={previewUrl}
              alt={userName}
              className="object-cover"
            />
            <AvatarFallback className="from-theme-primary/10 to-theme-secondary/10 dark:from-theme-primary/20 dark:to-theme-secondary/20 bg-gradient-to-r">
              {previewUrl ? (
                <User className="text-primary h-6 w-6" />
              ) : (
                <span className="text-primary text-lg font-semibold">
                  {getInitials(userName)}
                </span>
              )}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Edit button overlay */}
        <Button
          type="button"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            triggerFileInput();
          }}
          className="bg-primary text-primary-foreground hover:bg-primary/90 absolute -right-1 -bottom-1 h-8 w-8 rounded-full p-0 transition-transform hover:scale-110"
        >
          <Camera className="h-4 w-4" />
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    </div>
  );
}
