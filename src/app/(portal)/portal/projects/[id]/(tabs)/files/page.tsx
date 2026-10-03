import { FileText } from "lucide-react";
import { notFound } from "next/navigation";
import { FileActions, FileUploader } from "@/components/portal/FileTools";
import { getContext, loadProject, loadWorkflow, portalMeta } from "@/components/portal/loaders";
import { Card, EmptyState } from "@/components/portal/parts";
import { ChecklistCard } from "@/components/portal/Checklist";
import { listFiles } from "@/lib/portal/data";
import { shortDate } from "@/lib/portal/format";

export const metadata = portalMeta("Files");

const size = (bytes: number) => (bytes >= 1_048_576 ? `${(bytes / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

export default async function ProjectFilesPage({ params }: PageProps<"/portal/projects/[id]/files">) {
  const { id } = await params;
  const { viewer, perspective } = await getContext(`/portal/projects/${id}/files`);
  const p = await loadProject(viewer, perspective, id);
  if (!p) notFound();
  const [files, work] = await Promise.all([
    listFiles(viewer, perspective, id).catch(() => []),
    loadWorkflow(viewer, perspective, p),
  ]);
  const previewing = viewer.role === "admin" && perspective === "client";
  const isAdmin = perspective === "admin";
  const closed = p.stage === "cancelled";

  return (
    <div className="pt-grid pt-cols-side">
      <div className="pt-stack">
        {!closed && work.checklist.length > 0 && (
          <ChecklistCard projectId={id} items={work.checklist} admin={isAdmin} disabledReason={previewing ? "Preview mode: changes are disabled." : undefined} />
        )}
        <Card title="All files" note={files.length ? `${files.length} ${files.length === 1 ? "file" : "files"}, private to you and the studio` : "Logos, copy, references and deliverables"}>
          {files.length === 0 ? (
            <EmptyState icon={FileText} title="No files yet">
              {isAdmin
                ? "Files the client sends, and anything you share with them, are listed here."
                : "Drag files into the box to send them. Start with the items on the checklist above; the studio is notified in your project activity."}
            </EmptyState>
          ) : (
            <ul className="pt-list">
              {files.map((f) => (
                <li key={f.id} className="pt-file">
                  {f.thumbUrl ? (
                    // Signed, short-lived storage URL: next/image would cache it past its expiry.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="pt-file__thumb" src={f.thumbUrl} alt="" loading="lazy" decoding="async" width={40} height={40} />
                  ) : (
                    <span className="pt-file__icon">
                      <FileText aria-hidden size={19} strokeWidth={1.75} />
                    </span>
                  )}
                  <div style={{ minWidth: 0 }}>
                    <p className="pt-row__title">{f.name}</p>
                    <p className="pt-row__meta">
                      <span>{size(f.sizeBytes)}</span>
                      <span>{f.uploaderRole === "admin" ? "From the studio" : isAdmin ? "From the client" : "From you"}</span>
                      <span>{shortDate(f.createdAt)}</span>
                    </p>
                  </div>
                  <FileActions fileId={f.id} name={f.name} canDelete={!previewing && (isAdmin || f.uploaderRole === "client")} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <div className="pt-stack pt-sticky">
        <FileUploader projectId={id} disabledReason={previewing ? "Preview mode: uploads are disabled." : closed ? "This project is closed." : undefined} />
      </div>
    </div>
  );
}
