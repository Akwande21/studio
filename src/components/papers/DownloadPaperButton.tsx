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
    // This is a mock download. In a real app, this might point to a Firebase Storage URL
    // or an API endpoint that serves the file.
    toast({
      title: "Download Started",
      description: `Downloading ${paperName}... (mock action)`,
    });
    // For actual download, you might use an anchor tag:
    // const link = document.createElement('a');
    // link.href = downloadUrl;
    // link.setAttribute('download', paperName.replace(/ /g, '_') + '.pdf'); // Or get actual filename
    // document.body.appendChild(link);
    // link.click();
    // document.body.removeChild(link);
    console.log(`Mock download for: ${paperName} from ${downloadUrl}`);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleDownload}>
      <Download className="mr-2 h-4 w-4" />
      Download
    </Button>
  );
}
