
"use client";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/shared/Logo';
import { useAuth } from '@/hooks/useAuth';
import { UserCircle, LogIn, LogOut, Bookmark, HomeIcon, UploadCloud, Moon, Sun, CalculatorIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function Header() {
  const { user, signOut, isAuthenticated, loading } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Logo />
        <nav className="flex items-center gap-1 md:gap-2">
          <Button variant="ghost" asChild>
            <Link href="/" className="flex items-center gap-1 text-sm md:text-base">
              <HomeIcon className="mr-1 h-4 w-4" /> Home
            </Link>
          </Button>
           <Button variant="ghost" asChild>
            <Link href="/calculator" className="flex items-center gap-1 text-sm md:text-base">
              <CalculatorIcon className="mr-1 h-4 w-4" /> Calculator
            </Link>
          </Button>
          {isAuthenticated && (
            <Button variant="ghost" asChild>
              <Link href="/bookmarks" className="flex items-center gap-1 text-sm md:text-base">
                <Bookmark className="mr-1 h-4 w-4" /> Bookmarks
              </Link>
            </Button>
          )}
          
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              aria-label="Toggle theme"
              className="h-8 w-8 md:h-9 md:w-9"
            >
              {theme === "light" ? (
                <Moon className="h-4 w-4 md:h-5 md:w-5" />
              ) : (
                <Sun className="h-4 w-4 md:h-5 md:w-5" />
              )}
            </Button>
          )}

          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded-md bg-muted"></div>
          ) : isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatarUrl || `https://placehold.co/100x100/64B5F6/FFFFFF?text=${user.name.charAt(0)}`} alt={user.name} data-ai-hint="user avatar" />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground capitalize">
                      Role: {user.role}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <UserCircle className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                {user.role === 'Admin' && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin/upload" className="cursor-pointer">
                      <UploadCloud className="mr-2 h-4 w-4" />
                      Upload Paper
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" asChild className="text-sm md:text-base">
                <Link href="/auth/signin" className="flex items-center gap-1">
                  <LogIn className="mr-1 h-4 w-4" /> Sign In
                </Link>
              </Button>
              <Button asChild size="sm" className="text-sm md:text-base px-3 md:px-4">
                <Link href="/auth/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
