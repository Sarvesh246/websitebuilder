import type { Metadata } from "next";
import Link from "next/link";
import { ContactLine, LegalPage, LegalSection } from "@/components/legal/LegalPage";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Privacy",
  description: "What Northframe collects when you send a project inquiry, how it is used, and who handles it.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="Northframe is an independent web design and development studio. This page explains what this website collects, why, and who handles it. Accounts are used to follow your project and pay for it. There is no tracking and no advertising here."
    >
      <LegalSection title="Information collected">
        <p>
          The only personal information this site collects is what you type into the{" "}
          <Link href="/start">project inquiry form</Link> and choose to send:
        </p>
        <ul>
          <li>Your name and email address (required).</li>
          <li>Your phone number and organization or business name, if you add them.</li>
          <li>Your project description, project type, and the package you are interested in.</li>
          <li>Your timeline, requested features, and a budget range if you choose the Custom package.</li>
          <li>Your existing website address and up to three reference links, if you add them.</li>
        </ul>
        <p>
          Nothing is sent until you press Send on the last step. While you fill in the form, a draft is kept in your
          browser&apos;s session storage so a refresh does not lose your work. It stays on your device and is cleared once
          you send the form or close the tab.
        </p>
        <p>
          Like any website, the hosting provider that serves these pages may log basic technical data such as IP address,
          browser type, and requested URL. When you submit the form, your IP address is also held briefly in the server&apos;s
          memory to limit abuse (for example, repeated submissions). It is not stored with your inquiry.
        </p>
      </LegalSection>

      <LegalSection title="Account and payment information">
        <p>
          If you create an account, your email address and name are held in Supabase Auth, the sign-in service, and in the
          project database. If you sign in with Google, Google shares only your email address and name with Northframe.
        </p>
        <p>
          Payments are processed by Stripe. Your card details are entered on Stripe&apos;s hosted checkout page and are handled
          by Stripe. Northframe never sees or stores card numbers. Northframe keeps only Stripe reference IDs, the amount,
          and the payment status of each payment, plus the link to Stripe&apos;s receipt so you can open it from your portal.
          If you pay in two parts, Stripe securely saves your payment method so the remaining balance can be charged as you
          authorized at checkout.
        </p>
        <p>
          Inside the portal, the files, messages, preview feedback and checklist answers you send are stored in the project
          database and a private file store, visible only to you and the studio. While you have the portal open, your browser
          keeps a live connection to Supabase so new messages appear without a refresh; it carries no tracking.
        </p>
      </LegalSection>

      <LegalSection title="How information is used">
        <p>
          Inquiry details are used to read your request, reply to you, and prepare a quote or proposal. You also receive a
          short automatic confirmation email at the address you gave. Your details are not used for marketing lists or
          newsletters.
        </p>
      </LegalSection>

      <LegalSection title="Service providers">
        <p>
          Inquiries are stored in a private database hosted by Supabase, a database provider, and a copy is sent by email
          through Resend, an email delivery service, to Northframe&apos;s inbox. Payments are handled by Stripe, a payment processor. None of these providers uses your submission for
          anything other than storing and delivering it. The site&apos;s hosting provider serves the pages and runs the
          form&apos;s server code.
        </p>
        <p>
          Project payments are processed by Stripe. You enter card details on Stripe&apos;s secure checkout page, and
          Northframe never sees or stores card numbers. Northframe keeps payment records (amounts, dates, status, and
          Stripe reference IDs), your acceptance of the payment terms, and, for projects with a later balance, a reference
          to the payment method Stripe saved for the remaining balance. Stripe&apos;s own privacy policy covers what it
          collects.
        </p>
      </LegalSection>

      <LegalSection title="Data retention">
        <p>
          Your inquiry is kept in Northframe&apos;s project database and inbox for as long as needed to respond and, if a
          project goes ahead, to carry it out. It is not publicly accessible. You can ask for it to be deleted at any
          time.
        </p>
        <p>
          You can delete your account yourself from Settings in the portal. That removes your sign-in, profile, messages and
          files, and any request you never paid for. Records of payments you made (amounts, dates and Stripe references) are
          kept, unlinked from your account, because they are needed for accounting. Account deletion is not available while a
          paid project is still in progress.
        </p>
      </LegalSection>

      <LegalSection title="Cookies and analytics">
        <p>
          This site sets no cookies and runs no analytics, advertising, or tracking scripts. It saves two things in your
          browser only: your light or dark theme choice (local storage) and the temporary form draft described above
          (session storage). Neither is sent to Northframe. If analytics are added later, this page will be updated first.
        </p>
        <p>
          When something fails on the server, such as a payment event or a project request that could not be saved, a
          short error record is sent to PostHog, a logging service, so problems can be found and fixed. These records
          hold only a fixed event name and technical reference IDs. They never include your name, email address, message
          text, or card details, and no logging or tracking script runs in your browser.
        </p>
      </LegalSection>

      <LegalSection title="Data sharing">
        <p>
          Your information is not sold or rented. It is shared only with the service providers above, as needed to deliver
          and handle your inquiry, or if the law requires it.
        </p>
      </LegalSection>

      <LegalSection title="Security">
        <p>
          The site is served over HTTPS, form input is validated on the server, and submissions are rate limited. No method
          of transmission or storage is completely secure, so avoid putting passwords or other sensitive details in the form.
        </p>
      </LegalSection>

      <LegalSection title="Your choices and contact">
        <p>You can ask to see, correct, or delete the information you sent, or delete your account yourself from portal Settings.</p>
        <ContactLine />
      </LegalSection>

      <LegalSection title="Policy updates">
        <p>
          If this policy changes, the &quot;Last updated&quot; date above changes with it. The current version is always the
          one on this page.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
