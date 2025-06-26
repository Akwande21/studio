
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form"; // Added Controller
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { educationalLevels, type EducationalLevel, grades, type Grade } from "@/lib/types"; // Added grades, Grade
import { useToast } from "@/hooks/use-toast";
import { handlePaperUpload } from "@/lib/actions";
import { useState, useTransition, useEffect } from "react";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { UploadCloud, FileText, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ["application/pdf"];

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters.").max(100),
  description: z.string().min(10, "Description must be at least 10 characters.").max(500).optional(),
  level: z.enum(educationalLevels, { required_error: "Please select a level." }),
  subject: z.string().min(2, "Subject must be at least 2 characters.").max(50),
  year: z.coerce.number().min(2000, "Year must be 2000 or later.").max(new Date().getFullYear() + 1, `Year cannot be in the far future.`),
  grade: z.enum(grades).optional(), // Added grade
  file: z
    .custom<FileList>((val) => val instanceof FileList && val.length > 0, "Please select a PDF file.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `File size should be less than 5MB.`)
    .refine(
      (files) => ACCEPTED_FILE_TYPES.includes(files?.[0]?.type),
      "Only .pdf files are accepted."
    ),
}).superRefine((data, ctx) => {
  if (data.level === "High School" && !data.grade) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Grade is required if level is High School.",
      path: ["grade"],
    });
  }
});

export function FileUploadForm() {
  const [isPending, startTransition] = useTransition();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const { user } = useAuth(); 

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      subject: "",
      year: new Date().getFullYear(),
      grade: undefined,
    },
  });

  const selectedLevel = form.watch("level");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to upload papers.", variant: "destructive" });
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("title", values.title);
      if (values.description) formData.append("description", values.description);
      formData.append("level", values.level);
      formData.append("subject", values.subject);
      formData.append("year", String(values.year));
      if (values.level === "High School" && values.grade) {
        formData.append("grade", values.grade);
      }
      formData.append("file", values.file[0]);
      formData.append("uploaderId", user.id); 

      try {
        const result = await handlePaperUpload(formData);
        if (result.success && result.paper) {
          toast({
            title: "Upload Successful",
            description: `Paper "${result.paper.title}" has been added.`,
          });
          form.reset();
          setSelectedFile(null);
        } else {
          if (result.errors) {
            console.error("Server validation errors (payload):", result.errors);
          }
          toast({
            title: "Upload Failed",
            description: result.message || (result.errors ? `Details: ${JSON.stringify(result.errors)}` : "An unknown error occurred."),
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Unexpected error during paper upload:", error);
        toast({
          title: "Upload Error",
          description: "An unexpected error occurred during upload. Check console for details.",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-card p-6 rounded-lg shadow-md">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Paper Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Advanced Calculus Midterm Exam" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="A brief description of the paper's content and scope." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="level"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Level</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    field.onChange(value);
                    if (value !== "High School") {
                      form.setValue("grade", undefined); // Clear grade if not High School
                    }
                  }} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select education level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {educationalLevels.map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          {selectedLevel === "High School" && (
            <FormField
              control={form.control}
              name="grade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grade</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {grades.map(g => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
         <div className="grid md:grid-cols-2 gap-6">
            <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                    <Input placeholder="e.g., Mathematics" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Year</FormLabel>
                    <FormControl>
                    <Input type="number" placeholder="e.g., 2024" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>
        <FormField
          control={form.control}
          name="file"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Question Paper (PDF)</FormLabel>
              <FormControl>
                <div className="space-y-4">
                  <Input 
                    type="file" 
                    accept="application/pdf"
                    onChange={(e) => {
                      const files = e.target.files;
                      field.onChange(files);
                      setSelectedFile(files?.[0] || null);
                    }}
                  />
                  {selectedFile && (
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <FileText className="h-8 w-8 text-red-500" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedFile(null);
                          field.onChange(null);
                          const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                          if (fileInput) fileInput.value = '';
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </FormControl>
              <FormDescription>
                Upload the question paper in PDF format. Max size: 5MB.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full sm:w-auto" disabled={isPending || !user}>
          {isPending ? <LoadingSpinner size={20} className="mr-2" /> : <UploadCloud className="mr-2 h-4 w-4" />}
          Upload Paper
        </Button>
      </form>
    </Form>
  );
}
