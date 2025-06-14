export function Footer() {
  return (
    <footer className="border-t border-border/40 py-6 md:py-8">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
        <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
          &copy; {new Date().getFullYear()} PaperTrail. All rights reserved.
        </p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {/* Add links like Privacy Policy, Terms of Service if needed */}
        </div>
      </div>
    </footer>
  );
}
