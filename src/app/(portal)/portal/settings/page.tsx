import { LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/nav/ThemeToggle";
import { getContext, portalMeta } from "@/components/portal/loaders";
import { Card, PageHeader } from "@/components/portal/parts";
import { ConnectedAccounts, DeleteAccount, PasswordForm } from "@/components/portal/AccountSecurity";
import { NameForm, ViewAsToggle } from "@/components/portal/SettingsTools";
import { demoMode } from "@/lib/auth/session";

export const metadata = portalMeta("Settings");

export default async function SettingsPage() {
  const { viewer, perspective } = await getContext("/portal/settings");
  const demo = demoMode();

  return (
    <>
      <PageHeader eyebrow="Account" title="Settings" sub="Your profile, appearance, sign-in and account." />
      {demo && (
        <p className="pt-banner" role="note">
          Demo mode: this portal shows sample data and saving is turned off.
        </p>
      )}
      <div className="pt-grid pt-cols-2" style={{ alignItems: "start" }}>
        <div className="pt-stack">
          <Card title="Profile">
            <div className="pt-stack">
              <NameForm initial={viewer.fullName ?? ""} />
              <dl className="pt-dl">
                <div>
                  <dt>Email</dt>
                  <dd>{viewer.email}</dd>
                </div>
                <div>
                  <dt>Role</dt>
                  <dd>{viewer.role === "admin" ? "Studio admin" : "Client"}</dd>
                </div>
              </dl>
            </div>
          </Card>
          <Card title="Appearance" note="Light by default, dusk at night. Saved in this browser.">
            <div className="pt-form-row" style={{ alignItems: "center" }}>
              <ThemeToggle />
              <span className="pt-small">Switch between light and dark.</span>
            </div>
          </Card>
        </div>

        <div className="pt-stack">
          {viewer.role === "admin" && (
            <Card title="Preview as client" note="Studio admins only">
              <div className="pt-stack">
                <p className="pt-small">
                  See the portal exactly as a client sees it: their overview, tabs and payment screens. Studio controls are hidden and changes are disabled while previewing. This does not
                  change any data or sign you out.
                </p>
                <ViewAsToggle active={perspective === "client"} />
              </div>
            </Card>
          )}
          <Card title="Password" note="Change the password you sign in with">
            <PasswordForm disabled={demo} />
          </Card>
          <Card title="Sign-in methods" note="Ways you can get into the portal">
            <ConnectedAccounts disabled={demo} />
          </Card>
          <Card title="Sign out">
            <form action="/auth/signout" method="post" className="pt-stack">
              <p className="pt-small">You will need to sign in again to see your projects.</p>
              <button type="submit" className="btn btn-secondary" style={{ justifySelf: "start" }}>
                <LogOut aria-hidden size={16} strokeWidth={1.9} />
                Sign out
              </button>
            </form>
          </Card>
          {viewer.role !== "admin" && (
            <Card title="Delete account" note="Permanent">
              <DeleteAccount disabled={demo} />
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
