import { PaperList } from '@/components/papers/PaperList';
import { FileText, Search, BookOpen } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="container mx-auto py-4 sm:py-8 px-2 sm:px-4">
      <div className="mb-6 sm:mb-8 text-center">
        <div className="flex justify-center items-center gap-2 mb-3 sm:mb-4">
          <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          <h1 className="text-2xl sm:text-4xl font-bold font-headline">PaperVault</h1>
        </div>
        <p className="text-base sm:text-xl text-muted-foreground px-2">
          Your Academic Paper Hub - Search, Study, and Excel
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-6 mt-4 sm:mt-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <span>Find Papers</span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span>Study Smarter</span>
          </div>
        </div>
      </div>

      <PaperList />
    </div>
  );
}