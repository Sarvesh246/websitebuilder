"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = { slug: string; label: string };

/** Route-based tabs: each is a real link, so the URL holds the state and back/forward work. */
export const ProjectTabs = ({ projectId, tabs }: { projectId: string; tabs: Tab[] }) => {
  const pathname = usePathname();
  const base = `/portal/projects/${projectId}`;
  return (
    <nav aria-label="Project sections" className="pt-tabs">
      {tabs.map((t) => {
        const href = t.slug ? `${base}/${t.slug}` : base;
        const active = t.slug ? pathname === href || pathname.startsWith(`${href}/`) : pathname === base;
        return (
          <Link key={t.slug || "overview"} href={href} aria-current={active ? "page" : undefined}>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
};
