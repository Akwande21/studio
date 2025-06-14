
"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DownloadPaperButtonProps {
  paperName: string;
  downloadUrl: string;
}

export function DownloadPaperButton({ paperName, downloadUrl }: DownloadPaperButtonProps) {
  const { toast } = useToast();

  const handleDownload = () => {
    // This will attempt to download the file specified by downloadUrl.
    // In a real app, downloadUrl should point to an accessible PDF file.
    try {
      const link = document.createElement('a');
      link.href = downloadUrl;
      // Suggest a filename for the download.
      // Ensures it has a .pdf extension if not already in paperName or complex URL.
      const filename = paperName.toLowerCase().endsWith('.pdf') 
        ? paperName.replace(/ /g, '_')
        : `${paperName.replace(/ /g, '_')}.pdf`;
      link.setAttribute('download', filename); 
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Download Initiated",
        description: `Preparing to download ${filename}...`,
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download Failed",
        description: "Could not initiate the download. Please check the console for errors.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleDownload}>
      <Download className="mr-2 h-4 w-4" />
      Download
    </Button>
  );
}
