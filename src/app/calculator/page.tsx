
import { ScientificCalculator } from '@/components/tools/ScientificCalculator';
import { Calculator } from 'lucide-react';

export default function CalculatorPage() {
  return (
    <div className="container mx-auto py-4 sm:py-8 px-2 sm:px-4 flex flex-col items-center min-h-screen">
      <div className="mb-4 sm:mb-8 text-center">
        <Calculator className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-primary mb-2 sm:mb-4" />
        <h1 className="text-2xl sm:text-4xl font-bold font-headline">Scientific Calculator</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">Perform your calculations here.</p>
      </div>
      <div className="w-full flex-1 flex items-start justify-center">
        <ScientificCalculator />
      </div>
    </div>
  );
}
