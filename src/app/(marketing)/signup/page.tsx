import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Plate } from "@/components/visual/Plate";
import { safeNext } from "@/lib/auth/next";
import { getViewer } from "@/lib/auth/session";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Create account",
  description: "Sign in to your Northframe project portal.",
  path: "/signup",
  index: false,
});

export default async function Page({ searchParams }: PageProps<"/signup">) {
  const { next, error } = await searchParams;
  const target = typeof next === "string" ? next : undefined;
  if (await getViewer()) redirect(safeNext(target));
  return (
    <Section className="start auth" spacing="none">
      <Plate name="intake" eager />
      <Container>
        <div className="auth__wrap">
          <AuthForm mode="signup" next={target} notice={error === "callback" ? "That sign-in link did not work. Please try again." : undefined} />
        </div>
      </Container>
    </Section>
  );
}
