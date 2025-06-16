
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { educationalLevels, type EducationalLevel } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { handlePaperUpload } from "@/lib/actions";
import { useState, useTransition } from "react";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { UploadCloud } from "lucide-react";
import { useAuth } from "@/hooks/useAuth"; // Import useAuth

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ["application/pdf"];

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters.").max(100),
  description: z.string().min(10, "Description must be at least 10 characters.").max(500).optional(),
  level: z.enum(educationalLevels, { required_error: "Please select a level." }),
  subject: z.string().min(2, "Subject must be at least 2 characters.").max(50),
  year: z.coerce.number().min(2000, "Year must be 2000 or later.").max(new Date().getFullYear() + 1, `Year cannot be in the far future.`),
  file: z
    .custom<FileList>((val) => val instanceof FileList && val.length > 0, "Please select a PDF file.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `File size should be less than 5MB.`)
    .refine(
      (files) => ACCEPTED_FILE_TYPES.includes(files?.[0]?.type),
      "Only .pdf files are accepted."
    ),
});

export function FileUploadForm() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { user } = useAuth(); // Get current user

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      subject: "",
      year: new Date().getFullYear(),
    },
  });

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
      formData.append("file", values.file[0]);
      formData.append("uploaderId", user.id); // Add uploaderId

      try {
        const result = await handlePaperUpload(formData);
        if (result.success && result.paper) {
          toast({
            title: "Upload Successful",
            description: `Paper "${result.paper.title}" has been added.`,
          });
          form.reset();
        } else {
          toast({
            title: "Upload Failed",
            description: result.message || (result.errors ? JSON.stringify(result.errors) : "An unknown error occurred."),
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Upload Error",
          description: "An unexpected error occurred during upload.",
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
        <div className="grid md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="level"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Level</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                <Input 
                  type="file" 
                  accept="application/pdf"
                  onChange={(e) => field.onChange(e.target.files)} 
                />
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

