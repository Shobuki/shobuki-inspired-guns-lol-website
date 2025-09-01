"use client";
import * as React from "react";

type DivProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: DivProps) {
  return (
    <div
      className={
        [
          "rounded-2xl border border-zinc-800 bg-card text-card-foreground shadow-sm",
          className,
        ]
          .filter(Boolean)
          .join(" ")
      }
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: DivProps) {
  return (
    <div
      className={[
        "p-6 text-sm text-foreground/90",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

