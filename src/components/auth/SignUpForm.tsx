
"use client";
import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole, Grade, UniversityYear, UniversityType } from '@/lib/types'; // Added Grade, UniversityYear, UniversityType
import { userRoles, grades, universityYears, universityTypes } from '@/lib/types'; // Added grades, universityYears, universityTypes
import Link from 'next/link';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function SignUpForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');
  const [grade, setGrade] = useState<Grade | ''>(''); // Added grade state
  const [universityYear, setUniversityYear] = useState<UniversityYear | ''>(''); // Added university year state
  const [universityType, setUniversityType] = useState<UniversityType | ''>(''); // Added university type state
  const { signUp, loading } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!role) {
        toast({title: "Role Required", description: "Please select a role.", variant: "destructive"});
        return;
    }
    if (role === "High School" && !grade) {
        toast({title: "Grade Required", description: "Please select your grade for High School.", variant: "destructive"});
        return;
    }
    if (role === "University" && (!universityYear || !universityType)) {
        toast({title: "University Details Required", description: "Please select your year level and study type for University.", variant: "destructive"});
        return;
    }
    if (!password) {
        toast({title: "Password Required", description: "Please enter a password.", variant: "destructive"});
        return;
    }
    await signUp({ 
      name, 
      email, 
      password, 
      role, 
      grade: role === "High School" ? grade as Grade : undefined,
      universityYear: role === "University" ? universityYear as UniversityYear : undefined,
      universityType: role === "University" ? universityType as UniversityType : undefined
    });
  };

  const selectableRoles = userRoles.filter(r => r !== 'Admin');

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-headline">Create an Account</CardTitle>
        <CardDescription>Join PaperVault to enhance your studies.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              className="focus-visible:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="focus-visible:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="focus-visible:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">I am a...</Label>
            <Select value={role} onValueChange={(value) => { 
              setRole(value as UserRole); 
              if (value !== "High School") setGrade(''); 
              if (value !== "University") { setUniversityYear(''); setUniversityType(''); }
            }} required>
              <SelectTrigger id="role" className="focus-visible:ring-primary">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                {selectableRoles.map((lvl) => (
                  <SelectItem key={lvl} value={lvl}>
                    {lvl === "High School" ? "High School Student" : 
                     lvl === "NCV" ? "NCV Student" :
                     lvl === "NATED" ? "NATED Student" :
                     `${lvl} Student`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {role === "High School" && (
            <div className="space-y-2">
              <Label htmlFor="grade">Grade Level</Label>
              <Select value={grade} onValueChange={(value) => setGrade(value as Grade)} required>
                <SelectTrigger id="grade" className="focus-visible:ring-primary">
                  <SelectValue placeholder="Select your grade" />
                </SelectTrigger>
                <SelectContent>
                  {grades.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {role === "University" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="universityYear">Year Level</Label>
                <Select value={universityYear} onValueChange={(value) => setUniversityYear(value as UniversityYear)} required>
                  <SelectTrigger id="universityYear" className="focus-visible:ring-primary">
                    <SelectValue placeholder="Select your year level" />
                  </SelectTrigger>
                  <SelectContent>
                    {universityYears.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="universityType">Study Type</Label>
                <Select value={universityType} onValueChange={(value) => setUniversityType(value as UniversityType)} required>
                  <SelectTrigger id="universityType" className="focus-visible:ring-primary">
                    <SelectValue placeholder="Select study type" />
                  </SelectTrigger>
                  <SelectContent>
                    {universityTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={loading || !role || (role === "High School" && !grade) || (role === "University" && (!universityYear || !universityType)) }>
            {loading ? <LoadingSpinner size={20} className="mr-2"/> : <UserPlus className="mr-2 h-4 w-4" /> }
            Sign Up
          </Button>
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Button variant="link" asChild className="p-0 h-auto text-primary">
              <Link href="/auth/signin">Sign in</Link>
            </Button>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
