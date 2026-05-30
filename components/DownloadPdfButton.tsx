"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Triggers the browser's native Print dialog. With our print: CSS rules
 * the feedback page renders cleanly to PDF when the user picks "Save as PDF"
 * in the print sheet. No dependencies.
 */
export default function DownloadPdfButton() {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => window.print()}
      className="gap-2"
    >
      <Download className="size-4" />
      Download PDF
    </Button>
  );
}
