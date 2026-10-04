import { Eye, LogOut } from "lucide-react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/nav/ThemeToggle";
import type { Viewer } from "@/lib/portal/types";
import { demoMode } from "@/lib/auth/session";
import { LiveUpdates } from "./LiveUpdates";
import { ExitPreviewButton } from "./SettingsTools";
import { PortalNav } from "./PortalNav";
import { Avatar } from "./parts";

type ShellProps = {
  viewer: Viewer;
  perspective: "admin" | "client";
  unreadMessages: number;
  children: ReactNode;
};

const Brand = () => (
  <Link href="/portal" className="brand pt-brand" aria-label="Northframe portal home">
    <BrandLogo />
  </Link>
);

/** Shared SVG filter: a groove cut into the glass (shade on the upper wall, light on the lower lip).
 *  Used by ring and donut tracks via `filter: url(#pt-engrave)` in portal.css; colours come from tokens. */
const EngraveFilter = () => (
  <svg className="pt-defs" aria-hidden focusable="false">
    <filter id="pt-engrave" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
      <feComponentTransfer in="SourceAlpha" result="hole">
        <feFuncA type="table" tableValues="1 0" />
      </feComponentTransfer>
      <feOffset in="hole" dy="2" result="holeDown" />
      <feGaussianBlur in="holeDown" stdDeviation="1.4" result="holeBlur" />
      <feFlood className="pt-defs__shade" result="shade" />
      <feComposite in="shade" in2="holeBlur" operator="in" result="shadeOnHole" />
      <feComposite in="shadeOnHole" in2="SourceAlpha" operator="in" result="innerShade" />
      <feOffset in="hole" dy="-1" result="holeUp" />
      <feFlood className="pt-defs__lit" result="lit" />
      <feComposite in="lit" in2="holeUp" operator="in" result="litOnHole" />
      <feComposite in="litOnHole" in2="SourceAlpha" operator="in" result="innerLit" />
      <feMerge>
        <feMergeNode in="SourceGraphic" />
        <feMergeNode in="innerShade" />
        <feMergeNode in="innerLit" />
      </feMerge>
    </filter>
  </svg>
);

export const PortalShell = ({ viewer, perspective, unreadMessages, children }: ShellProps) => {
  const previewing = viewer.role === "admin" && perspective === "client";
  const roleText = perspective === "admin" ? "Studio admin" : previewing ? "Client preview" : "Client";
  return (
    <div className="pt-app">
      <EngraveFilter />
      <LiveUpdates enabled={!demoMode()} viewerId={viewer.userId} />
      <div className="pt-shell">
        <aside className="pt-side" aria-label="Portal sidebar">
          <Brand />
          <PortalNav variant="side" unreadMessages={unreadMessages} />
          <div className="pt-side__foot">
            <div className="pt-user">
              <Avatar name={viewer.fullName ?? viewer.email} seed={viewer.userId} />
              <div style={{ minWidth: 0 }}>
                <p className="pt-user__name">{viewer.fullName ?? viewer.email}</p>
                <p className="pt-user__role">{roleText}</p>
              </div>
            </div>
            <div className="pt-side__actions">
              <ThemeToggle />
              <form action="/auth/signout" method="post" className="pt-signout">
                <button type="submit" className="btn btn-secondary btn-sm">
                  <LogOut aria-hidden size={15} strokeWidth={1.9} />
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </aside>

        <header className="pt-top">
          <Brand />
          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <ThemeToggle />
            <Link href="/portal/settings" className="icon-btn" aria-label="Account settings">
              <Avatar name={viewer.fullName ?? viewer.email} seed={viewer.userId} />
            </Link>
          </div>
        </header>

        <main id="main" className="pt-main">
          {previewing && (
            <div className="pt-banner" role="status">
              <Eye aria-hidden size={18} strokeWidth={1.9} />
              <span>Preview mode: viewing as client. Studio-only tools are hidden and changes are disabled.</span>
              <ExitPreviewButton />
            </div>
          )}
          {children}
        </main>

        <div className="pt-tabbar">
          <PortalNav variant="tabs" unreadMessages={unreadMessages} />
        </div>
      </div>
    </div>
  );
};
