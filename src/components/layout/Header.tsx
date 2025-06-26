"use client";
import { Button } from '@/components/ui/button';
import { Menu, X, FileText, Calculator, User, LogOut, Settings, BookOpen } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '../shared/Logo';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';
import { useIsMobile } from '@/hooks/use-mobile';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const isMobile = useIsMobile();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 sm:h-16 items-center justify-between px-2 sm:px-4">
        <div className="flex items-center gap-2">
          <Logo />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-4 lg:gap-6">
          <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
            Home
          </Link>
          <Link href="/calculator" className="text-sm font-medium hover:text-primary transition-colors">
            Calculator
          </Link>
          {user && (
            <Link href="/bookmarks" className="text-sm font-medium hover:text-primary transition-colors">
              Bookmarks
            </Link>
          )}
        </nav>

        {/* Desktop Auth */}
        <div className="hidden md:flex items-center gap-1 lg:gap-2">
          <ThemeToggle />
          {user ? (
            <div className="flex items-center gap-1 lg:gap-2">
              <span className="text-xs lg:text-sm text-muted-foreground max-w-32 lg:max-w-none truncate">
                Welcome, {user.displayName || user.email}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-0 lg:mr-1" />
                <span className="hidden lg:inline">Logout</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1 lg:gap-2">
              <Link href="/auth/signin">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm">Sign Up</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden p-1"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="container px-2 sm:px-4 py-3 sm:py-4 space-y-3 sm:space-y-4">
            <nav className="flex flex-col space-y-2 sm:space-y-3">
              <Link 
                href="/" 
                className="flex items-center gap-2 text-sm font-medium hover:text-primary p-2 rounded-md hover:bg-muted/50"
                onClick={() => setIsMenuOpen(false)}
              >
                <BookOpen className="h-4 w-4" />
                Home
              </Link>
              <Link 
                href="/calculator" 
                className="flex items-center gap-2 text-sm font-medium hover:text-primary p-2 rounded-md hover:bg-muted/50"
                onClick={() => setIsMenuOpen(false)}
              >
                <Calculator className="h-4 w-4" />
                Calculator
              </Link>
              {user && (
                <Link 
                  href="/bookmarks" 
                  className="flex items-center gap-2 text-sm font-medium hover:text-primary p-2 rounded-md hover:bg-muted/50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FileText className="h-4 w-4" />
                  Bookmarks
                </Link>
              )}
            </nav>

            <div className="border-t pt-3 sm:pt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Theme</span>
                <ThemeToggle />
              </div>

              {user ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground break-words">
                    Welcome, {user.displayName || user.email}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                    className="w-full"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link href="/auth/signin" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/signup" onClick={() => setIsMenuOpen(false)}>
                    <Button size="sm" className="w-full">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}