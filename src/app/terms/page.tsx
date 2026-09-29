import type { Metadata } from "next";
import Link from "next/link";
import { ContactLine, LegalPage, LegalSection } from "@/components/legal/LegalPage";
import { paymentTerms } from "@/config/payment";
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

      <LegalSection title="Payments and cancellation" id="payments">
        <p>
          Website packages are paid through Stripe. Launch is paid in full at checkout. Presence and Business are paid in two
          parts: half at checkout and the remaining half after the included revision stage is completed. Custom projects
          follow the amounts quoted to you. The total, the amount due today, and the amount due later are shown before you pay.
        </p>
        <p>
          For projects with a remaining balance, you authorize Northframe to have Stripe securely save your payment method and
          to attempt to charge the remaining balance after the revision stage. If that payment fails, you can pay the balance
          with any card through a secure payment link. Launch, transfer, or delivery of the finished website happens only after
          the balance has been paid. Northframe never sees or stores your card number.
        </p>
        <p>
          <strong>{paymentTerms.cancellation.title}.</strong> {paymentTerms.cancellation.body} Refunds are reviewed and
          issued by Northframe; they are never automatic. This policy does not limit any rights you have under the law where
          you live.
        </p>
      </LegalSection>

      <LegalSection title="Project agreement">
        <p>
          Before paid work begins, the project scope, payment schedule, delivery, revision limits, and ownership terms are
          confirmed in a separate written project agreement. If anything here differs from that agreement, the agreement
          applies to your project.
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
