import Link from "next/link";
import { Card, PageHeader } from "@/components/portal/parts";

export default function PortalNotFound() {
  return <>
    <PageHeader eyebrow="Your portal" title="Page not found" sub="This project or payment is unavailable in your account." />
    <Card><Link href="/portal/projects" className="btn btn-primary">Back to projects</Link></Card>
  </>;
}
