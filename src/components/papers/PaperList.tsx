
"use client";

import { useEffect, useState, useCallback } from 'react';
import type { Paper, EducationalLevel, UserRole } from '@/lib/types';
import { PaperCard } from './PaperCard';
import { PaperFilters } from './PaperFilters';
import { getPapersFromFirestore } from '@/lib/data'; // Changed to Firestore
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Frown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function PaperList() {
  const { user } = useAuth();
  const [allPapers, setAllPapers] = useState<Paper[]>([]); // Stores all papers fetched initially
  const [filteredPapers, setFilteredPapers] = useState<Paper[]>([]); // Papers to display after filtering
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [activeUiFilters, setActiveUiFilters] = useState<{ level?: EducationalLevel; subject?: string; year?: number; query?: string }>({});
  
  // Available subjects and years for filters, derived from *all* papers, not just role-filtered ones
  const [availableSubjectsAll, setAvailableSubjectsAll] = useState<string[]>([]);
  const [availableYearsAll, setAvailableYearsAll] = useState<number[]>([]);

  // Available subjects and years for UI filters, derived from *role-filtered* papers if applicable
  const [uiFilterOptions, setUiFilterOptions] = useState<{subjects: string[], years: number[]}>({subjects: [], years: []});


  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const papersData = await getPapersFromFirestore(); // Fetch all papers initially
        setAllPapers(papersData);
        // Set initial available filters based on all papers
        const uniqueSubjects = Array.from(new Set(papersData.map(p => p.subject))).sort();
        const uniqueYears = Array.from(new Set(papersData.map(p => p.year))).sort((a, b) => b - a);
        setAvailableSubjectsAll(uniqueSubjects);
        setAvailableYearsAll(uniqueYears);
        setUiFilterOptions({subjects: uniqueSubjects, years: uniqueYears}); // Default to all
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
    if (isLoading && allPapers.length === 0) return;

    let basePapersForFiltering = [...allPapers];
    let currentAvailableSubjects = [...availableSubjectsAll];
    let currentAvailableYears = [...availableYearsAll];

    // If user has a specific educational role, pre-filter papers for them
    // and also adjust the available filter options (subjects, years)
    if (user && (user.role === "High School" || user.role === "College" || user.role === "University")) {
      const userEducationalLevel = user.role as EducationalLevel;
      basePapersForFiltering = allPapers.filter(p => p.level === userEducationalLevel);
      
      // Update UI filter options based on this role-filtered subset
      currentAvailableSubjects = Array.from(new Set(basePapersForFiltering.map(p => p.subject))).sort();
      currentAvailableYears = Array.from(new Set(basePapersForFiltering.map(p => p.year))).sort((a, b) => b - a);
    }
    setUiFilterOptions({subjects: currentAvailableSubjects, years: currentAvailableYears});
    
    let tempPapers = [...basePapersForFiltering];

    // Apply UI selected filters
    if (activeUiFilters.query) {
      const queryLower = activeUiFilters.query.toLowerCase();
      tempPapers = tempPapers.filter(p => 
        p.title.toLowerCase().includes(queryLower) || 
        (p.description && p.description.toLowerCase().includes(queryLower))
      );
    }
    if (activeUiFilters.level) {
      // If user has a role, this filter might be redundant or further restrict
      tempPapers = tempPapers.filter(p => p.level === activeUiFilters.level);
    }
    if (activeUiFilters.subject) {
      tempPapers = tempPapers.filter(p => p.subject === activeUiFilters.subject);
    }
    if (activeUiFilters.year) {
      tempPapers = tempPapers.filter(p => p.year === activeUiFilters.year);
    }
    
    // Add user's bookmark status to each paper
    const papersWithBookmarks = tempPapers.map(p => ({
      ...p,
      isBookmarked: user?.bookmarkedPaperIds?.includes(p.id) ?? false,
    }));

    setFilteredPapers(papersWithBookmarks);

  }, [allPapers, user, activeUiFilters, isLoading, availableSubjectsAll, availableYearsAll]);

  useEffect(() => {
    applyFiltersAndSetDisplay();
  }, [applyFiltersAndSetDisplay]);


  const handleFilterChange = useCallback((newFilters: typeof activeUiFilters) => {
    setActiveUiFilters(newFilters);
  }, []);


  if (isLoading && allPapers.length === 0) {
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
        availableSubjects={uiFilterOptions.subjects}
        availableYears={uiFilterOptions.years}
      />
      {filteredPapers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPapers.map((paper) => (
            <PaperCard key={paper.id} paper={paper} />
          ))}
        </div>
      ) : (
         <div className="text-center py-12 bg-card rounded-lg shadow">
            <Frown className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-medium text-foreground">No Papers Found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
                { (user && (user.role === "High School" || user.role === "College" || user.role === "University")) || Object.values(activeUiFilters).some(v => v) 
                  ? "Try adjusting your filter criteria or check back later. No papers match your current selection."
                  : "No papers available at the moment. Admins can upload new papers."
                }
            </p>
        </div>
      )}
    </div>
  );
}

