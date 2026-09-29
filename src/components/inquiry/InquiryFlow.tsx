"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Info, Loader2, Plus, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { ChoiceGroup, TextAreaField, TextField } from "@/components/inquiry/fields";
import { PackageSummary } from "@/components/inquiry/PackageSummary";
import { StepProgress } from "@/components/inquiry/StepProgress";
import { Review } from "@/components/inquiry/Review";
import { Button } from "@/components/ui/Button";
import { GlassSurface } from "@/components/ui/GlassSurface";
import {
  budgets,
  copy,
  features,
  inquiryDraftKey,
  parsePackageId,
  limits,
  packageChoices,
  projectTypes,
  siteAnswers,
  steps,
  timelines,
} from "@/config/inquiry";
import type { PackageId } from "@/config/pricing";
import { emptyValues, stepFields, validateInquiry, type FieldErrors, type InquiryValues } from "@/lib/inquiry/schema";

type Status = "idle" | "sending" | "success" | "error";
/** startedAt persists the first visit, so a restored draft is not mistaken for a bot's instant submit. */
type Draft = { values: InquiryValues; step: number; reached: number; startedAt?: number };

/** Longer than the server's worst case (notification timeout), short enough to recover the UI. */
const SUBMIT_TIMEOUT_MS = 20_000;

const lastEditable = steps.length - 2; // index of the contact step; review is the last

/** Keep only the errors that belong to the given step's fields. */
const errorsForStep = (all: FieldErrors, index: number): FieldErrors => {
  const fields = stepFields[steps[index].id as keyof typeof stepFields];
  if (!fields) return {};
  return Object.fromEntries(Object.entries(all).filter(([key]) => (fields as readonly string[]).includes(key.split(".")[0]))) as FieldErrors;
};

const noopSubscribe = () => () => {};

const readDraft = (): Draft | null => {
  try {
    const draft = JSON.parse(sessionStorage.getItem(inquiryDraftKey) ?? "null") as Partial<Draft> | null;
    if (draft?.values && typeof draft.step === "number") return draft as Draft;
  } catch {
    // Storage unavailable or corrupt draft: start fresh.
  }
  return null;
};

/**
 * Server render and first client render use defaults (so hydration matches); once mounted the form
 * remounts with any saved draft. A package in the URL always wins over a saved one.
 */
export const InquiryFlow = ({ initialPackage }: { initialPackage: PackageId | null }) => {
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  return <InquiryForm key={mounted ? "client" : "server"} initialPackage={initialPackage} draft={mounted ? readDraft() : null} live={mounted} />;
};

