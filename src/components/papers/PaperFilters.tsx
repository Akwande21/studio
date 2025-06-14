"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { paperLevels, type PaperLevel } from "@/lib/types";
import { FilterIcon, SearchIcon, XIcon } from "lucide-react";
import React, { useEffect, useState } from "react";

interface PaperFiltersProps {
  onFilterChange: (filters: { level?: PaperLevel; subject?: string; year?: number; query?: string }) => void;
  availableSubjects: string[];
  availableYears: number[];
}

export function PaperFilters({ onFilterChange, availableSubjects, availableYears }: PaperFiltersProps) {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<PaperLevel | "">("");
  const [subject, setSubject] = useState("");
  const [year, setYear] = useState<number | "">("");

  useEffect(() => {
    const timeoutId = setTimeout(() => {
        onFilterChange({ 
            query: query || undefined, 
            level: level || undefined, 
            subject: subject || undefined, 
            year: year || undefined 
        });
    }, 300); // Debounce search query
    return () => clearTimeout(timeoutId);
  }, [query, level, subject, year, onFilterChange]);

  const handleResetFilters = () => {
    setQuery("");
    setLevel("");
    setSubject("");
    setYear("");
    onFilterChange({});
  };

  const hasActiveFilters = query || level || subject || year;

  return (
    <div className="mb-8 p-6 bg-card rounded-lg shadow">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div>
          <Label htmlFor="search-query" className="font-semibold">Search Papers</Label>
          <div className="relative mt-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="search-query"
              type="text"
              placeholder="Enter keywords, title..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="level-filter" className="font-semibold">Level</Label>
          <Select value={level} onValueChange={(value) => setLevel(value as PaperLevel | "")}>
            <SelectTrigger id="level-filter" className="mt-1">
              <SelectValue placeholder="Select Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Levels</SelectItem>
              {paperLevels.map((lvl) => (
                <SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="subject-filter" className="font-semibold">Subject</Label>
          <Select value={subject} onValueChange={(value) => setSubject(value)}>
            <SelectTrigger id="subject-filter" className="mt-1">
              <SelectValue placeholder="Select Subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Subjects</SelectItem>
              {availableSubjects.map((sbj) => (
                <SelectItem key={sbj} value={sbj}>{sbj}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="year-filter" className="font-semibold">Year</Label>
          <Select value={year ? String(year) : ""} onValueChange={(value) => setYear(value ? parseInt(value) : "")}>
            <SelectTrigger id="year-filter" className="mt-1">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Years</SelectItem>
              {availableYears.map((yr) => (
                <SelectItem key={yr} value={String(yr)}>{yr}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {hasActiveFilters && (
        <div className="mt-4 flex justify-end">
            <Button variant="ghost" onClick={handleResetFilters} className="text-sm">
                <XIcon className="mr-2 h-4 w-4" />
                Reset Filters
            </Button>
        </div>
      )}
    </div>
  );
}
