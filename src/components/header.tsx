import { Link, useRouter } from "@tanstack/react-router"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Search, Menu, X } from "lucide-react"
import { useState } from "react"
import { cn } from "../utils/utils"
import { ThemeToggle } from "./theme-toggle"
import { 
  SignedIn, 
  SignedOut, 
  UserButton, 
  SignInButton,
} from "@clerk/tanstack-react-start"

export function Header() {
  const router = useRouter()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  // Get the current route to highlight active links
  const currentPath = router.state.location.pathname

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="flex items-center gap-2 md:gap-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-bold bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-transparent">
              vibecheck
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link
              to="/"
              className={cn(
                "transition-colors hover:text-foreground/80 lowercase",
                currentPath === "/" ? "text-foreground font-medium" : "text-foreground/60",
              )}
            >
              discover
            </Link>
            <SignedIn>
              <Link
                to="/vibes/my-vibes"
                className={cn(
                  "transition-colors hover:text-foreground/80 lowercase",
                  currentPath === "/vibes/my-vibes" ? "text-foreground font-medium" : "text-foreground/60",
                )}
              >
                my vibes
              </Link>
              <Link
                to="/profile"
                className={cn(
                  "transition-colors hover:text-foreground/80 lowercase",
                  currentPath === "/profile" ? "text-foreground font-medium" : "text-foreground/60",
                )}
              >
                profile
              </Link>
            </SignedIn>
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
          
          <SignedIn>
            <UserButton />
          </SignedIn>
          
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="outline" size="sm">
                sign in
              </Button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden border-t">
          <nav className="flex flex-col p-4 space-y-3 text-sm">
            <Link
              to="/"
              className={cn(
                "transition-colors hover:text-foreground/80 p-2 rounded-md lowercase",
                currentPath === "/" ? "bg-muted font-medium" : "",
              )}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              discover
            </Link>
            <SignedIn>
              <Link
                to="/vibes/my-vibes"
                className={cn(
                  "transition-colors hover:text-foreground/80 p-2 rounded-md lowercase",
                  currentPath === "/vibes/my-vibes" ? "bg-muted font-medium" : "",
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                my vibes
              </Link>
              <Link
                to="/profile"
                className={cn(
                  "transition-colors hover:text-foreground/80 p-2 rounded-md lowercase",
                  currentPath === "/profile" ? "bg-muted font-medium" : "",
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                profile
              </Link>
            </SignedIn>
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