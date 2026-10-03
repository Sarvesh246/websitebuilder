import { ExternalLink, FileText } from "lucide-react";
import Link from "next/link";
import type { PaymentRow } from "@/lib/portal/types";
import { isInvoiceable } from "@/lib/portal/workflow";

/** Invoice (our printable page) and Stripe's hosted receipt, for payments that actually went through. */
export const ReceiptLinks = ({ projectId, payment }: { projectId: string; payment: PaymentRow }) => {
  if (!isInvoiceable(payment)) return null;
  return (
    <span className="pt-receipt-links">
      <Link href={`/portal/projects/${projectId}/invoice/${payment.id}`} className="pt-link">
        <FileText aria-hidden size={14} strokeWidth={1.9} />
        Invoice
      </Link>
      {payment.receiptUrl && (
        <a href={payment.receiptUrl} target="_blank" rel="noopener noreferrer" className="pt-link">
          <ExternalLink aria-hidden size={14} strokeWidth={1.9} />
          Stripe receipt<span className="sr-only"> (opens in a new tab)</span>
        </a>
      )}
    </span>
  );
};
