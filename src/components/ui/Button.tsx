import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

const variants = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  link: "btn-link",
} as const;

type Shared = {
  variant?: keyof typeof variants;
  size?: "md" | "lg";
  block?: boolean;
  /** diag = arrow-up-right (start/external actions), right = arrow-right (navigate). */
  icon?: "diag" | "right" | false;
  children: ReactNode;
};

type ButtonAsLink = Shared & { href: string } & Omit<ComponentPropsWithoutRef<typeof Link>, "href">;
type ButtonAsButton = Shared & { href?: undefined } & ComponentPropsWithoutRef<"button">;

export const Button = (props: ButtonAsLink | ButtonAsButton) => {
  const { variant = "primary", size = "md", block, icon = false, children, className, ...rest } = props;
  const classes = cn(
    "btn",
    variants[variant],
    size === "lg" && variant !== "link" && "btn-lg",
    block && "btn-block",
    className,
  );
  const Icon = icon === "diag" ? ArrowUpRight : ArrowRight;
  const content = (
    <>
      {children}
      {icon && <Icon aria-hidden size={16} strokeWidth={1.75} className={cn("btn__icon", `btn__icon--${icon}`)} />}
    </>
  );

  if ("href" in rest && rest.href !== undefined) {
    const { href, ...linkRest } = rest as Omit<ButtonAsLink, keyof Shared>;
    return (
      <Link href={href} className={classes} {...linkRest}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" className={classes} {...(rest as ComponentPropsWithoutRef<"button">)}>
      {content}
    </button>
  );
};
