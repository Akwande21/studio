
import { Logo } from '@/components/shared/Logo';

export function Footer() {
  return (
    <footer className="border-t border-border/40 py-6 md:py-8">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
        <Logo className="text-sm" />
        <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-right">
          &copy; {new Date().getFullYear()} PaperVault. All rights reserved.
        </p>
        {/* Add links like Privacy Policy, Terms of Service if needed */}
      </div>
    </footer>
  );
}
