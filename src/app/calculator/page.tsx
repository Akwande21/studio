
import { ScientificCalculator } from '@/components/tools/ScientificCalculator';
import { Calculator } from 'lucide-react';

export default function CalculatorPage() {
  return (
    <div className="container mx-auto py-8 px-4 flex flex-col items-center">
      <div className="mb-8 text-center">
        <Calculator className="mx-auto h-12 w-12 text-primary mb-4" />
        <h1 className="text-4xl font-bold font-headline">Scientific Calculator</h1>
        <p className="text-muted-foreground mt-2">Perform your calculations here.</p>
      </div>
      <ScientificCalculator />
    </div>
  );
}
