
"use client";

import { useEffect, useState, useCallback } from 'react';
import type { Paper, EducationalLevel, UserRole, Grade } from '@/lib/types'; // Added Grade
import { PaperCard } from './PaperCard';
import { PaperFilters } from './PaperFilters';
import { getPapersFromFirestore } from '@/lib/data'; 
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
  
  const [activeUiFilters, setActiveUiFilters] = useState<{ level?: EducationalLevel; subject?: string; year?: number; grade?: Grade; query?: string }>({});
  
  const [availableSubjectsAll, setAvailableSubjectsAll] = useState<string[]>([]);
  const [availableYearsAll, setAvailableYearsAll] = useState<number[]>([]);

  const [uiFilterOptions, setUiFilterOptions] = useState<{subjects: string[], years: number[]}>({subjects: [], years: []});


  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch all papers initially. Grade filtering for user context will happen client-side.
        const papersData = await getPapersFromFirestore(); 
        setAllPapers(papersData);
        
        const uniqueSubjects = Array.from(new Set(papersData.map(p => p.subject))).sort();
        const uniqueYears = Array.from(new Set(papersData.map(p => p.year))).sort((a, b) => b - a);
        setAvailableSubjectsAll(uniqueSubjects);
        setAvailableYearsAll(uniqueYears);
        setUiFilterOptions({subjects: uniqueSubjects, years: uniqueYears}); 
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

    // 1. User-contextual pre-filtering (if applicable)
    if (user && user.role === "High School" && user.grade) {
        // If UI filters are not set for level or grade, apply user's context
        if (!activeUiFilters.level && !activeUiFilters.grade) {
            basePapersForFiltering = basePapersForFiltering.filter(p => p.level === "High School" && p.grade === user.grade);
        }
    } else if (user && (user.role === "College" || user.role === "NCV" || user.role === "NATED" || user.role === "University")) {
        if (!activeUiFilters.level) { // Only apply if level filter not explicitly set
             basePapersForFiltering = basePapersForFiltering.filter(p => p.level === user.role);
        }
    }

    // 2. Update UI filter options based on the potentially pre-filtered set (or all if no user context filter applied)
    // This logic might need refinement if user context filter and UI filter interact in complex ways.
    // For now, let's keep UI options based on the *broader* set initially determined by role, or all papers.
    let papersForUiOptions = [...allPapers];
    if (user && (user.role === "High School" || user.role === "College" || user.role === "NCV" || user.role === "NATED" || user.role === "University")) {
      papersForUiOptions = allPapers.filter(p => p.level === user.role || (user.role === "High School" && p.level === "High School")); // Ensure options are relevant
    }
    currentAvailableSubjects = Array.from(new Set(papersForUiOptions.map(p => p.subject))).sort();
    currentAvailableYears = Array.from(new Set(papersForUiOptions.map(p => p.year))).sort((a, b) => b - a);
    setUiFilterOptions({subjects: currentAvailableSubjects, years: currentAvailableYears});
    
    // 3. Apply UI selected filters to the basePapersForFiltering
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
      if (activeUiFilters.level === "High School" && activeUiFilters.grade) {
        tempPapers = tempPapers.filter(p => p.grade === activeUiFilters.grade);
      }
    } else if (user && user.role === "High School" && user.grade && !activeUiFilters.grade) {
        // If user is HS with grade, and no level filter is set, but also no UI grade filter is set,
        // it means we use the user's grade from the initial basePapersForFiltering.
        // This case is covered by the initial basePapersForFiltering setup.
    }


    if (activeUiFilters.subject) {
      tempPapers = tempPapers.filter(p => p.subject === activeUiFilters.subject);
    }
    if (activeUiFilters.year) {
      tempPapers = tempPapers.filter(p => p.year === activeUiFilters.year);
    }
    
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredPapers.map((paper) => (
            <PaperCard key={paper.id} paper={paper} />
          ))}
        </div>
      ) : (
         <div className="text-center py-12 bg-card rounded-lg shadow">
            <Frown className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-medium text-foreground">No Papers Found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
                { (user && (user.role === "High School" || user.role === "College" || user.role === "NCV" || user.role === "NATED" || user.role === "University")) || Object.values(activeUiFilters).some(v => v) 
                  ? "Try adjusting your filter criteria or check back later. No papers match your current selection."
                  : "No papers available at the moment. Admins can upload new papers."
                }
            </p>
        </div>
      )}
    </div>
  );
}
