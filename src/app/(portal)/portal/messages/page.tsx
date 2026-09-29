import { MessageSquare } from "lucide-react";
import Link from "next/link";
import { getContext, portalMeta } from "@/components/portal/loaders";
import { projectTitle } from "@/components/portal/copy";
import { Card, EmptyState, PageHeader, StageChip } from "@/components/portal/parts";
import { listInbox } from "@/lib/portal/data";
import { timeAgo } from "@/lib/portal/format";

export const metadata = portalMeta("Messages");

export default async function InboxPage() {
  const { viewer, perspective } = await getContext("/portal/messages");
  const inbox = await listInbox(viewer, perspective).catch(() => []);
  const isAdmin = perspective === "admin";

  return (
    <>
      <PageHeader eyebrow={isAdmin ? "Studio" : "Your portal"} title="Messages" sub={isAdmin ? "One conversation per project. Unread ones come first in your sidebar badge." : "Your conversations with the studio, one per project."} />
      {inbox.length === 0 ? (
        <Card>
          <EmptyState icon={MessageSquare} title="No conversations yet">
            {isAdmin ? "Messages from clients will appear here." : "Once you have a project you can message the studio from here."}
          </EmptyState>
        </Card>
      ) : (
        <Card flush>
          <ul className="pt-list" style={{ padding: "0 1.25rem" }}>
            {inbox.map(({ project: p, last }) => (
              <li key={p.id}>
                <Link href={`/portal/projects/${p.id}/messages`} className="pt-row" style={{ textDecoration: "none", color: "inherit" }}>
                  <div className="pt-row__main">
                    <span className="pt-row__title">
                      {p.unreadMessages > 0 && (
                        <>
                          <span className="pt-dot" aria-hidden /> <span className="sr-only">{p.unreadMessages} unread. </span>
                        </>
                      )}
                      {isAdmin ? p.clientName : projectTitle(p)}
                    </span>
                    <p className="pt-small" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {last ? `${last.mine ? "You: " : ""}${last.body}` : "No messages yet"}
                    </p>
                  </div>
                  <div className="pt-row__aside">
                    <span className="pt-small">{last ? timeAgo(last.createdAt) : ""}</span>
                    <StageChip stage={p.stage} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
