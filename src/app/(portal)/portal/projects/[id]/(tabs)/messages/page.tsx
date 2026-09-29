import { MessageSquare } from "lucide-react";
import { notFound } from "next/navigation";
import { getContext, loadProject, portalMeta } from "@/components/portal/loaders";
import { MarkRead, MessageComposer } from "@/components/portal/MessageComposer";
import { Card, EmptyState } from "@/components/portal/parts";
import { listMessages } from "@/lib/portal/data";
import { timeAgo } from "@/lib/portal/format";

export const metadata = portalMeta("Messages");

export default async function ProjectMessagesPage({ params }: PageProps<"/portal/projects/[id]/messages">) {
  const { id } = await params;
  const { viewer, perspective } = await getContext(`/portal/projects/${id}/messages`);
  const p = await loadProject(viewer, perspective, id);
  if (!p) notFound();
  const messages = await listMessages(viewer, perspective, id).catch(() => []);
  const previewing = viewer.role === "admin" && perspective === "client";
  const unread = messages.filter((m) => !m.mine && !m.readAt).length;

  return (
    <div style={{ maxWidth: "52rem" }}>
      <Card title="Conversation" note={perspective === "admin" ? `With ${p.clientName}` : "With the studio"}>
        {!previewing && <MarkRead projectId={id} unread={unread} />}
        {messages.length === 0 ? (
          <EmptyState icon={MessageSquare} title="No messages yet">
            {perspective === "admin" ? "Start the conversation with a quick hello." : "Ask a question or share an update. The studio will reply here."}
          </EmptyState>
        ) : (
          <div className="pt-thread" role="log" aria-label="Messages" tabIndex={0}>
            {messages.map((m) => (
              <div key={m.id} className="pt-bubble" data-mine={m.mine || undefined}>
                <span className="pt-bubble__meta">
                  {m.mine ? "You" : m.senderRole === "admin" ? "The studio" : p.clientName} · {timeAgo(m.createdAt)}
                </span>
                {m.body}
              </div>
            ))}
          </div>
        )}
        <MessageComposer projectId={id} disabledReason={previewing ? "Preview mode: sending is disabled." : undefined} />
      </Card>
    </div>
  );
}
