import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type SectionHeaderProps = {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: "start" | "center";
  /** Use "h1" only for the page's single primary heading. */
  as?: "h1" | "h2";
  className?: string;
};

export const SectionHeader = ({
  eyebrow,
  title,
  lead,
  align = "start",
  as: Heading = "h2",
  className,
}: SectionHeaderProps) => {
  const centered = align === "center";
  return (
    <header
      className={cn(
        "flex flex-col gap-5",
        centered ? "items-center text-center" : "items-start",
        className,
      )}
    >
      {eyebrow && (
        <span className={cn("t-label", centered ? "t-label--rule t-label--rule-both" : "t-label--rule")}>
          {eyebrow}
        </span>
      )}
      <Heading className="t-h2 max-w-[18ch]">{title}</Heading>
      {lead && <p className="t-lead max-w-[46ch]">{lead}</p>}
    </header>
  );
};
