
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { handleSendSuggestionToAdmin } from "@/lib/actions";
import { useState, useTransition, useEffect } from "react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Mail, Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const formSchema = z.object({
  name: z.string().optional(),
  email: z.string().email({ message: "Please enter a valid email address." }).optional().or(z.literal('')),
  subject: z.string().min(5, "Subject must be at least 5 characters.").max(100, "Subject cannot exceed 100 characters."),
  message: z.string().min(10, "Message must be at least 10 characters.").max(1000, "Message cannot exceed 1000 characters."),
});

type ContactAdminFormValues = z.infer<typeof formSchema>;

export function ContactAdminForm() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  const form = useForm<ContactAdminFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      form.setValue("name", user.name || "");
      form.setValue("email", user.email || "");
    } else {
      form.setValue("name", ""); // Clear if user logs out
      form.setValue("email", "");
    }
  }, [isAuthenticated, user, form]);

  async function onSubmit(values: ContactAdminFormValues) {
    startTransition(async () => {
      const formData = new FormData();
      if (values.name) formData.append("name", values.name);
      if (values.email) formData.append("email", values.email);
      formData.append("subject", values.subject);
      formData.append("message", values.message);
      if (isAuthenticated && user) {
        formData.append("userId", user.id); // Add userId if authenticated
      }

      const result = await handleSendSuggestionToAdmin(formData);

      if (result.success) {
        toast({
          title: "Suggestion Sent!",
          description: result.message,
        });
        form.reset({
            name: (isAuthenticated && user) ? user.name : "",
            email: (isAuthenticated && user) ? user.email : "",
            subject: "",
            message: ""
        });
      } else {
        toast({
          title: "Error Sending Suggestion",
          description: result.message || (result.errors ? JSON.stringify(result.errors) : "An unknown error occurred."),
          variant: "destructive",
        });
      }
    });
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader className="text-center">
        <Mail className="mx-auto h-10 w-10 text-primary mb-3" />
        <CardTitle className="text-2xl font-headline">Contact Admin</CardTitle>
        <CardDescription>Have a suggestion or need to report an issue? Let us know.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Name {isAuthenticated ? '(Optional)' : ''}</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} disabled={isPending || (isAuthenticated && !!user?.name)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Email {isAuthenticated ? '(Optional)' : ''}</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} disabled={isPending || (isAuthenticated && !!user?.email)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Feature Request for..." {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message / Suggestion</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please describe your suggestion or issue in detail."
                      rows={5}
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormDescription>
                    Your feedback helps us improve PaperVault.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full sm:w-auto" disabled={isPending}>
              {isPending ? <LoadingSpinner size={20} className="mr-2" /> : <Send className="mr-2 h-4 w-4" />}
              Send Suggestion
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

