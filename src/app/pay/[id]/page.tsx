import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PayPanel } from "@/components/payment/PayPanel";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Plate } from "@/components/visual/Plate";
import { PaymentError, UUID } from "@/lib/payments/project";
import { pageMetadata } from "@/lib/seo";
import { getPayView } from "@/lib/payments/view";

export const metadata: Metadata = pageMetadata({
  title: "Project payment",
  description: "Payment details for your Northframe project.",
  path: "/start",
  index: false,
});

// Never cache: this page shows live payment state. It only reads; the webhook is what changes payment state.
export const dynamic = "force-dynamic";

export default async function PayPage({ params, searchParams }: PageProps<"/pay/[id]">) {
  const { id } = await params;
  const { checkout } = await searchParams;
  if (!UUID.test(id)) notFound();
  let view;
  try {
    view = await getPayView(id);
  } catch (error) {
    if (error instanceof PaymentError && error.code === "not_found") notFound();
    view = null;
  }
  return (
    <Section className="start" spacing="none">
      <Plate name="intake" eager />
      <Container>
        <PayPanel view={view} returned={checkout === "success" ? "success" : checkout === "cancelled" ? "cancelled" : null} />
      </Container>
    </Section>
  );
}
