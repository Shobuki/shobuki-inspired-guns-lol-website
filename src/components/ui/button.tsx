"use client";
import * as React from "react";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: "default" | "secondary" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
};

export function Button({
  asChild,
  className,
  children,
  // Accept but don’t enforce variants/sizes to keep simple
  variant: _variant,
  size: _size,
  ...rest
}: ButtonProps) {
  const base = [
    "inline-flex items-center justify-center gap-2",
    "rounded-md text-sm font-medium",
    "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    "disabled:pointer-events-none disabled:opacity-50",
    "h-10 px-4 py-2",
  ]
    .filter(Boolean)
    .join(" ");

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement, {
      className: [base, (children as any).props?.className, className]
        .filter(Boolean)
        .join(" "),
      ...rest,
    });
  }

  return (
    <button className={[base, className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </button>
  );
}

