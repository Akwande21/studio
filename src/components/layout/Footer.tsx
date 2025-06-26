"use client"; // Add "use client" for useAuth hook

import { Logo } from '@/components/shared/Logo';
import Link from 'next/link';
import { Button } from '../ui/button';
import { useAuth } from '@/hooks/useAuth'; // Import useAuth

export function Footer() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex flex-col items-center justify-between gap-3 sm:gap-4 md:h-16 md:flex-row px-2 sm:px-4 py-4 sm:py-6 md:py-0">
        <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
          <Logo />
          <span className="text-xs sm:text-sm text-muted-foreground">
            © 2024 PaperVault. All rights reserved.
          </span>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
          <Link href="/contact-admin" className="hover:text-primary transition-colors">
            Contact Admin
          </Link>
          <span className="hidden sm:inline">•</span>
          <Link href="#" className="hover:text-primary transition-colors">
            Privacy Policy
          </Link>
          <span className="hidden sm:inline">•</span>
          <Link href="#" className="hover:text-primary transition-colors">
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
}