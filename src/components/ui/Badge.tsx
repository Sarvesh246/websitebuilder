import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

const tones = {
  accent: "",
  neutral: "badge--neutral",
  outline: "badge--outline",
} as const;

type BadgeProps = { tone?: keyof typeof tones } & ComponentPropsWithoutRef<"span">;

export const Badge = ({ tone = "accent", className, ...props }: BadgeProps) => (
  <span className={cn("badge", tones[tone], className)} {...props} />
);
