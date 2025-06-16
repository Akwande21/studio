
import { Logo } from '@/components/shared/Logo';
import Link from 'next/link';
import { Button } from '../ui/button';

export function Footer() {
  return (
    <footer className="border-t border-border/40 py-6 md:py-8">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
        <Logo className="text-sm" />
        <nav className="flex gap-4 items-center">
            <Button variant="link" asChild className="text-muted-foreground hover:text-primary p-0 h-auto text-sm">
                <Link href="/contact-admin">Contact Admin</Link>
            </Button>
            {/* Add other links like Privacy Policy, Terms of Service if needed */}
        </nav>
        <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-right">
          &copy; {new Date().getFullYear()} PaperVault. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
