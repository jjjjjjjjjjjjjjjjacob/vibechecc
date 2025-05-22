"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, Menu, X } from "lucide-react"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { currentUser } from "@/lib/sample-data"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"

export function Header() {
  const pathname = usePathname()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="flex items-center gap-2 md:gap-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-transparent">
              vibecheck
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link
              href="/"
              className={cn(
                "transition-colors hover:text-foreground/80 lowercase",
                pathname === "/" ? "text-foreground font-medium" : "text-foreground/60",
              )}
            >
              discover
            </Link>
            <Link
              href="/my-vibes"
              className={cn(
                "transition-colors hover:text-foreground/80 lowercase",
                pathname === "/my-vibes" ? "text-foreground font-medium" : "text-foreground/60",
              )}
            >
              my vibes
            </Link>
            <Link
              href="/profile"
              className={cn(
                "transition-colors hover:text-foreground/80 lowercase",
                pathname === "/profile" ? "text-foreground font-medium" : "text-foreground/60",
              )}
            >
              profile
            </Link>
          </nav>
        </div>

        <div className="flex items-center ml-auto gap-2">
          {isSearchOpen ? (
            <div className="relative flex-1 md:w-80 mr-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="search vibes..."
                className="w-full pl-8"
                autoFocus
                onBlur={() => setIsSearchOpen(false)}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-9 w-9"
                onClick={() => setIsSearchOpen(false)}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">close search</span>
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)} className="hidden md:flex">
              <Search className="h-5 w-5" />
              <span className="sr-only">search</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">toggle menu</span>
          </Button>

          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={currentUser.avatar || "/placeholder.svg"} alt={currentUser.name} />
                  <AvatarFallback>{currentUser.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="lowercase">my account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="lowercase">
                  profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/my-vibes" className="lowercase">
                  my vibes
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="lowercase">settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="lowercase">log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden border-t">
          <nav className="flex flex-col p-4 space-y-3 text-sm">
            <Link
              href="/"
              className={cn(
                "transition-colors hover:text-foreground/80 p-2 rounded-md lowercase",
                pathname === "/" ? "bg-muted font-medium" : "",
              )}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              discover
            </Link>
            <Link
              href="/my-vibes"
              className={cn(
                "transition-colors hover:text-foreground/80 p-2 rounded-md lowercase",
                pathname === "/my-vibes" ? "bg-muted font-medium" : "",
              )}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              my vibes
            </Link>
            <Link
              href="/profile"
              className={cn(
                "transition-colors hover:text-foreground/80 p-2 rounded-md lowercase",
                pathname === "/profile" ? "bg-muted font-medium" : "",
              )}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              profile
            </Link>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="search vibes..." className="w-full pl-8" />
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