const InquiryForm = ({ initialPackage, draft, live }: { initialPackage: PackageId | null; draft: Draft | null; live: boolean }) => {
  const [values, setValues] = useState<InquiryValues>(() => {
    if (!draft) return { ...emptyValues, package: initialPackage ?? "" };
    const saved = parsePackageId(draft.values.package) ?? "";
    return { ...emptyValues, ...draft.values, package: initialPackage ?? saved, links: draft.values.links?.length ? draft.values.links : [""] };
  });
  const [step, setStep] = useState(() => (draft ? Math.min(Math.max(draft.step, 0), lastEditable + 1) : 0));
  const [reached, setReached] = useState(() => (draft ? Math.min(Math.max(draft.reached ?? draft.step, draft.step), lastEditable + 1) : 0));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [failure, setFailure] = useState("");
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [hp, setHp] = useState("");
  const [announce, setAnnounce] = useState("");
  const [attempt, setAttempt] = useState(0);

  const startedAt = useRef(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const movedRef = useRef(false);

  useEffect(() => {
    if (startedAt.current) return; // set once per form instance
    const saved = draft?.startedAt;
    // A restored draft means someone already worked through the form; drafts saved before startedAt
    // existed get a start far enough back that the server's fill-time check can't mistake them for a bot.
    startedAt.current = typeof saved === "number" && saved <= Date.now() ? saved : draft ? Date.now() - 60_000 : Date.now();
  }, [draft]);

  useEffect(() => {
    if (!live || status === "success") return;
    try {
      sessionStorage.setItem(inquiryDraftKey, JSON.stringify({ values, step, reached, startedAt: startedAt.current } satisfies Draft));
    } catch {
      // Ignore: persistence is a convenience.
    }
  }, [values, step, reached, live, status]);

  // Keep the URL in step with the chosen package, so refresh and shared links keep it.
  useEffect(() => {
    if (!live || status === "success") return;
    const url = new URL(window.location.href);
    if (values.package) url.searchParams.set("package", values.package);
    else url.searchParams.delete("package");
    window.history.replaceState(window.history.state, "", url);
  }, [values.package, live, status]);

  // After a step change (not on first paint) move focus to the step heading and announce it.
  useEffect(() => {
    if (!movedRef.current) return;
    headingRef.current?.focus();
    setAnnounce(`Step ${step + 1} of ${steps.length}: ${steps[step].label}`);
  }, [step]);

  // After a failed validation, focus the first invalid control.
  useEffect(() => {
    if (!attempt) return;
    const target = formRef.current?.querySelector<HTMLElement>("[data-invalid] :is(input, textarea)");
    target?.focus();
  }, [attempt]);

  const set = useCallback(<K extends keyof InquiryValues>(key: K, value: InquiryValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const go = (index: number) => {
    movedRef.current = true;
    setStep(index);
    setReached((r) => Math.max(r, index));
    setStatus((s) => (s === "error" ? "idle" : s));
  };

  const next = () => {
    const result = validateInquiry(values);
    const stepErrors = result.ok ? {} : errorsForStep(result.errors, step);
    if (Object.keys(stepErrors).length) {
      setErrors((prev) => ({ ...prev, ...stepErrors }));
      setAttempt((n) => n + 1);
      return;
    }
    go(step + 1);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (step < steps.length - 1) return next();
    if (status === "sending") return;

    const result = validateInquiry(values);
    if (!result.ok) {
      setErrors(result.errors);
      const first = steps.findIndex((_, i) => Object.keys(errorsForStep(result.errors, i)).length);
      if (first >= 0) go(first);
      setAttempt((n) => n + 1);
      return;
    }

    setStatus("sending");
    setFailure("");
    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...result.data, hp, elapsed: Date.now() - startedAt.current }),
        signal: AbortSignal.timeout(SUBMIT_TIMEOUT_MS),
      });
      if (res.ok) {
        try {
          sessionStorage.removeItem(inquiryDraftKey);
        } catch {
          // Ignore: the draft is only a convenience.
        }
        setStatus("success");
        window.scrollTo({ top: 0 });
        return;
      }
      const body = (await res.json().catch(() => ({}))) as { error?: string; fields?: FieldErrors };
      if (res.status === 422 && body.fields) {
        setErrors(body.fields);
        const first = steps.findIndex((_, i) => Object.keys(errorsForStep(body.fields!, i)).length);
        if (first >= 0) go(first);
        setAttempt((n) => n + 1);
        setStatus("idle");
        return;
      }
      setFailure(
        res.status === 429
          ? "You've sent a few requests in a short time. Please wait a few minutes, then try again. Your answers are still here."
          : res.status === 503
            ? copy.unconfigured
            : copy.errorBody,
      );
      setStatus("error");
    } catch {
      setFailure(copy.errorBody);
      setStatus("error");
    }
  };

  if (status === "success") return <Success email={values.email} />;

  const pkg = values.package;
  const advancedPicked = features.some((f) => f.advanced && values.features.includes(f.id));
  const featureChoices = features.map((f) => ({ id: f.id, label: f.label }));
  const toggleFeature = (id: string) =>
    set("features", values.features.includes(id) ? values.features.filter((f) => f !== id) : [...values.features, id]);
  const setLink = (i: number, value: string) => {
    set("links", values.links.map((l, j) => (j === i ? value : l)));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`links.${i}`];
      return next;
    });
  };
  const sending = status === "sending";

  return (
    <div className="inquiry">
      <aside className="inquiry__aside">
        <span className="t-label t-label--rule">Start a project</span>
        <h1 className="t-h2 inquiry__title">Tell me what you&rsquo;re building.</h1>
        <p className="t-lead inquiry__lead">A few quick questions. No commitment, and you can change any answer before sending.</p>
        <StepProgress current={step} reached={reached} onGo={go} />
        <PackageSummary selected={pkg} />
      </aside>

      <GlassSurface variant="elevated" className="inquiry__panel">
        <form ref={formRef} onSubmit={submit} noValidate className="flow">
          <p role="status" aria-live="polite" className="sr-only">
            {announce}
          </p>
          <h2 ref={headingRef} tabIndex={-1} className="flow__title t-h3">
            {steps[step].title}
          </h2>

          {step === 0 && (
            <div className="flow__body">
              <ChoiceGroup
                legend="Package"
                name="package"
                type="radio"
                layout="card"
                error={errors.package}
                choices={packageChoices.map((c) => ({ id: c.id, label: c.name, meta: c.price, description: c.blurb }))}
                selected={pkg ? [pkg] : []}
                onToggle={(id) => {
                  set("package", id as PackageId);
                  if (id !== "custom") set("budget", "");
                }}
              />
              <ChoiceGroup
                legend="What is the website for?"
                name="projectType"
                type="radio"
                error={errors.projectType}
                choices={projectTypes}
                selected={values.projectType ? [values.projectType] : []}
                onToggle={(id) => set("projectType", id)}
              />
            </div>
          )}

          {step === 1 && (
            <div className="flow__body">
              <TextAreaField
                label="Tell me a little about what you want to build"
                hint="What the site is for, the pages you need, anything it should do, sites you like, or anything unusual."
                name="description"
                rows={7}
                value={values.description}
                onValueChange={(v) => set("description", v)}
                error={errors.description}
                counter={limits.descriptionMax}
                maxLength={limits.descriptionMax + 200}
              />
              <ChoiceGroup
                legend="Do you already have a website?"
                name="hasSite"
                type="radio"
                error={errors.hasSite}
                choices={siteAnswers}
                selected={values.hasSite ? [values.hasSite] : []}
                onToggle={(id) => set("hasSite", id as "yes" | "no")}
              />
              {values.hasSite === "yes" && (
                <TextField
                  label="Current website"
                  optional
                  type="url"
                  name="siteUrl"
                  inputMode="url"
                  autoComplete="url"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="example.com"
                  value={values.siteUrl}
                  onValueChange={(v) => set("siteUrl", v)}
                  error={errors.siteUrl}
                />
              )}
              <fieldset className="field">
                <legend className="field__label">
                  Reference links<span className="field__optional"> (optional)</span>
                </legend>
                <p className="field__hint">Inspiration sites, design files, social profiles, or brand assets.</p>
                <div className="links">
                  {values.links.map((link, i) => (
                    <div key={i} className="links__row">
                      <TextField
                        label={`Link ${i + 1}`}
                        type="url"
                        name={`link-${i}`}
                        inputMode="url"
                        autoCapitalize="none"
                        spellCheck={false}
                        placeholder="https://"
                        value={link}
                        onValueChange={(v) => setLink(i, v)}
                        error={errors[`links.${i}`]}
                        className="links__field"
                      />
                      {values.links.length > 1 && (
                        <button
                          type="button"
                          className="icon-btn links__remove"
                          aria-label={`Remove link ${i + 1}`}
                          onClick={() => set("links", values.links.filter((_, j) => j !== i))}
                        >
                          <X aria-hidden size={18} strokeWidth={1.75} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {values.links.length < limits.links && (
                  <button type="button" className="btn btn-link links__add" onClick={() => set("links", [...values.links, ""])}>
                    <Plus aria-hidden size={16} strokeWidth={2} />
                    Add another link
                  </button>
                )}
              </fieldset>
            </div>
          )}

          {step === 2 && (
            <div className="flow__body">
              {pkg === "launch" && !showAllFeatures ? (
                <div className="note">
                  <Info aria-hidden size={18} strokeWidth={1.75} />
                  <p>
                    Launch is a single custom page, so there is nothing to configure here.{" "}
                    <button type="button" className="note__link" onClick={() => setShowAllFeatures(true)}>
                      Need something more? Tell me what
                    </button>
                  </p>
                </div>
              ) : (
                <ChoiceGroup
                  legend="Features you have in mind"
                  hint="Pick any that apply. This helps me scope the project."
                  name="features"
                  type="checkbox"
                  optional
                  error={errors.features}
                  choices={featureChoices}
                  selected={values.features}
                  onToggle={toggleFeature}
                />
              )}
              <div aria-live="polite">
                {advancedPicked && pkg !== "custom" && (
                  <div className="note note--accent">
                    <Info aria-hidden size={18} strokeWidth={1.75} />
                    <p>
                      {copy.quoteNote}{" "}
                      <button type="button" className="note__link" onClick={() => set("package", "custom")}>
                        Switch to Custom
                      </button>{" "}
                      or keep {packageChoices.find((c) => c.id === pkg)?.name ?? "this package"} and I&rsquo;ll follow up.
                    </p>
                  </div>
                )}
              </div>
              <ChoiceGroup
                legend="When would you like this live?"
                name="timeline"
                type="radio"
                optional
                error={errors.timeline}
                choices={timelines}
                selected={values.timeline ? [values.timeline] : []}
                onToggle={(id) => set("timeline", values.timeline === id ? "" : id)}
              />
              {pkg === "custom" && (
                <ChoiceGroup
                  legend="What's the approximate budget range?"
                  name="budget"
                  type="radio"
                  optional
                  error={errors.budget}
                  choices={budgets}
                  selected={values.budget ? [values.budget] : []}
                  onToggle={(id) => set("budget", values.budget === id ? "" : id)}
                />
              )}
            </div>
          )}

          {step === 3 && (
            <div className="flow__body">
              <TextField label="Name" name="name" autoComplete="name" value={values.name} onValueChange={(v) => set("name", v)} error={errors.name} />
              <TextField
                label="Email"
                type="email"
                name="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                value={values.email}
                onValueChange={(v) => set("email", v)}
                error={errors.email}
              />
              <TextField
                label="Phone"
                optional
                type="tel"
                name="phone"
                inputMode="tel"
                autoComplete="tel"
                value={values.phone}
                onValueChange={(v) => set("phone", v)}
                error={errors.phone}
              />
              <TextField
                label="Organization or business"
                optional
                name="organization"
                autoComplete="organization"
                value={values.organization}
                onValueChange={(v) => set("organization", v)}
                error={errors.organization}
              />
              {/* Honeypot: hidden from people and assistive tech; bots that fill it are dropped server-side. */}
              <div aria-hidden className="hp">
                <label>
                  Leave this field empty
                  <input type="text" name="website_url" tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} />
                </label>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flow__body">
              <Review values={values} onEdit={go} />
              <p className="flow__consent">{copy.consent}</p>
              {status === "error" && (
                <p role="alert" className="flow__error">
                  <span className="sr-only">Error: </span>
                  {failure}
                </p>
              )}
            </div>
          )}

          <div className="flow__actions">
            {step > 0 ? (
              <Button variant="secondary" icon={false} onClick={() => go(step - 1)} disabled={sending}>
                <ArrowLeft aria-hidden size={16} strokeWidth={1.75} />
                Back
              </Button>
            ) : (
              <Link href="/" className="btn btn-link">
                Cancel
              </Link>
            )}
            {step < steps.length - 1 ? (
              <Button type="submit" icon="right">
                Continue
              </Button>
            ) : (
              <button type="submit" className="btn btn-primary" disabled={sending} aria-busy={sending}>
                {sending ? (
                  <>
                    <Loader2 aria-hidden size={16} className="spin" />
                    Sending
                  </>
                ) : (
                  <>
                    {status === "error" ? "Try again" : "Send request"}
                    <ArrowRight aria-hidden size={16} strokeWidth={1.75} className="btn__icon btn__icon--right" />
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </GlassSurface>
    </div>
  );
};

const Success = ({ email }: { email: string }) => {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <GlassSurface variant="elevated" className="success">
      <span className="success__icon" aria-hidden>
        <Check size={22} strokeWidth={2.25} />
      </span>
      <h1 ref={ref} tabIndex={-1} className="t-h2 success__title">
        {copy.successTitle}
      </h1>
      <p className="t-lead">{copy.successBody}</p>
      <div className="success__next">
        <h2 className="t-label">What happens next</h2>
        <ol>
          <li>I read your request and review the scope.</li>
          <li>
            I email you at <strong>{email}</strong> with questions or next steps.
          </li>
          <li>Scope and price are agreed with you before any work starts.</li>
        </ol>
      </div>
      <Button href="/" variant="secondary" icon="right">
        Back to Northframe
      </Button>
    </GlassSurface>
  );
};
