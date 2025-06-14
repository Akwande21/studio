import { PaperList } from '@/components/papers/PaperList';

export default function HomePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl font-headline">
          Explore Past Papers
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg leading-8 text-muted-foreground">
          Find, study, and discuss question papers from various levels and subjects. 
          Use our AI tools to deepen your understanding.
        </p>
      </section>
      
      <PaperList />
    </div>
  );
}
