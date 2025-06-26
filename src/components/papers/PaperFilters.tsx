"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { educationalLevels, type EducationalLevel, grades, type Grade, universityYears, type UniversityYear, universityTypes, type UniversityType } from "@/lib/types"; 
import { FilterIcon, SearchIcon, XIcon } from "lucide-react";
import React, { useEffect, useState } from "react";

interface PaperFiltersProps {
  onFilterChange: (filters: { level?: EducationalLevel; subject?: string; year?: number; grade?: Grade; universityYear?: UniversityYear; universityType?: UniversityType; query?: string }) => void; 
  availableSubjects: string[];
  availableYears: number[];
}

const ALL_LEVELS_VALUE = "all-levels";
const ALL_SUBJECTS_VALUE = "all-subjects";
const ALL_YEARS_VALUE = "all-years";
const ALL_GRADES_VALUE = "all-grades";

export function PaperFilters({ onFilterChange, availableSubjects, availableYears }: PaperFiltersProps) {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<EducationalLevel | "">(""); 
  const [subject, setSubject] = useState("");
  const [year, setYear] = useState<number | "">("");
  const [grade, setGrade] = useState<Grade | "">("");
  const [universityYear, setUniversityYear] = useState<UniversityYear | "">("");
  const [universityType, setUniversityType] = useState<UniversityType | "">("");

  useEffect(() => {
    const timeoutId = setTimeout(() => {
        onFilterChange({ 
            query: query || undefined, 
            level: level || undefined, 
            subject: subject || undefined, 
            year: year || undefined,
            grade: (level === "High School" && grade) ? grade : undefined,
            universityYear: (level === "University" && universityYear) ? universityYear : undefined,
            universityType: (level === "University" && universityType) ? universityType : undefined,
        });
    }, 300); 
    return () => clearTimeout(timeoutId);
  }, [query, level, subject, year, grade, onFilterChange]);

  const handleResetFilters = () => {
    setQuery("");
    setLevel("");
    setSubject("");
    setYear("");
    setGrade("");
    setUniversityYear("");
    setUniversityType("");
    onFilterChange({});
  };

  const hasActiveFilters = query || level || subject || year || (level === "High School" && grade) || (level === "University" && (universityYear || universityType));

  return (
    <div className="mb-8 p-6 bg-card rounded-lg shadow">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        <div className="lg:col-span-2">
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
          <Select 
            value={level || ""} 
            onValueChange={(value) => {
                const newLevel = value === ALL_LEVELS_VALUE ? "" : value as EducationalLevel | "";
                setLevel(newLevel);
                if (newLevel !== "High School") {
                    setGrade(""); // Reset grade if level is not High School
                }
                if (newLevel !== "University") {
                    setUniversityYear(""); // Reset university year if level is not University
                    setUniversityType(""); // Reset university type if level is not University
                }
            }}
          >
            <SelectTrigger id="level-filter" className="mt-1">
              <SelectValue placeholder="Select Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_LEVELS_VALUE}>All Levels</SelectItem>
              {educationalLevels.map((level) => (
              <SelectItem key={level} value={level}>
                {level === "NCV" ? "NCV College" : 
                 level === "NATED" ? "NATED College" : 
                 level}
              </SelectItem>
            ))}
          </SelectContent>
        </div>
        {level === "High School" && (
             <div>
                <Label htmlFor="grade-filter" className="font-semibold">Grade</Label>
                <Select 
                    value={grade || ""} 
                    onValueChange={(value) => setGrade(value === ALL_GRADES_VALUE ? "" : value as Grade | "")}
                >
                    <SelectTrigger id="grade-filter" className="mt-1">
                    <SelectValue placeholder="Select Grade" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value={ALL_GRADES_VALUE}>All Grades</SelectItem>
                    {grades.map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
            </div>
        )}
        {level === "University" && (
             <>
                <div>
                    <Label htmlFor="university-year-filter" className="font-semibold">Year Level</Label>
                    <Select 
                        value={universityYear || ""} 
                        onValueChange={(value) => setUniversityYear(value === "all-university-years" ? "" : value as UniversityYear | "")}
                    >
                        <SelectTrigger id="university-year-filter" className="mt-1">
                        <SelectValue placeholder="Select Year" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="all-university-years">All Years</SelectItem>
                        {universityYears.map((year) => (
                            <SelectItem key={year} value={year}>{year}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="university-type-filter" className="font-semibold">Study Type</Label>
                    <Select 
                        value={universityType || ""} 
                        onValueChange={(value) => setUniversityType(value === "all-university-types" ? "" : value as UniversityType | "")}
                    >
                        <SelectTrigger id="university-type-filter" className="mt-1">
                        <SelectValue placeholder="Select Type" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="all-university-types">All Types</SelectItem>
                        {universityTypes.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>
             </>
        )}
        {(level !== "High School" && level !== "University" && <div className="hidden lg:block"></div>) /* Placeholder for grid alignment */}


        <div>
          <Label htmlFor="subject-filter" className="font-semibold">Subject</Label>
          <Select 
            value={subject || ""} 
            onValueChange={(value) => setSubject(value === ALL_SUBJECTS_VALUE ? "" : value)}
          >
            <SelectTrigger id="subject-filter" className="mt-1">
              <SelectValue placeholder="Select Subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_SUBJECTS_VALUE}>All Subjects</SelectItem>
              {availableSubjects.map((sbj) => (
                <SelectItem key={sbj} value={sbj}>{sbj}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="year-filter" className="font-semibold">Year</Label>
          <Select 
            value={year ? String(year) : ""} 
            onValueChange={(value) => setYear(value === ALL_YEARS_VALUE ? "" : (value ? parseInt(value) : ""))}
          >
            <SelectTrigger id="year-filter" className="mt-1">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_YEARS_VALUE}>All Years</SelectItem>
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