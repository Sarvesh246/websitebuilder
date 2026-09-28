import { Check } from "lucide-react";
import { useId, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Form primitives for the inquiry flow. Visuals live in styles/inquiry.css (.field, .choice...).
 * Every control has a real label, hint and error wired through aria-describedby; errors carry an
 * icon-free text prefix ("Error:") for screen readers and are never colour-only.
 */
type FieldShellProps = {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: (aria: { id: string; "aria-describedby"?: string; "aria-invalid"?: true }) => ReactNode;
  className?: string;
};

export const Field = ({ label, hint, error, optional, children, className }: FieldShellProps) => {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("field", className)} data-invalid={error ? "" : undefined}>
      <label htmlFor={id} className="field__label">
        {label}
        {optional && <span className="field__optional"> (optional)</span>}
      </label>
      {hint && (
        <p id={hintId} className="field__hint">
          {hint}
        </p>
      )}
      {children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined })}
      {error && (
        <p id={errorId} className="field__error">
          <span className="sr-only">Error: </span>
          {error}
        </p>
      )}
    </div>
  );
};

type TextFieldProps = Omit<ComponentPropsWithoutRef<"input">, "onChange" | "value" | "id"> & {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  value: string;
  onValueChange: (value: string) => void;
};

export const TextField = ({ label, hint, error, optional, value, onValueChange, className, ...input }: TextFieldProps) => (
  <Field label={label} hint={hint} error={error} optional={optional} className={className}>
    {(aria) => <input {...input} {...aria} className="field__control" value={value} onChange={(e) => onValueChange(e.target.value)} />}
  </Field>
);

type TextAreaProps = Omit<ComponentPropsWithoutRef<"textarea">, "onChange" | "value" | "id"> & {
  label: string;
  hint?: string;
  error?: string;
  value: string;
  onValueChange: (value: string) => void;
  counter?: number;
};

export const TextAreaField = ({ label, hint, error, value, onValueChange, counter, ...area }: TextAreaProps) => (
  <Field label={label} hint={hint} error={error}>
    {(aria) => (
      <>
        <textarea {...area} {...aria} className="field__control field__control--area" value={value} onChange={(e) => onValueChange(e.target.value)} />
        {counter !== undefined && value.length > counter * 0.8 && (
          <p className="field__count" aria-live="polite">
            {value.length.toLocaleString("en-US")} / {counter.toLocaleString("en-US")}
          </p>
        )}
      </>
    )}
  </Field>
);

export type Choice = { id: string; label: string; description?: string; meta?: string };

type ChoiceGroupProps = {
  legend: string;
  hint?: string;
  error?: string;
  name: string;
  type: "radio" | "checkbox";
  choices: readonly Choice[];
  selected: readonly string[];
  onToggle: (id: string) => void;
  /** card = larger tiles with description; chip = compact single-line options. */
  layout?: "card" | "chip";
  optional?: boolean;
  className?: string;
};

/** Fieldset of native radios/checkboxes styled as tiles. Keyboard and screen-reader behaviour stay native. */
export const ChoiceGroup = ({ legend, hint, error, name, type, choices, selected, onToggle, layout = "chip", optional, className }: ChoiceGroupProps) => {
  const id = useId();
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <fieldset className={cn("field choice-set", className)} aria-describedby={describedBy} data-invalid={error ? "" : undefined}>
      <legend className="field__label">
        {legend}
        {optional && <span className="field__optional"> (optional)</span>}
      </legend>
      {hint && (
        <p id={`${id}-hint`} className="field__hint">
          {hint}
        </p>
      )}
      <div className={cn("choices", `choices--${layout}`)}>
        {choices.map((choice) => (
          <label key={choice.id} className="choice">
            <input
              type={type}
              name={name}
              value={choice.id}
              checked={selected.includes(choice.id)}
              onChange={() => onToggle(choice.id)}
              aria-invalid={error ? true : undefined}
            />
            <span className="choice__body">
              <span className="choice__mark" aria-hidden>
                {type === "checkbox" && <Check size={14} strokeWidth={2.5} />}
              </span>
              <span className="choice__text">
                <span className="choice__label">{choice.label}</span>
                {choice.meta && <span className="choice__meta">{choice.meta}</span>}
                {choice.description && <span className="choice__desc">{choice.description}</span>}
              </span>
            </span>
          </label>
        ))}
      </div>
      {error && (
        <p id={`${id}-error`} className="field__error">
          <span className="sr-only">Error: </span>
          {error}
        </p>
      )}
    </fieldset>
  );
};
