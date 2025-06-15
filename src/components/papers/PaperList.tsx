
"use client";

import { useEffect, useState, useCallback } from 'react';
import type { Paper, EducationalLevel } from '@/lib/types'; // Changed PaperLevel to EducationalLevel
import { PaperCard } from './PaperCard';
import { PaperFilters } from './PaperFilters';
import { getPapers, getUniqueSubjects, getUniqueYears } from '@/lib/data';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Frown } from 'lucide-react';

export function PaperList() {
  const [allPapers, setAllPapers] = useState<Paper[]>([]);
  const [filteredPapers, setFilteredPapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<{ level?: EducationalLevel; subject?: string; year?: number; query?: string }>({}); // Changed PaperLevel
  
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [papersData, subjectsData, yearsData] = await Promise.all([
          getPapers(),
          getUniqueSubjects(),
          getUniqueYears()
        ]);
        setAllPapers(papersData);
        setFilteredPapers(papersData); 
        setAvailableSubjects(subjectsData);
        setAvailableYears(yearsData);
      } catch (e) {
        setError("Failed to load papers. Please try again later.");
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const applyFilters = useCallback((currentFilters: typeof filters) => {
    let tempPapers = [...allPapers];
    if (currentFilters.query) {
      const queryLower = currentFilters.query.toLowerCase();
      tempPapers = tempPapers.filter(p => 
        p.title.toLowerCase().includes(queryLower) || 
        (p.description && p.description.toLowerCase().includes(queryLower))
      );
    }
    if (currentFilters.level) {
      tempPapers = tempPapers.filter(p => p.level === currentFilters.level);
    }
    if (currentFilters.subject) {
      tempPapers = tempPapers.filter(p => p.subject === currentFilters.subject);
    }
    if (currentFilters.year) {
      tempPapers = tempPapers.filter(p => p.year === currentFilters.year);
    }
    setFilteredPapers(tempPapers);
  }, [allPapers]);


  const handleFilterChange = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters);
    applyFilters(newFilters);
  }, [applyFilters]);


  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-md mx-auto">
        <Frown className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div>
      <PaperFilters 
        onFilterChange={handleFilterChange} 
        availableSubjects={availableSubjects}
        availableYears={availableYears}
      />
      {filteredPapers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPapers.map((paper) => (
            <PaperCard key={paper.id} paper={paper} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
            <Frown className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-lg font-medium text-foreground">No Papers Found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your search or filter criteria.
            </p>
        </div>
      )}
    </div>
  );
}
