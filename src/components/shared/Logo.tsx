import { BookOpenText } from 'lucide-react';
import Link from 'next/link';

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-2 text-primary ${className}`} aria-label="PaperTrail Home">
      <BookOpenText className="h-7 w-7 md:h-8 md:w-8" />
      <span className="text-xl md:text-2xl font-headline font-semibold">PaperTrail</span>
    </Link>
  );
}
