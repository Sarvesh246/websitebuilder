import { FileText } from "lucide-react";
import { notFound } from "next/navigation";
import { FileActions, FileUploader } from "@/components/portal/FileTools";
import { getContext, loadProject, portalMeta } from "@/components/portal/loaders";
import { Card, EmptyState } from "@/components/portal/parts";
import { listFiles } from "@/lib/portal/data";
import { shortDate } from "@/lib/portal/format";

export const metadata = portalMeta("Files");

const size = (bytes: number) => (bytes >= 1_048_576 ? `${(bytes / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

export default async function ProjectFilesPage({ params }: PageProps<"/portal/projects/[id]/files">) {
  const { id } = await params;
  const { viewer, perspective } = await getContext(`/portal/projects/${id}/files`);
  const p = await loadProject(viewer, perspective, id);
  if (!p) notFound();
  const files = await listFiles(viewer, perspective, id).catch(() => []);
  const previewing = viewer.role === "admin" && perspective === "client";

  return (
    <div className="pt-grid pt-cols-side">
      <Card title="Files" note="Logos, copy, references and deliverables">
        {files.length === 0 ? (
          <EmptyState icon={FileText} title="No files yet">
            Upload brand assets, photos or documents. Everything stays private to you and the studio.
          </EmptyState>
        ) : (
          <ul className="pt-list">
            {files.map((f) => (
              <li key={f.id} className="pt-file">
                <span className="pt-file__icon">
                  <FileText aria-hidden size={19} strokeWidth={1.75} />
                </span>
                <div style={{ minWidth: 0 }}>
                  <p className="pt-row__title">{f.name}</p>
                  <p className="pt-row__meta">
                    <span>{size(f.sizeBytes)}</span>
                    <span>{f.uploaderRole === "admin" ? "From the studio" : "From the client"}</span>
                    <span>{shortDate(f.createdAt)}</span>
                  </p>
                </div>
                <FileActions fileId={f.id} name={f.name} canDelete={!previewing && (perspective === "admin" || f.uploaderRole === "client")} />
              </li>
            ))}
          </ul>
        )}
      </Card>
      <FileUploader projectId={id} disabledReason={previewing ? "Preview mode: uploads are disabled." : undefined} />
    </div>
  );
}
