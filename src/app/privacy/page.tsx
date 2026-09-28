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
      intro="Northframe is an independent web design and development studio. This page explains what this website collects, why, and who handles it. There is no account system, no tracking, and no advertising here."
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

      <LegalSection title="How information is used">
        <p>
          Inquiry details are used to read your request, reply to you, and prepare a quote or proposal. You also receive a
          short automatic confirmation email at the address you gave. Your details are not used for marketing lists or
          newsletters.
        </p>
      </LegalSection>

      <LegalSection title="Service providers">
        <p>
          Inquiries are delivered by email through Resend, an email delivery service, to Northframe&apos;s inbox. Resend
          processes your submission only to deliver these messages. The site&apos;s hosting provider serves the pages and runs
          the form&apos;s server code.
        </p>
      </LegalSection>

      <LegalSection title="Data retention">
        <p>
          The site has no database. Your inquiry exists as an email in Northframe&apos;s inbox and is kept for as long as
          needed to respond and, if a project goes ahead, to carry it out. You can ask for it to be deleted at any time.
        </p>
      </LegalSection>

      <LegalSection title="Cookies and analytics">
        <p>
          This site sets no cookies and runs no analytics, advertising, or tracking scripts. It saves two things in your
          browser only: your light or dark theme choice (local storage) and the temporary form draft described above
          (session storage). Neither is sent to Northframe. If analytics are added later, this page will be updated first.
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
        <p>You can ask to see, correct, or delete the information you sent.</p>
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
