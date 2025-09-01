"use client";
import * as React from "react";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: "default" | "secondary" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
};

export function Button({
  asChild = false,
  className,
  children,
  variant = "default",
  size = "default",
  ...rest
}: ButtonProps) {
  const base = [
    "inline-flex items-center justify-center gap-2",
    "rounded-md text-sm font-medium",
    "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    "disabled:pointer-events-none disabled:opacity-50",
  ]
    .filter(Boolean)
    .join(" ");

  const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
    default: "bg-foreground text-background hover:opacity-90",
    secondary: "bg-zinc-900 text-zinc-100 border border-zinc-800 hover:bg-zinc-800",
    outline: "border border-zinc-800 bg-transparent text-foreground hover:bg-zinc-900",
    ghost: "bg-transparent hover:bg-zinc-900",
    link: "bg-transparent underline underline-offset-4 hover:no-underline",
  };

  const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
    default: "h-10 px-4 py-2",
    sm: "h-9 px-3",
    lg: "h-11 px-8",
    icon: "h-10 w-10",
  };

  const classes = [base, variantClasses[variant], sizeClasses[size], className]
    .filter(Boolean)
    .join(" ");

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{ className?: string }>;
    return React.cloneElement(child, {
      className: [classes, child.props.className].filter(Boolean).join(" "),
      ...rest,
    });
  }

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
