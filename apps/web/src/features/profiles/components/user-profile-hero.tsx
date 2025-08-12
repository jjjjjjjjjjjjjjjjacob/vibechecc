/**
 * user profile hero module.
 * enhanced documentation for clarity and maintenance.
 */
import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CalendarDays,
  Twitter,
  Instagram,
  Globe,
  Star,
  Heart,
  Sparkles,
} from 'lucide-react';

interface UserProfileHeroProps {
  displayName: string;
  username: string;
  bio?: string;
  imageUrl?: string;
  joinDate: string;
  vibeCount: number;
  averageReceivedRating?: number;
  receivedRatingsCount?: number;
  socials?: {
    twitter?: string;
    instagram?: string;
    website?: string;
  };
  children: React.ReactNode; // Tab content
  isOwnProfile?: boolean;
}

export function UserProfileHero({
  displayName,
  username,
  bio,
  imageUrl,
  joinDate,
  vibeCount,
  averageReceivedRating,
  receivedRatingsCount,
  socials,
  children,
  isOwnProfile = false,
}: UserProfileHeroProps) {
  return (
    <div className="from-background via-background to-theme-primary/10 min-h-screen bg-gradient-to-br">
      <div className="container mx-auto space-y-6 px-4 py-6">
        <div className="mx-auto max-w-5xl">
          {/* Hero Profile Section */}
          <div
            className={`bg-background/80 border-theme-primary/20 relative overflow-hidden rounded-2xl p-6 shadow-xl backdrop-blur-md sm:p-8`}
          >
            <div className={`bg-background absolute inset-0 opacity-20`} />
            <div className="relative z-10">
              <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:gap-8 sm:text-left">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div
                    className={`bg-theme-primary/20 absolute -inset-3 rounded-full opacity-60 blur-xl`}
                  />
                  <div
                    className={`from-theme-primary/10 to-theme-secondary/10 border-theme-primary/30 border-theme-primary/40 relative rounded-full bg-gradient-to-r p-1.5`}
                  >
                    <Avatar
                      className={`border-theme-primary/50 h-28 w-28 sm:h-32 sm:w-32`}
                    >
                      <AvatarImage
                        src={imageUrl}
                        alt={displayName}
                        className="object-cover"
                      />
                      <AvatarFallback
                        className={`bg-background text-primary-foreground text-2xl font-bold sm:text-3xl`}
                      >
                        {displayName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>

                {/* Profile Info */}
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <h1 className="text-primary-foreground text-3xl font-bold lowercase drop-shadow-lg sm:text-4xl">
                      {displayName}
                    </h1>
                    <p className="text-primary-foreground/70 text-lg font-medium drop-shadow-md sm:text-xl">
                      @{username}
                    </p>
                  </div>

                  {/* Bio */}
                  {bio && (
                    <div className="max-w-xl">
                      <p className="text-primary-foreground/80 text-sm leading-relaxed drop-shadow-sm sm:text-base">
                        {bio}
                      </p>
                    </div>
                  )}

                  {/* Stats Pills */}
                  <div className="flex flex-wrap gap-3">
                    <div className="border-primary-foreground/20 bg-primary-foreground/15 rounded-full border px-3 py-1.5 backdrop-blur">
                      <div className="text-primary-foreground flex items-center gap-2">
                        <CalendarDays className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">
                          joined {joinDate}
                        </span>
                      </div>
                    </div>
                    <div className="border-primary-foreground/20 bg-primary-foreground/15 rounded-full border px-3 py-1.5 backdrop-blur">
                      <div className="text-primary-foreground flex items-center gap-2">
                        <Heart className="h-3.5 w-3.5" />
                        <span className="text-xs font-bold">{vibeCount}</span>
                        <span className="text-xs font-medium">vibes</span>
                      </div>
                    </div>
                    {averageReceivedRating && averageReceivedRating > 0 && (
                      <div className="border-primary-foreground/20 bg-primary-foreground/15 rounded-full border px-3 py-1.5 backdrop-blur">
                        <div className="text-primary-foreground flex items-center gap-2">
                          <Star className="h-3.5 w-3.5 fill-yellow-300 text-yellow-300" />
                          <span className="text-xs font-bold">
                            {averageReceivedRating.toFixed(1)}
                          </span>
                          <span className="text-xs font-medium">
                            ({receivedRatingsCount} reviews)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Social Links */}
                  {socials && (
                    <div className="flex gap-3">
                      {socials.twitter && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 transition-all hover:scale-105"
                        >
                          <a
                            href={`https://twitter.com/${socials.twitter}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Twitter className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {socials.instagram && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 transition-all hover:scale-105"
                        >
                          <a
                            href={`https://instagram.com/${socials.instagram}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Instagram className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {socials.website && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 transition-all hover:scale-105"
                        >
                          <a
                            href={socials.website}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Globe className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <Tabs defaultValue="vibes" className="w-full">
            <div className="mt-12 mb-8 flex justify-center">
              <TabsList className="bg-background/60 rounded-2xl border-0 p-1.5 shadow-2xl backdrop-blur-md">
                <TabsTrigger
                  value="vibes"
                  className={`data-[state=active]:from-theme-primary data-[state=active]:to-theme-secondary hover:bg-muted/10 data-[state=active]:text-primary-foreground rounded-xl px-6 py-3 font-medium lowercase transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:shadow-lg`}
                >
                  <Heart className="mr-2 h-4 w-4" />
                  vibes
                </TabsTrigger>
                {!isOwnProfile && (
                  <TabsTrigger
                    value="reviews"
                    className={`data-[state=active]:from-theme-primary data-[state=active]:to-theme-secondary hover:bg-muted/10 data-[state=active]:text-primary-foreground rounded-xl px-6 py-3 font-medium lowercase transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:shadow-lg`}
                  >
                    <Star className="mr-2 h-4 w-4" />
                    reviews
                  </TabsTrigger>
                )}
                <TabsTrigger
                  value="about"
                  className={`data-[state=active]:from-theme-primary data-[state=active]:to-theme-secondary hover:bg-muted/10 data-[state=active]:text-primary-foreground rounded-xl px-6 py-3 font-medium lowercase transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:shadow-lg`}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  about
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Content */}
            {children}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
