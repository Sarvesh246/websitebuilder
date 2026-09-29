import type { Metadata } from "next";
import Link from "next/link";
import { ContactLine, LegalPage, LegalSection } from "@/components/legal/LegalPage";
import { cancellationPolicy } from "@/config/payments";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Terms",
  description: "Plain-language terms for using the Northframe website and sending a project inquiry.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms"
      intro="These terms cover using this website and sending an inquiry. They are not a contract for design or development work. That is agreed separately, in writing, before a project starts."
    >
      <LegalSection title="About this website">
        <p>
          The information on this site is general and may change. Packages, prices, and included items describe what
          Northframe currently offers. Founding Client Pricing is introductory, and regular prices apply once it ends.
        </p>
      </LegalSection>

      <LegalSection title="Pricing and scope">
        <p>
          Listed prices assume the scope described for each package. Requests beyond a package, and Custom projects, are
          quoted by scope and approved by you before work continues. Domain names and paid third-party services, such as
          premium hosting or email plans, have their own fees and are separate from Northframe&apos;s price.
        </p>
      </LegalSection>

      <LegalSection title="Inquiries">
        <p>
          Sending an inquiry is a request for a conversation and a quote. It does not create an agreement or oblige either
          side to work together.
        </p>
      </LegalSection>

      <LegalSection title="Project agreement">
        <p>
          Before paid work begins, the project scope, payment schedule, delivery, revision limits, and ownership terms are
          confirmed in a separate written project agreement. If anything here differs from that agreement, the agreement
          applies to your project.
        </p>
      </LegalSection>

      <LegalSection title={`Payments and the ${cancellationPolicy.title}`}>
        <p>
          Payments are taken online through Stripe. Launch is paid in full at checkout. Presence and Business are split
          into two payments: half at checkout to start the project, and the remaining balance after the included
          revision stage is completed. Custom projects follow the payment schedule in the written quote.
        </p>
        <p>
          For split payments, you authorize Northframe to securely save your payment method with Stripe and to attempt
          to charge the remaining balance once the revision stage is completed. If that charge fails, you will be asked
          to pay the balance another way. Launch, transfer, and delivery of the finished site happen only after the
          remaining balance is paid.
        </p>
        <p>
          <strong>{cancellationPolicy.title}.</strong> {cancellationPolicy.body[0]} {cancellationPolicy.body[1]}{" "}
          {cancellationPolicy.body[2]} {cancellationPolicy.note}
        </p>
        <p>
          Domain names and paid third-party services are billed separately and are not covered by the package price.
        </p>
      </LegalSection>

      <LegalSection title="Third-party services">
        <p>
          Websites often rely on outside platforms for hosting, domains, email, and similar services. Northframe does not
          control them and cannot guarantee that they will run without interruption.
        </p>
      </LegalSection>

      <LegalSection title="Your information">
        <p>
          How inquiry information is handled is explained in the <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </LegalSection>

      <LegalSection title="Changes and contact">
        <p>These terms may be updated. The date at the top shows the latest version.</p>
        <ContactLine />
      </LegalSection>
    </LegalPage>
  );
}
