import type { ComponentPropsWithoutRef, ElementType } from "react";
import { cn } from "@/lib/cn";

const sizes = {
  page: "max-w-[var(--container-page)]",
  wide: "max-w-[var(--container-wide)]",
  narrow: "max-w-[var(--container-narrow)]",
  prose: "max-w-[var(--container-prose)]",
} as const;

type ContainerProps<T extends ElementType> = {
  as?: T;
  /** page: main content. wide: bleeding artwork. narrow: focused blocks. prose: long text. */
  size?: keyof typeof sizes;
} & Omit<ComponentPropsWithoutRef<T>, "as">;

export const Container = <T extends ElementType = "div">({
  as,
  size = "page",
  className,
  ...props
}: ContainerProps<T>) => {
  const Tag: ElementType = as ?? "div";
  return (
    <Tag
      className={cn("relative mx-auto w-full px-[var(--gutter)]", sizes[size], className)}
      {...props}
    />
  );
};
