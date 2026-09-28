import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { InquiryFlow } from "@/components/inquiry/InquiryFlow";
import { Ambient } from "@/components/visual/Ambient";
import { isPackageId } from "@/config/inquiry";

export const metadata: Metadata = {
  title: "Start a project",
  description: "Tell Northframe about your website project. A few short questions, no commitment.",
  alternates: { canonical: "/start" },
};

/** Project inquiry. `?package=starter|plus|pro|custom` preselects a package (see startHref in config/inquiry.ts). */
export default async function StartPage({ searchParams }: PageProps<"/start">) {
  const { package: requested } = await searchParams;
  const initialPackage = isPackageId(requested) ? requested : null;

  return (
    <Section className="start" spacing="none">
      <Ambient preset="start" />
      <Container>
        <InquiryFlow initialPackage={initialPackage} />
      </Container>
    </Section>
  );
}
