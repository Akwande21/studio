
"use client";

import { useEffect, useState, useCallback } from 'react';
import type { Paper, EducationalLevel, UserRole } from '@/lib/types';
import { PaperCard } from './PaperCard';
import { PaperFilters } from './PaperFilters';
import { getPapers } from '@/lib/data';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Frown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function PaperList() {
  const { user } = useAuth();
  const [allPapers, setAllPapers] = useState<Paper[]>([]);
  const [filteredPapers, setFilteredPapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [activeUiFilters, setActiveUiFilters] = useState<{ level?: EducationalLevel; subject?: string; year?: number; query?: string }>({});
  
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const papersData = await getPapers();
        setAllPapers(papersData);
      } catch (e) {
        setError("Failed to load papers. Please try again later.");
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const applyFiltersAndSetDisplay = useCallback(() => {
    if (isLoading) return; // Don't run if initial data is still loading

    let basePapersForFiltering = allPapers;

    if (user && (user.role === "High School" || user.role === "College" || user.role === "University")) {
      const userEducationalLevel = user.role as EducationalLevel; // Safe cast due to the check
      basePapersForFiltering = allPapers.filter(p => p.level === userEducationalLevel);
    }

    const uniqueSubjects = Array.from(new Set(basePapersForFiltering.map(p => p.subject))).sort();
    const uniqueYears = Array.from(new Set(basePapersForFiltering.map(p => p.year))).sort((a, b) => b - a);
    setAvailableSubjects(uniqueSubjects);
    setAvailableYears(uniqueYears);
    
    let tempPapers = [...basePapersForFiltering];

    if (activeUiFilters.query) {
      const queryLower = activeUiFilters.query.toLowerCase();
      tempPapers = tempPapers.filter(p => 
        p.title.toLowerCase().includes(queryLower) || 
        (p.description && p.description.toLowerCase().includes(queryLower))
      );
    }
    if (activeUiFilters.level) {
      tempPapers = tempPapers.filter(p => p.level === activeUiFilters.level);
    }
    if (activeUiFilters.subject) {
      tempPapers = tempPapers.filter(p => p.subject === activeUiFilters.subject);
    }
    if (activeUiFilters.year) {
      tempPapers = tempPapers.filter(p => p.year === activeUiFilters.year);
    }
    setFilteredPapers(tempPapers);

  }, [allPapers, user, activeUiFilters, isLoading]);

  useEffect(() => {
    applyFiltersAndSetDisplay();
  }, [applyFiltersAndSetDisplay]);


  const handleFilterChange = useCallback((newFilters: typeof activeUiFilters) => {
    setActiveUiFilters(newFilters);
  }, []);


  if (isLoading && allPapers.length === 0) { // Show spinner only on initial load
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
                { (user && (user.role === "High School" || user.role === "College" || user.role === "University")) || Object.keys(activeUiFilters).length > 0 
                  ? "Try adjusting your filter criteria or check back later for more papers at your level."
                  : "No papers available at the moment. Please check back later."
                }
            </p>
        </div>
      )}
    </div>
  );
}
