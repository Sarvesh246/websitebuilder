import { ExternalLink, Globe } from "lucide-react";
import { notFound } from "next/navigation";
import { getContext, loadProject, portalMeta } from "@/components/portal/loaders";
import { Card, EmptyState } from "@/components/portal/parts";

export const metadata = portalMeta("Preview");

/** Only http(s) links are ever rendered as anchors. The preview opens in a new tab and is never framed. */
const safeUrl = (raw: string | null): URL | null => {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    return u.protocol === "https:" || u.protocol === "http:" ? u : null;
  } catch {
    return null;
  }
};

export default async function ProjectPreviewPage({ params }: PageProps<"/portal/projects/[id]/preview">) {
  const { id } = await params;
  const { viewer, perspective } = await getContext(`/portal/projects/${id}/preview`);
  const p = await loadProject(viewer, perspective, id);
  if (!p) notFound();
  const url = safeUrl(p.previewUrl);

  return (
    <div style={{ maxWidth: "52rem" }}>
      {url ? (
        <div className="pt-frame">
          <div className="pt-frame__bar">
            <span className="pt-frame__dots" aria-hidden>
              <i />
              <i />
              <i />
            </span>
            <span className="pt-frame__url">{url.host}</span>
          </div>
          <div className="pt-frame__body">
            <span className="pt-empty__icon">
              <Globe aria-hidden size={22} strokeWidth={1.7} />
            </span>
            <p className="pt-empty__title">Your preview is ready</p>
            <p className="pt-small" style={{ maxWidth: "28rem" }}>
              It opens in a new tab. Share what you would like changed in Messages, and note that a preview is a work in progress.
            </p>
            <a href={url.href} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              Open preview
              <ExternalLink aria-hidden size={16} strokeWidth={1.9} />
            </a>
          </div>
        </div>
      ) : (
        <Card>
          <EmptyState icon={Globe} title="No preview yet">
            {perspective === "admin" ? "Add a preview URL in the studio controls when there is something to show." : "When the first version is ready, the studio will add a preview link here."}
          </EmptyState>
        </Card>
      )}
    </div>
  );
}
