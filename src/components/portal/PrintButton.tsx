"use client";

import { Download } from "lucide-react";

/** Opens the print dialog, where "Save as PDF" downloads the invoice. */
export const PrintButton = () => (
  <button type="button" className="btn btn-primary btn-sm" onClick={() => window.print()}>
    <Download aria-hidden size={15} strokeWidth={1.9} />
    Download PDF
  </button>
);
