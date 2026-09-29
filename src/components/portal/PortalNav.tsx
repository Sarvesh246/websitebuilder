"use client";

import { CreditCard, FolderKanban, LayoutDashboard, MessageSquare, Settings, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

type Item = { href: string; label: string; icon: LucideIcon; badgeKey?: "messages" };

const items: Item[] = [
  { href: "/portal", label: "Overview", icon: LayoutDashboard },
  { href: "/portal/projects", label: "Projects", icon: FolderKanban },
  { href: "/portal/messages", label: "Messages", icon: MessageSquare, badgeKey: "messages" },
  { href: "/portal/payments", label: "Payments", icon: CreditCard },
  { href: "/portal/settings", label: "Settings", icon: Settings },
];

const isActive = (pathname: string, href: string) => (href === "/portal" ? pathname === "/portal" : pathname === href || pathname.startsWith(`${href}/`));

export const PortalNav = ({ variant, unreadMessages }: { variant: "side" | "tabs"; unreadMessages: number }) => {
  const pathname = usePathname();
  const label = variant === "side" ? "Portal" : "Portal tabs";
  const links = items.map(({ href, label: text, icon: Icon, badgeKey }) => {
    const badge = badgeKey === "messages" && unreadMessages > 0 ? unreadMessages : 0;
    return (
      <Link key={href} href={href} className={variant === "side" ? "pt-nav__link" : "pt-tab"} aria-current={isActive(pathname, href) ? "page" : undefined}>
        <Icon aria-hidden size={variant === "side" ? 19 : 22} strokeWidth={1.75} />
        <span>{text}</span>
        {badge > 0 && (
          <span className="pt-nav__badge">
            {badge > 9 ? "9+" : badge}
            <span className="sr-only"> unread</span>
          </span>
        )}
      </Link>
    );
  });
  return (
    <nav aria-label={label} className={cn(variant === "side" ? "pt-nav" : "contents")}>
      {links}
    </nav>
  );
};
