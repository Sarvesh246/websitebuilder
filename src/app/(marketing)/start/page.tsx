import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { InquiryFlow } from "@/components/inquiry/InquiryFlow";
import { Plate } from "@/components/visual/Plate";
import { parsePackageId } from "@/config/inquiry";
import { getViewer } from "@/lib/auth/session";
import { pageMetadata } from "@/lib/seo";

// Conversion form, not search content (and `?package=` makes variants): noindex, canonical /start,
// left out of the sitemap. Social previews still work when the link is shared.
export const metadata: Metadata = pageMetadata({
  title: "Start a Project",
  description:
    "Tell Northframe what you're building and choose the website package or custom scope that fits your project.",
  path: "/start",
  index: false,
});

/** Project inquiry. `?package=launch|presence|business|custom` preselects a package (see startHref in config/inquiry.ts). */
export default async function StartPage({ searchParams }: PageProps<"/start">) {
  const { package: requested } = await searchParams;
  const initialPackage = parsePackageId(requested);
  const viewer = await getViewer();

  return (
    <Section className="start" spacing="none">
      <Plate name="intake" eager />
      <Container>
        <InquiryFlow initialPackage={initialPackage} account={viewer ? { email: viewer.email } : null} />
      </Container>
    </Section>
  );
}
